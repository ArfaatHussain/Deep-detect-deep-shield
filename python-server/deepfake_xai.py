from __future__ import annotations

import os
import cv2
import math
import torch
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from torchvision import transforms

# ── Re-use everything from the original module ────────────────────────────────
from video_model import (          # ← adjust if your original file has a different name
    DEVICE, SEQ_LEN, NUM_POIS, FEATURE_DIM,
    DeepfakeVideoDetector, build_resnet_swish,
)

import face_alignment


# ══════════════════════════════════════════════════════════════════════════════
#  1.  Grad-CAM  (backbone – last conv layer)
# ══════════════════════════════════════════════════════════════════════════════

class GradCAMExtractor:
    """
    Registers forward/backward hooks on `target_layer` of a ResNet backbone.
    Call `compute(crop_batch)` to obtain per-crop 224×224 heatmaps.
    """

    def __init__(self, backbone: nn.Module, target_layer: Optional[nn.Module] = None):
        self.backbone = backbone

        # Default: last residual block's second conv
        self.target_layer = target_layer or self._last_conv(backbone)

        self._activations: Optional[torch.Tensor] = None
        self._gradients:   Optional[torch.Tensor] = None

        self._fwd_hook = self.target_layer.register_forward_hook(self._save_act)
        self._bwd_hook = self.target_layer.register_full_backward_hook(self._save_grad)

    # ── hooks ─────────────────────────────────────────────────────────────────
    def _save_act(self, _m, _i, output):
        self._activations = output.detach()

    def _save_grad(self, _m, _i, grad_output):
        self._gradients = grad_output[0].detach()

    # ── helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def _last_conv(model: nn.Module) -> nn.Module:
        """Return the very last Conv2d inside layer4."""
        last = None
        for m in model.modules():
            if isinstance(m, nn.Conv2d):
                last = m
        if last is None:
            raise RuntimeError("No Conv2d found in backbone.")
        return last

    def remove_hooks(self):
        self._fwd_hook.remove()
        self._bwd_hook.remove()

    # ── main API ──────────────────────────────────────────────────────────────
    def compute(
        self,
        crops_batch: torch.Tensor,   # [N, 3, 224, 224]  FP16 or FP32
    ) -> np.ndarray:                  # [N, 224, 224]  float32 in [0,1]
        """
        Returns Grad-CAM heatmap for each crop.
        The backbone must NOT be in torch.no_grad() during this call.
        """
        dtype_in = crops_batch.dtype
        # Grad-CAM needs float32 for stable gradients
        x = crops_batch.float().requires_grad_(True)

        feats = self.backbone(x)          # [N, 512]  — triggers forward hook

        # Scalar target: sum of all feature activations (proxy for "fake signal")
        score = feats.sum()
        self.backbone.zero_grad()
        score.backward()                  # triggers backward hook

        acts = self._activations          # [N, C, H, W]
        grads = self._gradients           # [N, C, H, W]

        # GAP over spatial dims → importance weights
        weights = grads.mean(dim=(2, 3), keepdim=True)   # [N, C, 1, 1]
        cam = (weights * acts).sum(dim=1)                # [N, H, W]
        cam = F.relu(cam)

        # Normalise each map to [0, 1] independently
        cam_min = cam.flatten(1).min(1).values.view(-1, 1, 1)
        cam_max = cam.flatten(1).max(1).values.view(-1, 1, 1)
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)

        # Up-sample to 224×224
        cam = F.interpolate(
            cam.unsqueeze(1), size=(224, 224), mode="bilinear", align_corners=False
        ).squeeze(1)

        return cam.cpu().numpy().astype(np.float32)


# ══════════════════════════════════════════════════════════════════════════════
#  2.  LSTM Attention  (frame-level importance)
# ══════════════════════════════════════════════════════════════════════════════

