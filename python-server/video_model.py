import cv2
import torch
import numpy as np
import face_alignment
import torch.nn as nn
from torchvision import models, transforms
from torchvision.models import ResNet18_Weights

# ── Device: picked once at import time ────────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

if DEVICE.type == "cuda":
    torch.backends.cudnn.benchmark = True      # auto-tune convolution kernels
    torch.backends.cuda.matmul.allow_tf32 = True
    print(f"[GPU] {torch.cuda.get_device_name(0)} | "
          f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB VRAM")
else:
    print("[WARN] CUDA not available – running on CPU.")

SEQ_LEN     = 50
NUM_POIS    = 7
FEATURE_DIM = 512 * NUM_POIS


# ── Swish activation ──────────────────────────────────────────────────────────
class Swish(nn.Module):
    def forward(self, x):
        return x * torch.sigmoid(x)


# ── ResNet backbone ───────────────────────────────────────────────────────────
def replace_relu(module):
    for name, child in module.named_children():
        if isinstance(child, nn.ReLU):
            setattr(module, name, Swish())
        else:
            replace_relu(child)


def build_resnet_swish():
    weights = ResNet18_Weights.DEFAULT
    model   = models.resnet18(weights=weights)
    replace_relu(model)
    model.fc = nn.Identity()
    return model


# ── LSTM model ────────────────────────────────────────────────────────────────
class ResNetSwishBiLSTM(nn.Module):
    def __init__(self, feature_dim):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=feature_dim,
            hidden_size=256,
            bidirectional=True,
            batch_first=True,
        )
        self.fc = nn.Sequential(
            nn.Linear(512, 128),
            Swish(),
            nn.Dropout(0.5),
            nn.Linear(128, 1),
        )

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        pooled      = torch.mean(lstm_out, dim=1)
        return self.fc(pooled).squeeze(1)


