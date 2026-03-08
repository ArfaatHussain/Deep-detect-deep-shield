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
from model import CustomXception  
import timm
from werkzeug.utils import secure_filename
from stegano import lsb
import requests
from video_model import DeepfakeVideoDetector
# -----------------------------
# 📦 Setup and Model Loading
# -----------------------------
UPLOAD_DIR = "uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)
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
WATERMARK="protected"


# ---------------------------------
#    Video Model Config

MODEL_PATH = "trained_models/deepfake-video-detection.pth"
detector = DeepfakeVideoDetector(MODEL_PATH)


# -------------------------------

# -----------------------------
# 🚀 Flask App Setup
# -----------------------------
app = Flask(__name__)


@app.route('/uploads/<filename>')
def send_image(filename):
    return send_from_directory('uploads', filename)

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
        output_path = os.path.join('uploads', unique_filename)
        Image.fromarray(overlay).save(output_path)

        # Analyze heatmap and generate textual explanation
        main_focus, regions, significant_regions, avg_intensity, activation_ratio = analyze_heatmap_regions(cam_resized)
        explanation = generate_dynamic_explanation(pred_class, main_focus, significant_regions, avg_intensity, activation_ratio)

        return jsonify({
            "class": label,
            "confidence_score": confidence_score,
            "highlightedImage": f"/uploads/{unique_filename}",
            "explanation": explanation
        })

    except Exception as e:
        print("Error during prediction:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500
 
UPLOAD_DIR = "uploads"

@app.route("/embed", methods=["POST"])
def embed_watermark():
    if "image" not in request.files:
        return jsonify({"error": "Missing image"}), 400

    file = request.files["image"]
    owner = request.form.get("owner")
    if not owner:
        return jsonify({"error": "provide owner id"})

    os.makedirs("uploads", exist_ok=True)

    # Save original first
    original_filename = f"uploads/original-{uuid.uuid4().hex}.png"
    file.save(original_filename)

    stego_image = lsb.hide(original_filename, WATERMARK)

    protected_filename = f"uploads/protected-{uuid.uuid4().hex}.png"
    stego_image.save(protected_filename)

    data_to_send = {
        "original_image_url": f"/{original_filename}",
        "protected_image_url": f"/{protected_filename}",
        "owner": owner
    }

    response = requests.post("http://localhost:5000/tamper/addDocumentToTamperProof", json=data_to_send)

    try:
        backend_response = response.json()
    except ValueError:
        backend_response = response.text

    return jsonify({
        "status": response.status_code,
        "backend_response": backend_response
    }), response.status_code


@app.route("/extract", methods=["POST"])
def extract_watermark():

    if "image" not in request.files:
        return jsonify({"extracted_watermark": None, "error": "Missing image"}), 400

    file = request.files["image"]
    owner = request.form.get("owner")
    if not owner:
        return jsonify({"error": "provide owner id"})

    os.makedirs("uploads", exist_ok=True)

    provided_image = f"uploads/provided-{uuid.uuid4().hex}.png"
    file.save(provided_image)
    extract_watermark=""
    watermark_matched = False
    try:
        extract_watermark = lsb.reveal(provided_image)

        if  extract_watermark and extract_watermark == "protected":
            watermark_matched = True 

    except Exception as e:
        print("Error: ",e)

        data_to_send = {
            "image_url": f"/{provided_image}", "watermarked_matched":watermark_matched,
            "owner": owner 
        }

        response = requests.post("http://localhost:5000/tamper/addDocumentToTamperProofHistory", json=data_to_send)

        try:
         backend_response = response.json()
        except ValueError:
         backend_response = response.text

        return jsonify({
        "status": response.status_code,
        "backend_response": backend_response
        }), response.status_code


@app.route("/predict-video", methods=["POST"])
def predict_video():

    if "video" not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    file = request.files["video"]

    video_path = os.path.join(UPLOAD_DIR, file.filename)

    file.save(video_path)

    label, prob = detector.predict(video_path)

    os.remove(video_path)

    return jsonify({
        "prediction": label,
        "confidence": float(prob)
    })


# -----------------------------
# 🖥️ Run Server
# -----------------------------
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True, use_reloader=False)