class LSTMFrameAttention(nn.Module):
    """
    Lightweight self-attention head that scores each frame's hidden state.
    Attach it to the BiLSTM output to get interpretable frame weights.

    Usage:
        attn_head = LSTMFrameAttention(hidden_size=512).to(device)
        weights, context = attn_head(lstm_out)   # [1,T] , [1,512]
    """

    def __init__(self, hidden_size: int = 512):
        super().__init__()
        self.score = nn.Linear(hidden_size, 1, bias=False)

    def forward(self, lstm_out: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        # lstm_out: [B, T, H]
        raw    = self.score(lstm_out).squeeze(-1)    # [B, T]
        weights = torch.softmax(raw, dim=-1)          # [B, T]
        context = (weights.unsqueeze(-1) * lstm_out).sum(dim=1)   # [B, H]
        return weights, context


# ══════════════════════════════════════════════════════════════════════════════
#  3.  Explanation dataclass
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class DeepfakeExplanation:
    label:                str
    probability:          float
    frame_scores:         np.ndarray                        # [T] per-frame fakeness
    frame_attention:      np.ndarray                        # [T] attention weights
    poi_heatmaps:         Dict[int, Dict[str, np.ndarray]]  # frame_idx → {poi_name: heatmap}
    poi_names:            List[str]
    all_annotated_frames: List[np.ndarray] = field(default_factory=list)  # ALL frames for video
    top_fake_frames:      List[int]        = field(default_factory=list)
    video_url:            str              = ""             # served video URL

    def text_summary(self) -> str:
        lines = [
            "═" * 60,
            f"  PREDICTION : {self.label}  ({self.probability:.4f})",
            "═" * 60,
            "",
            "  Frame-level fakeness (higher = more suspicious):",
        ]
        for i, (fs, fa) in enumerate(zip(self.frame_scores, self.frame_attention)):
            bar = "█" * int(fs * 20)
            lines.append(f"    Frame {i+1:3d}  [{bar:<20s}]  score={fs:.3f}  attn={fa:.3f}")
        lines += [
            "",
            f"  Most suspicious frames: {[f+1 for f in self.top_fake_frames]}",
            "",
            "  POI breakdown (mean Grad-CAM activation per region):",
        ]
        if self.poi_heatmaps:
            poi_means: Dict[str, List[float]] = {p: [] for p in self.poi_names}
            for frame_maps in self.poi_heatmaps.values():
                for p, hm in frame_maps.items():
                    poi_means[p].append(float(hm.mean()))
            for p, vals in poi_means.items():
                avg = np.mean(vals) if vals else 0.0
                bar = "█" * int(avg * 30)
                lines.append(f"    {p:<14s}  [{bar:<30s}]  {avg:.3f}")
        lines.append("═" * 60)
        return "\n".join(lines)

    def save_report(self, output_dir: str = "xai_output"):
        os.makedirs(output_dir, exist_ok=True)

        # ── Text summary ──────────────────────────────────────────────────────
        with open(os.path.join(output_dir, "summary.txt"), "w", encoding="utf-8") as f:
            f.write(self.text_summary())

        # ── Annotated video from ALL frames ───────────────────────────────────
        if not self.all_annotated_frames:
            print("[XAI] No frames to write.")
            return

        video_filename = "annotated_video.mp4"
        video_filepath = os.path.join(output_dir, video_filename)

        h, w   = self.all_annotated_frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(video_filepath, fourcc, 25.0, (w, h))
        for frame in self.all_annotated_frames:
            writer.write(frame)
        writer.release()

        self.video_url = f"/xai-frames/{os.path.basename(output_dir)}/{video_filename}"
        print(f"[XAI] Annotated video saved → {video_filepath}  ({len(self.all_annotated_frames)} frames)")
        print(self.text_summary())

# ══════════════════════════════════════════════════════════════════════════════
#  4.  Visualization utilities
# ══════════════════════════════════════════════════════════════════════════════

class VisualizationUtils:

    # Colour map: green (real) → yellow → red (fake)
    _CMAP = cv2.COLORMAP_JET

    @staticmethod
    def heatmap_overlay(bgr_crop: np.ndarray, heatmap: np.ndarray,
                        alpha: float = 0.45) -> np.ndarray:
        """Blend a [0,1] heatmap over a BGR crop (224×224)."""
        hm_u8  = (heatmap * 255).astype(np.uint8)
        hm_col = cv2.applyColorMap(hm_u8, VisualizationUtils._CMAP)
        return cv2.addWeighted(bgr_crop, 1 - alpha, hm_col, alpha, 0)

    @staticmethod
    def draw_poi_strip(
        frame_rgb: np.ndarray,
        poi_centers: Dict[str, np.ndarray],
        poi_heatmaps: Dict[str, np.ndarray],
        crop_size: int = 64,
        thumb_size: int = 80,
    ) -> np.ndarray:
        """
        Returns a horizontal strip [thumb_size, thumb_size * N_POI, 3] BGR
        showing each POI crop overlaid with its Grad-CAM heatmap.
        """
        thumbs = []
        for poi_name, center in poi_centers.items():
            hm    = poi_heatmaps.get(poi_name, np.zeros((224, 224), np.float32))
            x, y  = int(center[0]), int(center[1])
            h, w  = frame_rgb.shape[:2]
            x1, y1 = max(0, x - crop_size), max(0, y - crop_size)
            x2, y2 = min(w, x + crop_size), min(h, y + crop_size)
            crop  = frame_rgb[y1:y2, x1:x2]
            if crop.size == 0:
                crop = np.zeros((crop_size * 2, crop_size * 2, 3), np.uint8)
            crop_224 = cv2.resize(crop, (224, 224))
            bgr      = cv2.cvtColor(crop_224, cv2.COLOR_RGB2BGR)
            blended  = VisualizationUtils.heatmap_overlay(bgr, hm)
            thumb    = cv2.resize(blended, (thumb_size, thumb_size))

            # Label
            label_bg = thumb.copy()
            cv2.rectangle(label_bg, (0, thumb_size - 16), (thumb_size, thumb_size),
                          (0, 0, 0), -1)
            cv2.addWeighted(label_bg, 0.6, thumb, 0.4, 0, thumb)
            cv2.putText(thumb, poi_name[:8], (2, thumb_size - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.28, (255, 255, 255), 1,
                        cv2.LINE_AA)
            thumbs.append(thumb)

        return np.concatenate(thumbs, axis=1)   # [H, W*N, 3]

    @staticmethod
    def annotate_full_frame(
        frame_rgb: np.ndarray,
        frame_score: float,
        frame_attn: float,
        poi_centers: Dict[str, np.ndarray],
        poi_heatmaps: Dict[str, np.ndarray],
        label: str,
        frame_idx: int,
    ) -> np.ndarray:
        """
        Returns a BGR annotated frame:
          • Landmark dots on face
          • Coloured border (green=real, red=fake)
          • Fakeness score bar (top-left)
          • POI thumbnail strip (bottom)
        """
        bgr    = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
        h, w   = bgr.shape[:2]

        # ── Border colour ─────────────────────────────────────────────────────
        t      = min(max(frame_score, 0.0), 1.0)
        r      = int(255 * t)
        g      = int(255 * (1 - t))
        border_col = (0, g, r)           # BGR
        cv2.rectangle(bgr, (0, 0), (w - 1, h - 1), border_col, 6)

        # ── Landmark dots ─────────────────────────────────────────────────────
        for name, center in poi_centers.items():
            cx, cy = int(center[0]), int(center[1])
            cv2.circle(bgr, (cx, cy), 5, (0, 255, 255), -1)
            cv2.circle(bgr, (cx, cy), 5, (0, 0, 0), 1)

        # ── Score bar ─────────────────────────────────────────────────────────
        BAR_W, BAR_H = 160, 16
        filled = int(frame_score * BAR_W)
        cv2.rectangle(bgr, (8, 8),  (8 + BAR_W, 8 + BAR_H), (40, 40, 40), -1)
        cv2.rectangle(bgr, (8, 8),  (8 + filled, 8 + BAR_H), border_col, -1)
        cv2.rectangle(bgr, (8, 8),  (8 + BAR_W, 8 + BAR_H), (200, 200, 200), 1)
        cv2.putText(bgr,
                    f"Fake:{frame_score:.2f}  Attn:{frame_attn:.2f}  [{label}]",
                    (8, 8 + BAR_H + 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

        # ── Frame index ───────────────────────────────────────────────────────
        cv2.putText(bgr, f"#{frame_idx + 1}", (w - 45, 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

        # ── POI strip (resize to frame width) ─────────────────────────────────
        strip = VisualizationUtils.draw_poi_strip(
            frame_rgb, poi_centers, poi_heatmaps
        )
        strip = cv2.resize(strip, (w, strip.shape[0]))
        bgr   = np.vstack([bgr, strip])

        return bgr


# ══════════════════════════════════════════════════════════════════════════════
#  5.  ExplainableDeepfakeDetector  (drop-in replacement)
# ══════════════════════════════════════════════════════════════════════════════

class ExplainableDeepfakeDetector(DeepfakeVideoDetector):
    """
    Extends DeepfakeVideoDetector with Grad-CAM + LSTM attention.
    All original methods still work unchanged.
    """

    def __init__(self, model_path: str, device=None):
        super().__init__(model_path, device)

        # Grad-CAM hooks on the backbone
        self.gradcam = GradCAMExtractor(self.backbone)

        # Attention head (not trained — provides proxy importance)
        self.attn_head = LSTMFrameAttention(hidden_size=512).to(self.device)
        if self.device.type == "cuda":
            self.attn_head = self.attn_head.half()
        self.attn_head.eval()

        print("[XAI] GradCAMExtractor and LSTMFrameAttention attached.")

    # ── XAI feature extraction ────────────────────────────────────────────────
    def extract_features_with_explanations(
        self, video_path: str
    ) -> Tuple[torch.Tensor, List[Dict], List[Dict]]:
        """
        Like extract_video_features but also returns:
          frame_meta  – list of {frame_idx, poi_centers, rgb_frame}
          heatmap_list – list of {poi_name: np.ndarray heatmap}
        """
        cap          = cv2.VideoCapture(video_path)
        seq_features : List[torch.Tensor] = []
        frame_meta   : List[Dict]         = []
        heatmap_list : List[Dict]         = []
        frame_count  = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"📹 [XAI] Processing: {video_path} ({total_frames} frames)")

        while frame_count < SEQ_LEN:
            ret, frame = cap.read()
            if not ret:
                break

            rgb       = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            landmarks = self.fa.get_landmarks(rgb)
            if landmarks is None:
                continue

            pois = self.extract_pois(landmarks[0])

            # ── Build crop batch ──────────────────────────────────────────────
            poi_names  = list(pois.keys())
            crops      = [self.transform(self.crop_region(rgb, p)) for p in pois.values()]
            crops_batch = torch.stack(crops, dim=0).to(self.device)

            # ── Grad-CAM (needs float32 + grads) ─────────────────────────────
            # Temporarily switch backbone to float32 for Grad-CAM
            self.backbone.float()
            heatmaps_np = self.gradcam.compute(crops_batch.float())
            # Restore FP16 if on GPU
            if self.device.type == "cuda":
                self.backbone.half()
                crops_batch = crops_batch.half()

            # ── Normal feature extraction ─────────────────────────────────────
            with torch.no_grad():
                if self.device.type == "cuda":
                    crops_batch = crops_batch.half()
                feats = self.backbone(crops_batch)      # [7, 512]
                feats = feats.view(-1)                  # [3584]
            seq_features.append(feats)

            # ── Store metadata ────────────────────────────────────────────────
            frame_meta.append({
                "frame_idx":   frame_count,
                "poi_centers": pois,
                "rgb_frame":   rgb.copy(),
            })
            heatmap_list.append({
                name: heatmaps_np[i] for i, name in enumerate(poi_names)
            })

            frame_count += 1
            if frame_count % 5 == 0 or frame_count == SEQ_LEN:
                print(f"⏳ [XAI] {frame_count}/{SEQ_LEN} frames processed")

        cap.release()

        if not seq_features:
            seq_features.append(
                torch.zeros(FEATURE_DIM, device=self.device,
                            dtype=torch.float16 if self.device.type == "cuda"
                            else torch.float32)
            )
            frame_meta.append({"frame_idx": 0, "poi_centers": {}, "rgb_frame":
                                np.zeros((480, 640, 3), np.uint8)})
            heatmap_list.append({})

        seq_tensor = torch.stack(seq_features, dim=0).unsqueeze(0)
        return seq_tensor, frame_meta, heatmap_list


    # ── Main explain + predict ────────────────────────────────────────────────

    def predict_with_explanation(
            self,
            video_path: str,
            top_k_frames: int = 5,
        ) -> Tuple[str, float, Optional[DeepfakeExplanation]]:
            """
            Returns (label, probability, DeepfakeExplanation).
            DeepfakeExplanation is None if label is REAL.
            Annotates ALL frames and assembles into a video.
            """
            print(f"🔍 [XAI] Predicting + explaining: {video_path}")

            seq, frame_meta, heatmap_list = self.extract_features_with_explanations(video_path)

            if self.device.type == "cuda":
                seq = seq.half()

            # ── LSTM forward + attention ──────────────────────────────────────────
            with torch.no_grad():
                lstm_out, _     = self.model.lstm(seq)
                attn_weights, _ = self.attn_head(lstm_out.float())
                logit           = self.model.fc(torch.mean(lstm_out, dim=1)).squeeze()
                prob            = torch.sigmoid(logit).item()

            label = "FAKE" if prob > 0.5 else "REAL"
            print(f"🎯 [XAI] {label}  (prob={prob:.4f})")

            # ── Early exit for REAL — skip all XAI work ──────────────────────────
            if label == "REAL":
                return label, prob, None

            # ── Everything below only runs for FAKE videos ────────────────────────
            attn_np = attn_weights.squeeze(0).cpu().float().numpy()   # [T]
            T       = len(frame_meta)

            # ── Per-frame fakeness score = mean(Grad-CAM activation) × attention ──
            frame_scores = np.array([
                float(np.mean([hm.mean() for hm in heatmap_list[i].values()]))
                * float(attn_np[i] if i < len(attn_np) else 0.0)
                for i in range(T)
            ])

            # Normalise to [0, 1]
            fs_max            = frame_scores.max()
            frame_scores_norm = frame_scores / fs_max if fs_max > 0 else frame_scores

            # Top-k indices kept for text summary only
            top_fake  = np.argsort(frame_scores_norm)[::-1][:top_k_frames].tolist()
            poi_names = list(frame_meta[0]["poi_centers"].keys()) if frame_meta else []

            # ── Annotate ALL frames for video ─────────────────────────────────────
            print(f"🎨 [XAI] Annotating all {T} frames for video...")
            all_annotated = []
            for i in range(T):
                ann = VisualizationUtils.annotate_full_frame(
                    frame_rgb    = frame_meta[i]["rgb_frame"],
                    frame_score  = float(frame_scores_norm[i]),
                    frame_attn   = float(attn_np[i]) if i < len(attn_np) else 0.0,
                    poi_centers  = frame_meta[i]["poi_centers"],
                    poi_heatmaps = heatmap_list[i],
                    label        = label,
                    frame_idx    = frame_meta[i]["frame_idx"],
                )
                all_annotated.append(ann)

            explanation = DeepfakeExplanation(
                label                = label,
                probability          = prob,
                frame_scores         = frame_scores_norm,
                frame_attention      = attn_np[:T],
                poi_heatmaps         = {i: heatmap_list[i] for i in range(T)},
                poi_names            = poi_names,
                all_annotated_frames = all_annotated,
                top_fake_frames      = top_fake,
            )

            return label, prob, explanation

    # ── Optional: write annotated video ──────────────────────────────────────
    def save_annotated_video(
        self,
        explanation: DeepfakeExplanation,
        output_path: str,
        fps: float = 25.0,
    ):
        if not explanation.annotated_frames:
            print("[XAI] No annotated frames to write.")
            return
        h, w = explanation.annotated_frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
        for fr in explanation.annotated_frames:
            writer.write(fr)
        writer.release()
        print(f"[XAI] Annotated video saved: {output_path}")

    def __del__(self):
        if hasattr(self, "gradcam"):
            self.gradcam.remove_hooks()