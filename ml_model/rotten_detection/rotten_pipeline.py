from pathlib import Path

import cv2
import numpy as np

from ml_model.segmentation.sam_segment import FruitSegmenter
from ml_model.rotten_detection.rotten_detector import RottenSpotDetector


class RottenDetectionPipeline:

    def __init__(self):
        print("Initializing rotten-area pipeline...")

        self.segmenter = FruitSegmenter()
        self.detector = RottenSpotDetector()

        print("Rotten-area pipeline ready.")

    def process(self, image_path, bbox, output_path):
        """
        image_path:
            Original uploaded image.

        bbox:
            Fruit bounding box:
            [x1, y1, x2, y2]

        output_path:
            Path where highlighted image will be saved.

        Returns:
            {
                "output_path": str,
                "rotten_percentage": float,
                "rotten_regions": int
            }
        """

        # --------------------------------------------------
        # 1. SAM2 segmentation
        # --------------------------------------------------

        image_rgb, fruit_mask = self.segmenter.segment(
            image_path,
            bbox
        )

        # --------------------------------------------------
        # 2. Convert RGB image to BGR
        # --------------------------------------------------

        image_bgr = cv2.cvtColor(
            image_rgb,
            cv2.COLOR_RGB2BGR
        )

        # --------------------------------------------------
        # 3. Convert SAM mask to uint8
        # --------------------------------------------------

        mask = (
            fruit_mask.astype(np.uint8) * 255
        )

        # --------------------------------------------------
        # 4. Create segmented fruit image
        #
        # Everything outside the fruit becomes black.
        # --------------------------------------------------

        segmented = cv2.bitwise_and(
            image_bgr,
            image_bgr,
            mask=mask
        )

        # --------------------------------------------------
        # 5. Rotten-area detection
        # --------------------------------------------------

        (
            annotated,
            rotten_mask,
            rotten_percentage,
            rotten_regions
        ) = self.detector.detect(
            segmented
        )

        # --------------------------------------------------
        # 6. Save result
        # --------------------------------------------------

        output_path = Path(output_path)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        cv2.imwrite(
            str(output_path),
            annotated
        )

        return {
            "output_path": str(output_path),
            "rotten_percentage": round(
                float(rotten_percentage),
                2
            ),
            "rotten_regions": int(
                rotten_regions
            )
        }