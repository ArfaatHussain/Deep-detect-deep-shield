import numpy as np

def analyze_heatmap_regions(grad_cam, threshold_ratio=0.4):
    """
    Analyze Grad-CAM heatmap regions and identify where manipulations may have occurred.
    """
    h, w = grad_cam.shape

    # Normalize Grad-CAM values between 0–1
    norm_cam = (grad_cam - grad_cam.min()) / (grad_cam.max() - grad_cam.min() + 1e-8)

    # Divide the face into logical regions
    regions = {
        "forehead/hair": norm_cam[0:h//3, :].mean(),
        "eyes/nose": norm_cam[h//3:2*h//3, :].mean(),
        "mouth/chin": norm_cam[2*h//3:, :].mean(),
        "left side": norm_cam[:, :w//3].mean(),
        "center": norm_cam[:, w//3:2*w//3].mean(),
        "right side": norm_cam[:, 2*w//3:].mean(),
    }

    # Global intensity and threshold
    global_mean = np.mean(list(regions.values()))
    threshold = global_mean * (1 + threshold_ratio)

    # Detect areas that stand out (possible manipulation zones)
    significant_regions = [
        region for region, val in regions.items() if val >= threshold
    ]

    # Measure overall activity strength and spread
    activation_ratio = len(significant_regions) / len(regions)
    avg_intensity = float(np.mean(list(regions.values())))
    main_focus = max(regions, key=regions.get)

    return main_focus, regions, significant_regions, avg_intensity, activation_ratio


def generate_dynamic_explanation(pred_class, main_focus, significant_regions, avg_intensity, activation_ratio):
    """
    Generate clear and simple explanations that match the Grad-CAM visual output.
    """
    if pred_class == 1:
        return "This image looks real. No signs of editing or manipulation were found."

    # --- Severity level ---
    if avg_intensity < 0.25:
        severity = "slight"
    elif avg_intensity < 0.45:
        severity = "moderate"
    else:
        severity = "strong"

    # --- Spread description ---
    if activation_ratio >= 0.5:
        spread = "across most of the face"
    elif 0.2 <= activation_ratio < 0.5:
        spread = "in a few parts of the face"
    else:
        spread = "in a small area"

    # --- Friendly region names ---
    region_descriptions = {
        "forehead/hair": "forehead area",
        "eyes/nose": "eyes and nose area",
        "mouth/chin": "mouth or chin area",
        "left side": "left side of the face",
        "right side": "right side of the face",
        "center": "center of the face",
    }
    focus_desc = region_descriptions.get(main_focus, "face")

    # --- Generate final explanation ---
    if activation_ratio > 0.6:
        explanation = (
            f"This image is marked as Fake. Signs of {severity} manipulation were found "
            f"{spread}, mainly around the {focus_desc}. It looks like the entire face may have been altered."
        )
    elif len(significant_regions) > 1:
        readable_regions = ', '.join(region_descriptions.get(r, r) for r in significant_regions)
        explanation = (
            f"This image is marked as Fake. The system found {severity} editing signs "
            f"in multiple areas — such as the {readable_regions}."
        )
    else:
        explanation = (
            f"This image is marked as Fake. The system found {severity} editing signs "
            f"mainly around the {focus_desc}."
        )

    return explanation
