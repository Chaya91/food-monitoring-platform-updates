from pathlib import Path
import torch
import numpy as np
from PIL import Image

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor


class FruitSegmenter:

    def __init__(self):

        BASE_DIR = Path(__file__).resolve().parent.parent

        checkpoint = BASE_DIR / "weights" / "sam2.1_hiera_small.pt"
        config = (
            BASE_DIR.parent
            / "sam2-main"
            / "configs"
            / "sam2.1_hiera_s.yaml"
        )

        device = "cuda" if torch.cuda.is_available() else "cpu"

        model = build_sam2(
            str(config),
            str(checkpoint),
            device=device
        )

        self.predictor = SAM2ImagePredictor(model)
        print(f"Using device: {device}")

    def segment(self, image_path, bbox):

        image = np.array(Image.open(image_path).convert("RGB"))

        self.predictor.set_image(image)

        masks, scores, _ = self.predictor.predict(
            box=np.array(bbox),
            multimask_output=False
        )

        return image, masks[0]