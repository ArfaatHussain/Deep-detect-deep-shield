import torch

checkpoint = torch.load("trained_models/deepfake-video-detection.pth", map_location="cpu")
print(checkpoint)