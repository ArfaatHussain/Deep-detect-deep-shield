from pytorch_grad_cam import LayerCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
import numpy as np
import torch
import cv2


def generate_layer_cam(model, input_tensor, target_layer, target_category=None):
    """
    Generate LayerCAM heatmap for the given input image.
    """
    model.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    input_tensor = input_tensor.to(device)

    # Initialize LayerCAM instead of GradCAM++
    cam = LayerCAM(model=model, target_layers=[target_layer])

    with torch.enable_grad():
        grayscale_cam = cam(input_tensor=input_tensor, targets=target_category)

    # Normalize
    grayscale_cam = grayscale_cam[0, :]
    grayscale_cam = (grayscale_cam - grayscale_cam.min()) / (grayscale_cam.max() - grayscale_cam.min() + 1e-8)
    return grayscale_cam


def postprocess_cam(grad_cam, blur=True, normalize=True):
    """
    Optional smoothing and normalization.
    """
    cam = np.float32(grad_cam)
    cam = np.maximum(cam, 0)

    if normalize:
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

    if blur:
        cam = cv2.GaussianBlur(cam, (11, 11), 0)

    return cam


def create_gradcam_overlay(original_img, cam, colormap=cv2.COLORMAP_JET, alpha=0.6):
    """
    Create red-yellow overlay highlighting most important regions.
    """
    img = np.float32(original_img) / 255.0
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), colormap)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    heatmap = np.float32(heatmap) / 255.0

    overlay = heatmap * alpha + img * (1 - alpha)
    overlay = np.clip(overlay, 0, 1)
    return np.uint8(255 * overlay)