# ── Main detector class ───────────────────────────────────────────────────────
class DeepfakeVideoDetector:

    def __init__(self, model_path, device=None):
        # FIX 1: Always use torch.device, not a plain string
        self.device = torch.device(device) if device else DEVICE

        # ── Backbone ──────────────────────────────────────────────────────────
        self.backbone = build_resnet_swish().to(self.device)
        self.backbone.eval()

        # FIX 2: Enable FP16 on GPU for ~2x faster inference & half the VRAM
        if self.device.type == "cuda":
            self.backbone = self.backbone.half()

        # ── LSTM head ─────────────────────────────────────────────────────────
        self.model = ResNetSwishBiLSTM(FEATURE_DIM).to(self.device)

        checkpoint = torch.load(model_path, map_location=self.device, weights_only=True)
        if isinstance(checkpoint, dict) and "model_state" in checkpoint:
            self.model.load_state_dict(checkpoint["model_state"])
        else:
            self.model.load_state_dict(checkpoint)

        self.model.eval()

        # FIX 3: Cast LSTM head to FP16 as well
        if self.device.type == "cuda":
            self.model = self.model.half()

        # ── Face alignment – must stay on same device ─────────────────────────
        # FIX 4: face_alignment needs the string form of device ("cuda" / "cpu")
        self.fa = face_alignment.FaceAlignment(
            face_alignment.LandmarksType.TWO_D,
            device=self.device.type,   # <── was: self.device (caused CPU fallback)
            flip_input=False,
        )

        # ── Transform (CPU-side; ToTensor normalises to [0,1]) ────────────────
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std =[0.229, 0.224, 0.225],
            ),
        ])

        # ── Warm-up: initialise CUDA kernels now, not on first request ─────────
        self._warmup()

    # ── Warm-up ───────────────────────────────────────────────────────────────
    def _warmup(self):
        if self.device.type != "cuda":
            return
        dummy_crops = torch.zeros(NUM_POIS, 3, 224, 224,
                                  device=self.device, dtype=torch.float16)
        dummy_seq   = torch.zeros(1, SEQ_LEN, FEATURE_DIM,
                                  device=self.device, dtype=torch.float16)
        with torch.no_grad():
            self.backbone(dummy_crops)
            self.model(dummy_seq)
        torch.cuda.synchronize()
        print("[GPU] Warm-up complete.")

    # ── POI extraction ────────────────────────────────────────────────────────
    def extract_pois(self, landmarks):
        return {
            "chin"       : landmarks[8],
            "nose"       : landmarks[30],
            "left_cheek" : landmarks[4],
            "right_cheek": landmarks[12],
            "left_edge"  : landmarks[0],
            "right_edge" : landmarks[16],
            "forehead"   : (landmarks[19] + landmarks[24]) / 2,
        }

    # ── Crop ──────────────────────────────────────────────────────────────────
    def crop_region(self, frame, center, size=64):
        h, w, _ = frame.shape
        x, y    = int(center[0]), int(center[1])
        x1, y1  = max(0, x - size), max(0, y - size)
        x2, y2  = min(w, x + size), min(h, y + size)
        crop    = frame[y1:y2, x1:x2]
        if crop.size == 0:
            crop = np.zeros((size * 2, size * 2, 3), dtype=np.uint8)
        return cv2.resize(crop, (224, 224))

    # ── Feature extraction ────────────────────────────────────────────────────
    def extract_video_features(self, video_path):
        cap           = cv2.VideoCapture(video_path)
        seq_features  = []
        frame_count   = 0
        total_frames  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"📹 Processing: {video_path} ({total_frames} frames)")

        with torch.no_grad():
            while frame_count < SEQ_LEN:
                ret, frame = cap.read()
                if not ret:
                    print(f"⚠️  End of video at frame {frame_count}")
                    break

                rgb       = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                landmarks = self.fa.get_landmarks(rgb)

                if landmarks is None:
                    print(f"⚠️  Frame {frame_count}: no face detected, skipping")
                    continue

                pois = self.extract_pois(landmarks[0])

                # Build a batch of all 7 POI crops and push to GPU at once
                crops = [self.transform(self.crop_region(rgb, p)) for p in pois.values()]
                crops_batch = torch.stack(crops, dim=0).to(self.device)  # [7,3,224,224]

                # FIX 5: Cast crop batch to FP16 to match the FP16 backbone
                if self.device.type == "cuda":
                    crops_batch = crops_batch.half()

                feats = self.backbone(crops_batch)   # [7, 512]
                feats = feats.view(-1)               # [512*7]

                # FIX 6: Keep features on GPU; only move to CPU at the very end
                seq_features.append(feats)

                frame_count += 1
                if frame_count % 5 == 0 or frame_count == SEQ_LEN:
                    print(f"⏳ {frame_count}/{SEQ_LEN} frames processed")

        cap.release()

        if not seq_features:
            print("⚠️  No features extracted – using zero vector")
            seq_features.append(
                torch.zeros(FEATURE_DIM, device=self.device,
                            dtype=torch.float16 if self.device.type == "cuda" else torch.float32)
            )

        # FIX 7: Stack on GPU, add batch dim – no CPU round-trip
        seq_tensor = torch.stack(seq_features, dim=0).unsqueeze(0)  # [1, T, FEATURE_DIM]
        print(f"✅ Feature extraction done – {frame_count} frames used")
        return seq_tensor

    # ── Predict ───────────────────────────────────────────────────────────────
    def predict(self, video_path):
        print(f"🔍 Predicting: {video_path}")
        seq = self.extract_video_features(video_path)

        with torch.no_grad():
            # FIX 8: Cast sequence to FP16 on GPU before passing to LSTM
            if self.device.type == "cuda":
                seq = seq.half()

            logit = self.model(seq)
            prob  = torch.sigmoid(logit).item()

        label = "FAKE" if prob > 0.5 else "REAL"
        print(f"🎯 Result: {label} ({prob:.4f})")
        return label, prob