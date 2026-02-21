from tamper.hash_utils import generate_hash
from tamper.watermark import extract_lsb

def verify_image(image_bytes, image, stored_hash, stored_watermark):
    new_hash = generate_hash(image_bytes)
    extracted = extract_lsb(image)

    return {
        "hashMatched": new_hash == stored_hash,
        "watermarkMatched": extracted == stored_watermark,
        "tampered": not (new_hash == stored_hash and extracted == stored_watermark)
    }
