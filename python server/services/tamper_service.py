import os
import uuid
from PIL import Image
from tamper.watermark import embed_lsb, extract_lsb, add_visible_watermark

UPLOAD_DIR = "static"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def protect_image(file, watermark_text="Tamper-Protected-Image"):
    try:
        # Open image safely
        image = Image.open(file).convert("RGB")

        # Invisible watermark
        image = embed_lsb(image, watermark_text)

        # Visible watermark
        image = add_visible_watermark(image, watermark_text)

        # Save protected image
        image_filename = f"{uuid.uuid4().hex}.png"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        image.save(image_path)

        return {
            "protectedImage": f"static/{image_filename}",
            "watermark": watermark_text
        }

    except Exception as e:
        raise RuntimeError(f"Failed to protect image: {str(e)}")


def verify_image(file, watermark_text="Tamper-Protected-Image"):
    try:
        image = Image.open(file).convert("RGB")

        # Extract invisible watermark
        extracted_watermark = extract_lsb(image)
        tampered = extracted_watermark != watermark_text

        return {
            "tampered": tampered,
            "extracted_watermark": extracted_watermark
        }

    except Exception as e:
        raise RuntimeError(f"Failed to verify image: {str(e)}")
