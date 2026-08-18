from pathlib import Path
import sys

import cv2
import numpy as np


# =========================================================
# Project Paths
# =========================================================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent

ML_MODEL_DIR = PROJECT_DIR / "ml_model"
SAM2_DIR = PROJECT_DIR / "sam2-main"


# =========================================================
# Add ML Model and SAM2 to Python Path
# =========================================================

for path in [ML_MODEL_DIR, SAM2_DIR, BACKEND_DIR]:

    path_str = str(path)

    if path_str not in sys.path:
        sys.path.insert(0, path_str)


# =========================================================
# Import ML Components
# =========================================================

try:
    from detection.detector import FruitDetector
    from segmentation.sam_segment import FruitSegmenter
    from classification.classifier import FreshnessClassifier
    from rotten_detection.rotten_detector import RottenSpotDetector
except ImportError:
    # Fallback: import from ML_MODEL_DIR directly
    sys.path.insert(0, str(ML_MODEL_DIR))
    from detection.detector import FruitDetector
    from segmentation.sam_segment import FruitSegmenter
    from classification.classifier import FreshnessClassifier
    from rotten_detection.rotten_detector import RottenSpotDetector


# =========================================================
# Load Models Once
# =========================================================

print("Loading ML models...")


detector = FruitDetector(
    str(
        ML_MODEL_DIR
        / "weights"
        / "fruit_detection.pt"
    )
)


segmenter = FruitSegmenter()

classifier = FreshnessClassifier()

rotten_detector = RottenSpotDetector()


print("All ML models loaded successfully.")


# =========================================================
# Complete Image Prediction Pipeline
# =========================================================

def predict_image(image_path: str):

    image_path = str(image_path)


    # =====================================================
    # 1. FOOD DETECTION
    # =====================================================

    detections = detector.detect(image_path)


    if not detections:

        return {
            "food_category": "Unknown",
            "detection_confidence": 0.0,
            "freshness_status": "Unknown",
            "confidence": 0.0,
            "rotten_regions": 0,
            "rotten_area_percent": 0.0,
            "mask_path": None,
            "segmented_path": None,
            "rotten_output_path": None,
            "rotten_mask_path": None
        }


    # Currently process first detected fruit

    fruit = detections[0]


    # =====================================================
    # 2. SAM2 SEGMENTATION
    # =====================================================

    image, mask = segmenter.segment(
        image_path,
        fruit["bbox"]
    )


    mask_uint8 = (
        mask.astype(np.uint8) * 255
    )


    segmented = cv2.bitwise_and(
        image,
        image,
        mask=mask_uint8
    )


    # =====================================================
    # 3. OUTPUT DIRECTORIES
    # =====================================================

    output_dir = ML_MODEL_DIR / "outputs"

    mask_dir = output_dir / "masks"
    segmented_dir = output_dir / "segmented"
    rotten_dir = output_dir / "rotten"


    mask_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    segmented_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    rotten_dir.mkdir(
        parents=True,
        exist_ok=True
    )


    # =====================================================
    # 4. SAVE SEGMENTATION RESULTS
    # =====================================================

    mask_path = (
        mask_dir / "api_mask.png"
    )

    segmented_path = (
        segmented_dir / "api_fruit.png"
    )


    cv2.imwrite(
        str(mask_path),
        mask_uint8
    )


    cv2.imwrite(
        str(segmented_path),
        cv2.cvtColor(
            segmented,
            cv2.COLOR_RGB2BGR
        )
    )


    # =====================================================
    # 5. FRESHNESS CLASSIFICATION
    # =====================================================

    label, cls_conf = classifier.classify(
        str(segmented_path)
    )


    # =====================================================
    # 6. ROTTEN AREA DETECTION
    # =====================================================

    rotten_percentage = 0.0
    rotten_regions = 0

    rotten_output_path = None
    rotten_mask_path = None


    output_image = cv2.cvtColor(
        segmented,
        cv2.COLOR_RGB2BGR
    )


    if label == "Spoiled":

        (
            output_image,
            rotten_mask,
            rotten_percentage,
            rotten_regions
        ) = rotten_detector.detect(
            output_image
        )


        rotten_output_path = (
            rotten_dir / "api_rotten.png"
        )

        rotten_mask_path = (
            rotten_dir / "api_rotten_mask.png"
        )


        cv2.imwrite(
            str(rotten_output_path),
            output_image
        )


        cv2.imwrite(
            str(rotten_mask_path),
            rotten_mask
        )


    # =====================================================
    # 7. RETURN COMPLETE RESULT
    # =====================================================

    return {

        "food_category":
            fruit["class_name"],

        "detection_confidence":
            round(
                float(fruit["confidence"]),
                4
            ),

        "freshness_status":
            label,

        "confidence":
            round(
                float(cls_conf),
                4
            ),

        "rotten_regions":
            int(rotten_regions),

        "rotten_area_percent":
            round(
                float(rotten_percentage),
                2
            ),

        "mask_path":
            str(mask_path),

        "segmented_path":
            str(segmented_path),

        "rotten_output_path":
            (
                str(rotten_output_path)
                if rotten_output_path
                else None
            ),

        "rotten_mask_path":
            (
                str(rotten_mask_path)
                if rotten_mask_path
                else None
            )
    }