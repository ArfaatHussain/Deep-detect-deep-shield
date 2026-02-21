from flask import Flask, request, jsonify, send_from_directory
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
import cv2
import numpy as np
import uuid
import traceback

from grad_cam_generator import create_gradcam_overlay, generate_layer_cam ,postprocess_cam
from xai import analyze_heatmap_regions, generate_dynamic_explanation
from face_extractor import detect_and_crop_face_and_hair
from model import CustomXception  # import class definition
import timm


# -----------------------------
# 📦 Setup and Model Loading
# -----------------------------
os.makedirs('static', exist_ok=True)
print("Loading PyTorch model...")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Allow your custom class for safe unpickling
torch.serialization.add_safe_globals([CustomXception])

# 🔹 Load the entire saved model (since you used torch.save(model, ...))
model = torch.load(
    "trained_models/deepfake_image_detection_XceptionNet.pth",
    map_location=device,
    weights_only=False
)
model.to(device)
model.eval()

print("✅ Model loaded successfully")

# -----------------------------
# 🚀 Flask App Setup
# -----------------------------
app = Flask(__name__)


@app.route('/static/<filename>')
def send_image(filename):
    return send_from_directory('static', filename)

# -----------------------------
# 🧠 Prediction Endpoint
# -----------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Load and preprocess image
        img = Image.open(file.stream).convert('RGB')
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

        # Detect and crop face
        cropped_img = detect_and_crop_face_and_hair(img_cv)
        if cropped_img is None:
            return jsonify({"error": "No face detected in the image."}), 400

        img = Image.fromarray(cv2.cvtColor(cropped_img, cv2.COLOR_BGR2RGB))

        transform = transforms.Compose([
            transforms.Resize((299, 299)),
            transforms.ToTensor(),
        ])
        img_tensor = transform(img).unsqueeze(0).to(device)

        # Run prediction
        with torch.no_grad():
            output = model(img_tensor)
            prob = torch.sigmoid(output)
            pred_class = (prob >= 0.5).float().item()
            confidence_score = abs(prob.item() - 0.5) * 2

        label = "Fake Image" if pred_class == 0 else "Real Image"
        print("Output:", output)
        print("Predicted class probability:", prob)

        # If Real → no Grad-CAM visualization needed
        if pred_class == 1:
            return jsonify({
                "class": label,
                "confidence_score": confidence_score,
                "explanation": "The image appears authentic. No manipulation detected."
            })

        # Otherwise generate Grad-CAM
        target_layer = dict(model.base_model.named_modules())['conv4.pointwise']

        # Make sure gradients are enabled
        for param in model.parameters():
            param.requires_grad = True

        cam = generate_layer_cam(model, img_tensor, target_layer)
        cam = postprocess_cam(cam)

        # Match CAM size to original image (299x299)
        original_np = np.array(img)
        cam_resized = cv2.resize(cam, (original_np.shape[1], original_np.shape[0]))

        # Create overlay
        overlay = create_gradcam_overlay(original_np, cam_resized)

        # Save highlighted image
        unique_filename = f"gradcam_{uuid.uuid4().hex}.png"
        output_path = os.path.join('static', unique_filename)
        Image.fromarray(overlay).save(output_path)

        # Analyze heatmap and generate textual explanation
        main_focus, regions, significant_regions, avg_intensity, activation_ratio = analyze_heatmap_regions(cam_resized)
        explanation = generate_dynamic_explanation(pred_class, main_focus, significant_regions, avg_intensity, activation_ratio)

        return jsonify({
            "class": label,
            "confidence_score": confidence_score,
            "highlightedImage": f"/static/{unique_filename}",
            "explanation": explanation
        })

    except Exception as e:
        print("Error during prediction:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# -----------------------------
# 🖥️ Run Server
# -----------------------------
if __name__ == '__main__':
    for name, module in model.base_model.named_modules():
        if isinstance(module, torch.nn.Conv2d):
            print(name)

    app.run(host="0.0.0.0", port=5001, debug=True)
