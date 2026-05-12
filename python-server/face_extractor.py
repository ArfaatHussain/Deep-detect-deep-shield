import cv2
from retinaface import RetinaFace

def detect_and_crop_face(image):
    if image is None:
        print("[ERROR] Image is None.")
        return None

    faces = RetinaFace.detect_faces(image)  # accepts numpy array

    if not faces or not isinstance(faces, dict):
        print("[INFO] No faces found!")
        return None

    print(f"[INFO] Found {len(faces)} face(s)!")

    # Take the largest face by area
    best = max(faces.values(), key=lambda f: (
        (f['facial_area'][2] - f['facial_area'][0]) *
        (f['facial_area'][3] - f['facial_area'][1])
    ))

    x1, y1, x2, y2 = map(int, best['facial_area'])

    # Crop exactly what RetinaFace detected — no extra padding
    cropped_face = image[y1:y2, x1:x2]

    return cropped_face