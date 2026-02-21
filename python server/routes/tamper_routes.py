from flask import Blueprint, request, jsonify
from services.tamper_service import protect_image, verify_image


tamper_bp = Blueprint("tamper", __name__)
watermark = "Tamper-Protected-Image"  
@tamper_bp.route("/protect", methods=["POST"])
def protect():
    try:
        file = request.files["image"]
        
        result = protect_image(file, watermark)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tamper_bp.route("/verify", methods=["POST"])
def verify():
    try:
        file = request.files["image"]
        result = verify_image(file, watermark)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500