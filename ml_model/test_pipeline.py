from pathlib import Path
import cv2
import numpy as np

from detection.detector import FruitDetector
from segmentation.sam_segment import FruitSegmenter
from classification.classifier import FreshnessClassifier
from rotten_detection.rotten_detector import RottenSpotDetector


# ==========================================================
# Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

IMAGE_PATH = Path(
    r"C:\Users\gvski\OneDrive\Desktop\infosys7.0\ml_model\final_dataset\test\Spoiled\SpoiledBanana\b_r004.png"
)

MASK_DIR = BASE_DIR / "outputs" / "masks"
SEGMENTED_DIR = BASE_DIR / "outputs" / "segmented"
ROTTEN_DIR = BASE_DIR / "outputs" / "rotten"

MASK_DIR.mkdir(parents=True, exist_ok=True)
SEGMENTED_DIR.mkdir(parents=True, exist_ok=True)
ROTTEN_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================================
# Load Models
# ==========================================================

detector = FruitDetector("weights/fruit_detection.pt")
segmenter = FruitSegmenter()
classifier = FreshnessClassifier()
rotten_detector = RottenSpotDetector()


# ==========================================================
# Detect Fruits
# ==========================================================

detections = detector.detect(str(IMAGE_PATH))

print("\n")
print("=" * 60)
print(f"Detected {len(detections)} fruits")
print("=" * 60)


# ==========================================================
# Process Each Fruit
# ==========================================================

for i, fruit in enumerate(detections, start=1):

    # ------------------------------------------------------
    # Segment Fruit
    # ------------------------------------------------------

    image, mask = segmenter.segment(str(IMAGE_PATH), fruit["bbox"])

    mask_uint8 = (mask * 255).astype(np.uint8)

    segmented = cv2.bitwise_and(image, image, mask=mask_uint8)

    mask_path = MASK_DIR / f"mask_{i}.png"
    segmented_path = SEGMENTED_DIR / f"fruit_{i}.png"

    cv2.imwrite(str(mask_path), mask_uint8)
    cv2.imwrite(
        str(segmented_path),
        cv2.cvtColor(segmented, cv2.COLOR_RGB2BGR)
    )

    # ------------------------------------------------------
    # Freshness Classification
    # ------------------------------------------------------

    label, cls_conf = classifier.classify(str(segmented_path))

    rotten_percentage = 0.0
    rotten_regions = 0

    output_image = cv2.cvtColor(segmented, cv2.COLOR_RGB2BGR)

    # ------------------------------------------------------
    # Rotten Spot Detection
    # ------------------------------------------------------

    # Run only if fruit is Spoiled
    if label == "Spoiled":

        output_image, rotten_mask, rotten_percentage, rotten_regions = \
            rotten_detector.detect(output_image)

        cv2.imwrite(
            str(ROTTEN_DIR / f"fruit_{i}.png"),
            output_image
        )

        # Save rotten mask for debugging
        cv2.imwrite(
            str(ROTTEN_DIR / f"rotten_mask_{i}.png"),
            rotten_mask
        )

    # ------------------------------------------------------
    # Print Results
    # ------------------------------------------------------

    print("\n" + "=" * 60)
    print(f"Fruit #{i}")
    print("=" * 60)

    print(f"Detected Fruit        : {fruit['class_name']}")
    print(f"Detection Confidence  : {fruit['confidence']:.2f}")

    print(f"Freshness             : {label}")
    print(f"Classification Conf   : {cls_conf:.2f}")

    print(f"Rotten Regions        : {rotten_regions}")
    print(f"Rotten Area           : {rotten_percentage:.2f}%")

    print(f"Mask Saved            : {mask_path.name}")
    print(f"Segment Saved         : {segmented_path.name}")

    if label == "Spoiled":
        print(f"Rotten Output Saved   : fruit_{i}.png")
        print(f"Rotten Mask Saved     : rotten_mask_{i}.png")


print("\n")
print("=" * 60)
print("Pipeline Completed Successfully!")
print("=" * 60)