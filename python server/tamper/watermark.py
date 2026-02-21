import numpy as np
from PIL import Image, ImageDraw

def add_visible_watermark(image, text):
    draw = ImageDraw.Draw(image)
    w, h = image.size
    draw.text((10, h - 30), text, fill=(255, 0, 0))
    return image

def embed_lsb(image, text):
    """
    Hide text in the image using LSB (least significant bit).
    """
    # Convert text to binary and add a termination sequence
    binary = ''.join(format(ord(c), '08b') for c in text) + '1111111111111110'

    # Make sure image is uint8
    img = np.array(image, dtype=np.uint8)
    flat = img.flatten()

    # Check if the text can fit in the image
    if len(binary) > len(flat):
        raise ValueError("Text is too long to embed in this image. Use a bigger image or shorter watermark.")

    # Embed each bit safely
    for i in range(len(binary)):
        flat[i] = (flat[i] & 0b11111110) | int(binary[i])

    # Reshape back to original image
    img_with_lsb = flat.reshape(img.shape)
    return Image.fromarray(img_with_lsb)


def extract_lsb(image):
    img = np.array(image)
    flat = img.flatten()
    bits = [str(flat[i] & 1) for i in range(8000)]

    chars = []
    for i in range(0, len(bits), 8):
        byte = ''.join(bits[i:i+8])
        if byte == '11111111':
            break
        chars.append(chr(int(byte, 2)))

    return ''.join(chars)
