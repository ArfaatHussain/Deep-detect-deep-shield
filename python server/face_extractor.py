import cv2
def detect_and_crop_face_and_hair(image):
    if image is None:
        print("[ERROR] Could not read the image.")
        return None
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faceCascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    if faceCascade.empty():
        print("[ERROR] Failed to load Haar cascade classifier.")
        return None

    faces = faceCascade.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=3,
        minSize=(30, 30)
    )

    if len(faces) == 0:
        print("[INFO] No faces found!")
        return None

    print("[INFO] Found {0} Faces!".format(len(faces)))

    for (x, y, w, h) in faces:
        # Adjust left space (shift the crop window to the right by 10% of width)
        left_space_shift = int(w * 0.1)
        left_x_new = x + left_space_shift
        left_x_new = min(left_x_new, image.shape[1] - w)

        expanded_y = max(y - int(h * 0.2), 0)
        expanded_h = h + int(h * 0.3)

        right_space_reduction = int(w * 0.2) 
        right_w_new = w - right_space_reduction 
        cropped_face_and_hair = image[expanded_y:expanded_y + expanded_h, left_x_new:left_x_new + right_w_new]
        # cv2.imwrite("img.jpg",cropped_face_and_hair)
        return cropped_face_and_hair
