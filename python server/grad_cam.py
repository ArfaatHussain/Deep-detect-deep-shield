import torch
import numpy as np
import cv2
def generate_grad_cam(model, input_image, target_class=0):
    gradients = None
    feature_maps = None

    def save_gradient(grad):
        nonlocal gradients
        gradients = grad

    def save_feature_maps(module, input, output):
        nonlocal feature_maps
        feature_maps = output

    last_conv_layer = model.base_model.conv4
    last_conv_layer.register_forward_hook(save_feature_maps)
    last_conv_layer.register_backward_hook(lambda m, gi, go: save_gradient(go[0]))

    # Forward pass
    output = model(input_image)

    # Zero gradients
    model.zero_grad()

    # Backward pass for the target class
    output[0].backward()

    # Convert to numpy
    gradients = gradients[0].cpu().detach().numpy()
    feature_maps = feature_maps[0].cpu().detach().numpy()

    # Compute weights
    weights = np.mean(gradients, axis=(1, 2))
    grad_cam = np.zeros(feature_maps.shape[1:], dtype=np.float32)
    for i, weight in enumerate(weights):
        grad_cam += weight * feature_maps[i]

    grad_cam = np.maximum(grad_cam, 0)
    grad_cam = cv2.resize(grad_cam, (299, 299))
    grad_cam = grad_cam / grad_cam.max()

    return grad_cam
