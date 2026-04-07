import shutil

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
from deepfake_xai import ExplainableDeepfakeDetector
from helpers import _build_explanation_text, _build_region_analysis, _encode_frames, upload_to_cloudinary
from concurrent.futures import ThreadPoolExecutor
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
# detector = DeepfakeVideoDetector(MODEL_PATH)
detector = ExplainableDeepfakeDetector(MODEL_PATH)

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


def send_to_backend(data, endpoint="addDocumentToTamperProof"):
    try:
        requests.post(
            "http://localhost:5000/tamper/"+endpoint,
            json=data,
            timeout=5
        )
    except Exception as e:
        print("Backend request failed:", e)

from threading import Thread
@app.route("/protect", methods=["POST"])
def embed_watermark():
    if "image" not in request.files:
        return jsonify({"error": "Missing image"}), 400

    file = request.files["image"]
    owner = request.form.get("owner")

    if not owner:
        return jsonify({"error": "provide owner id"}), 400

    os.makedirs("uploads", exist_ok=True)

    # Save original
    original_filename = f"uploads/original-{uuid.uuid4().hex}.png"
    file.save(original_filename)

    # Apply watermark
    stego_image = lsb.hide(original_filename, WATERMARK)

    protected_filename = f"uploads/protected-{uuid.uuid4().hex}.png"
    stego_image.save(protected_filename)

    # 🚀 Parallel uploads
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_original = executor.submit(upload_to_cloudinary, original_filename)
        future_protected = executor.submit(upload_to_cloudinary, protected_filename)

        original_upload = future_original.result()
        protected_upload = future_protected.result()

    data_to_send = {
        "original_image_url": original_upload["secure_url"],
        "protected_image_url": protected_upload["secure_url"],
        "owner": owner
    }

    Thread(target=send_to_backend, args=(data_to_send,)).start()

    return jsonify({
        "message": "success",
        "data": data_to_send
    }), 200


@app.route("/verify", methods=["POST"])
def extract_watermark():

    if "image" not in request.files:
        return jsonify({"error": "Missing image"}), 400

    file = request.files["image"]
    owner = request.form.get("owner")

    if not owner:
        return jsonify({"error": "provide owner id"}), 400

    os.makedirs("uploads", exist_ok=True)

    provided_image = f"uploads/provided-{uuid.uuid4().hex}.png"
    file.save(provided_image)

    watermark_matched = False

    try:
        # Extract watermark
        extracted = lsb.reveal(provided_image)
        if extracted == "protected":
            watermark_matched = True

    except Exception as e:
        print("Error:", e)

    upload_result = upload_to_cloudinary(provided_image)
    uploaded_url = upload_result["secure_url"]
    print("Uploaded image url: ",uploaded_url)
        # Always delete local file
    if os.path.exists(provided_image):
        os.remove(provided_image)

    # Send to backend only if upload succeeded
    if uploaded_url:
        data_to_send = {
            "image_url": uploaded_url,
            "watermarked_matched": watermark_matched,
            "owner": owner
        }

        Thread(
            target=send_to_backend,
            args=(data_to_send, "addDocumentToTamperProofHistory")
        ).start()

    return jsonify({
        "message": "success",
        "image_url": uploaded_url,
        "watermark_matched": watermark_matched
    }), 200

@app.route("/predict-video", methods=["POST"])
def predict_video():

    if "video" not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    file = request.files["video"]

    ext        = os.path.splitext(file.filename)[-1] or ".mp4"
    safe_name  = f"{uuid.uuid4().hex}{ext}"
    video_path = os.path.join(UPLOAD_DIR, safe_name)
    file.save(video_path)

    xai_dir = os.path.join(UPLOAD_DIR, f"xai_{safe_name}")
    label   = None  # guard for finally block

    try:
        label, prob, explanation = detector.predict_with_explanation(video_path)

        # ── REAL video — return early, no XAI ────────────────────────────────
        if label != "FAKE" or explanation is None:
            return jsonify({
                "prediction":  label,
                "confidence":  round(float(prob), 4),
                "explanation": "The video appears authentic. No manipulation detected."
            })

        # ── FAKE video ────────────────────────────────────────────────────────
        explanation.save_report(xai_dir)  # generates video, populates video_url

        return jsonify({
            "prediction":       label,
            "confidence":       round(float(prob), 4),
            "explanation_text": _build_explanation_text(label, prob, explanation),
            "video_url":        explanation.video_url,
        })

    except Exception as e:
        app.logger.exception("Prediction failed")
        if os.path.exists(video_path):
            os.remove(video_path)
        # Remove XAI dir only if video was REAL (no output needed)
        if os.path.exists(xai_dir) and locals().get("label") != "FAKE":
            shutil.rmtree(xai_dir, ignore_errors=True)   
        return jsonify({"error": str(e)}), 500

# -----------------------------
# 🖥️ Run Server
# -----------------------------
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True, use_reloader=False)
