import os
import uuid
import base64
import shutil
import numpy as np
from flask import request, jsonify
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_to_cloudinary(file_path, folder="my-app/uploads"):
    try:
        result = cloudinary.uploader.upload(
            file_path,
            resource_type="auto",
            folder=folder
        )
        return result
    finally:
        # delete local file no matter what
        if os.path.exists(file_path):
            os.remove(file_path)

def _build_region_analysis(explanation) -> list:
    """Mean Grad-CAM activation per POI region, sorted most→least suspicious."""
    poi_means: dict[str, list[float]] = {p: [] for p in explanation.poi_names}
 
    for frame_maps in explanation.poi_heatmaps.values():
        for poi, hm in frame_maps.items():
            poi_means[poi].append(float(hm.mean()))
 
    rows = [
        {
            "region":           poi,
            "suspicion_score":  round(float(np.mean(vals)), 4) if vals else 0.0,
        }
        for poi, vals in poi_means.items()
    ]
    return sorted(rows, key=lambda r: r["suspicion_score"], reverse=True)
 
 
def _build_explanation_text(label: str, prob: float, explanation) -> str:
    """
    Returns a plain-English sentence explaining the verdict so a non-technical
    user can understand it.
    """
    confidence_word = (
        "very high"  if prob > 0.90 or prob < 0.10 else
        "high"       if prob > 0.75 or prob < 0.25 else
        "moderate"
    )
 
    top_regions = [
        r["region"]
        for r in _build_region_analysis(explanation)[:3]
    ]
    top_frames  = [str(f) for f in explanation.top_fake_frames[:3]]
 
    if label == "FAKE":
        return (
            f"This video is predicted to be FAKE with {confidence_word} confidence "
            f"({prob:.1%}). The model found manipulation evidence primarily around "
            f"the {', '.join(top_regions)} region(s). "
            f"Frames {', '.join(top_frames)} showed the strongest signs of tampering."
        )
    else:
        return (
            f"This video is predicted to be REAL with {confidence_word} confidence "
            f"({1 - prob:.1%}). No significant manipulation patterns were detected. "
            f"The {', '.join(top_regions)} region(s) were examined most closely."
        )
 
 
def _encode_frames(explanation, frame_indices: list[int] | None = None) -> list[dict]:
    """
    Base64-encode annotated frames so they can be embedded directly in the
    JSON response and rendered by a frontend without a separate file endpoint.

    Args:
        frame_indices: Optional list of indices to encode. If None, encodes all frames.
    """
    import cv2
    encoded = []

    # Use provided indices or fall back to all frames
    indices = frame_indices if frame_indices is not None else range(len(explanation.annotated_frames))

    for i in indices:
        frame_bgr = explanation.annotated_frames[i]
        ok, buf = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ok:
            encoded.append({
                "frame":     int(i + 1),  # 1-indexed for readability
                "image_b64": base64.b64encode(buf).decode("utf-8"),
            })
    return encoded