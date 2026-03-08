import cv2
import torch
import numpy as np
import face_alignment
import torch.nn as nn
from torchvision import models, transforms
from torchvision.models import ResNet18_Weights

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

SEQ_LEN = 50
NUM_POIS = 7
FEATURE_DIM = 512 * NUM_POIS


# ---------------- SWISH ----------------
class Swish(nn.Module):
    def forward(self, x):
        return x * torch.sigmoid(x)


# ---------------- RESNET BACKBONE ----------------
def replace_relu(module):
    for name, child in module.named_children():
        if isinstance(child, nn.ReLU):
            setattr(module, name, Swish())
        else:
            replace_relu(child)


def build_resnet_swish():
    weights = ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    replace_relu(model)
    model.fc = nn.Identity()
    return model


# ---------------- LSTM MODEL ----------------
class ResNetSwishBiLSTM(nn.Module):
    def __init__(self, feature_dim):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=feature_dim,
            hidden_size=256,
            bidirectional=True,
            batch_first=True
        )

        self.fc = nn.Sequential(
            nn.Linear(512, 128),
            Swish(),
            nn.Dropout(0.5),
            nn.Linear(128, 1)
        )

    def forward(self, x):

        lstm_out, _ = self.lstm(x)

        pooled = torch.mean(lstm_out, dim=1)

        return self.fc(pooled).squeeze(1)


# ---------------- MODEL LOADER ----------------
class DeepfakeVideoDetector:

    def __init__(self, model_path, device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        # Backbone for feature extraction
        self.backbone = build_resnet_swish().to(self.device)
        self.backbone.eval()

        # Video LSTM model
        self.model = ResNetSwishBiLSTM(FEATURE_DIM).to(self.device)

        # Load checkpoint safely
        checkpoint = torch.load(model_path, map_location=self.device)
        if isinstance(checkpoint, dict) and "model_state" in checkpoint:
            # Original training format
            self.model.load_state_dict(checkpoint["model_state"])
        else:
            # Plain state_dict (your current checkpoint)
            self.model.load_state_dict(checkpoint)

        self.model.eval()

        # Face alignment
        self.fa = face_alignment.FaceAlignment(
            face_alignment.LandmarksType.TWO_D,
            device=self.device,
            flip_input=False
        )

        # Preprocessing transform
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])


    # ---------------- POI EXTRACTION ----------------
    def extract_pois(self, landmarks):

        return {
            "chin": landmarks[8],
            "nose": landmarks[30],
            "left_cheek": landmarks[4],
            "right_cheek": landmarks[12],
            "left_edge": landmarks[0],
            "right_edge": landmarks[16],
            "forehead": (landmarks[19] + landmarks[24]) / 2
        }


    # ---------------- CROP ----------------
    def crop_region(self, frame, center, size=64):

        h, w, _ = frame.shape

        x, y = int(center[0]), int(center[1])

        x1, y1 = max(0, x-size), max(0, y-size)
        x2, y2 = min(w, x+size), min(h, y+size)

        crop = frame[y1:y2, x1:x2]

        if crop.size == 0:
            crop = np.zeros((size*2, size*2, 3), dtype=np.uint8)

        crop = cv2.resize(crop, (224, 224))

        return crop


    # ---------------- FEATURE EXTRACTION ----------------
    def extract_video_features(self, video_path):
        cap = cv2.VideoCapture(video_path)
        seq_features = []
        frame_count = 0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"📹 Processing video: {video_path} ({total_frames} frames)")

        with torch.no_grad():
            while frame_count < SEQ_LEN:
                ret, frame = cap.read()
                if not ret:
                    print(f"⚠️ End of video reached at frame {frame_count}")
                    break

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                landmarks = self.fa.get_landmarks(rgb)

                if landmarks is None:
                    print(f"⚠️ Frame {frame_count}: No face detected, skipping")
                    continue

                lm = landmarks[0]
                pois = self.extract_pois(lm)

                # ---------------- BATCH ALL POI CROPS ----------------
                crops = []
                for name, p in pois.items():
                    crop = self.crop_region(rgb, p)
                    crop = self.transform(crop)
                    crops.append(crop)
                crops_batch = torch.stack(crops, dim=0).to(self.device)  # [7,3,224,224]

                feats = self.backbone(crops_batch)        # [7,512]
                feats = feats.view(-1)                    # flatten to [512*7]
                seq_features.append(feats.cpu().numpy())

                frame_count += 1
                if frame_count % 5 == 0 or frame_count == SEQ_LEN:
                    print(f"⏳ Processed {frame_count}/{SEQ_LEN} frames")

        cap.release()

        if len(seq_features) == 0:
            print("⚠️ No features extracted, adding zero vector")
            seq_features.append(np.zeros(FEATURE_DIM))

        seq_features = np.stack(seq_features)
        print(f"✅ Finished feature extraction for {video_path}, total frames used: {len(seq_features)}\n")
        return torch.tensor(seq_features, dtype=torch.float32).unsqueeze(0).to(self.device)


    # ---------------- PREDICT ----------------
    def predict(self, video_path):
        print(f"🔍 Starting prediction for video: {video_path}")
        seq = self.extract_video_features(video_path)

        with torch.no_grad():
            logit = self.model(seq)
            prob = torch.sigmoid(logit).item()

        label = "FAKE" if prob > 0.5 else "REAL"
        print(f"🎯 Prediction complete: {label} ({prob:.4f})\n")
        return label, prob