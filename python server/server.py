from flask import Flask, request, jsonify, send_from_directory
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
import cv2
import numpy as np
from model import CustomXception, model
from xai import analyze_heatmap_regions, generate_dynamic_explanation
from grad_cam import generate_grad_cam
from face_extractor import detect_and_crop_face_and_hair
import traceback
import uuid

# Ensure the 'static' directory exists
if not os.path.exists('static'):
    os.makedirs('static')

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
app = Flask(__name__)

@app.route('/static/<filename>')
def send_image(filename):
    return send_from_directory('static', filename)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if the request contains an image file
        if 'file' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Read the image from the file
        img = Image.open(file.stream).convert('RGB')
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

        # Detect and crop face and hair
        cropped_img = detect_and_crop_face_and_hair(img_cv)
        if cropped_img is None:
            return jsonify({"error": "No face detected in the image."}), 400

        img = Image.fromarray(cv2.cvtColor(cropped_img, cv2.COLOR_BGR2RGB))

        # Apply transformations for model input
        transform = transforms.Compose([
            transforms.Resize((299, 299)),
            transforms.ToTensor(),
        ])
        img_tensor = transform(img).unsqueeze(0).to(device)

        # Get prediction from the model
        with torch.no_grad():
            output = model(img_tensor)
            prob = torch.sigmoid(output)
            pred_class = (prob >= 0.5).float().item()
            confidence_score = abs(prob.item() - 0.5) * 2


        label = "Fake Image" if pred_class == 0 else "Real Image"

        # Generate Grad-CAM heatmap
        target_class = int(pred_class)
        # print("Target Class: ",target_class)
        print("Model Output (Raw):", output)
        if target_class == 1:
            return jsonify({
                "class": label,
                "confidence_score": confidence_score,
                "explanation": "The image is real. No manipulation detected in face."
            })
        grad_cam = generate_grad_cam(model, img_tensor, target_class)
        heatmap = cv2.applyColorMap(np.uint8(255 * grad_cam), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

        # Combine the original image with the Grad-CAM heatmap
        img_resized = img.resize((299, 299))
        img_array = np.array(img_resized)
        combined = (img_array * 0.5 + heatmap * 0.5).astype(np.uint8)
        combined = Image.fromarray(combined)
        unique_filename = f"grad_cam_output_{uuid.uuid4().hex}.png"
        combined_image_path = os.path.join('static', unique_filename)
        combined.save(combined_image_path)

        # Analyze heatmap regions and generate explanation
        main_focus, regions, significant_regions = analyze_heatmap_regions(grad_cam)
        explanation = generate_dynamic_explanation(pred_class, main_focus, significant_regions)

        return jsonify({
            "class": label,
            "confidence_score": confidence_score,
            "highlightedImage": f"/static/{unique_filename}",
            "explanation": explanation
        })

    except Exception as e:
        print("Error during prediction:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)

