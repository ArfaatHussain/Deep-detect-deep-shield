import torch
import torch.nn as nn
import torch.nn.functional as F
import timm

class CustomXception(nn.Module):
    def __init__(self, base_model):
        super().__init__()
        self.base_model = base_model
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc1 = nn.Linear(2048, 512)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(512, 1)

    def forward(self, x):
        x = self.base_model.forward_features(x)
        x = self.global_pool(x)
        x = torch.flatten(x, 1)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x
