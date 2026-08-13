from pathlib import Path
import sys
import cv2
import numpy as np
import pandas as pd

# ==========================================================
# PATH SETUP
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

# Make SAM2 available
PROJECT_ROOT = BASE_DIR.parent
SAM2_DIR = PROJECT_ROOT / "sam2-main"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if str(SAM2_DIR) not in sys.path:
    sys.path.insert(0, str(SAM2_DIR))


# ==========================================================
# IMPORT EXISTING MODELS
# ==========================================================

from detection.detector import FruitDetector
from segmentation.sam_segment import FruitSegmenter
from classification.classifier import FreshnessClassifier
from rotten_detection.rotten_detector import RottenSpotDetector

from shelf_life.shelf_life_predictor import ShelfLifePredictor


# ==========================================================
# INPUT IMAGE
# ==========================================================

IMAGE_PATH = Path(
    r"C:\Users\gvski\OneDrive\Desktop\infosys7.0\ml_model\final_dataset\test\Spoiled\SpoiledBanana\b_r004.png"
)


# ==========================================================
# SHELF-LIFE DATASET
# ==========================================================

SHELF_LIFE_DATASET = Path(
    r"C:\Users\gvski\Downloads\shelf_life_prediction_dataset.csv"
)


# ==========================================================
# OUTPUT DIRECTORIES
# ==========================================================

MASK_DIR = BASE_DIR / "outputs" / "masks"
SEGMENTED_DIR = BASE_DIR / "outputs" / "segmented"
ROTTEN_DIR = BASE_DIR / "outputs" / "rotten"

MASK_DIR.mkdir(parents=True, exist_ok=True)
SEGMENTED_DIR.mkdir(parents=True, exist_ok=True)
ROTTEN_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================================
# HEADER
# ==========================================================

print("\n")
print("=" * 60)
print("FOOD FRESHNESS MONITORING - COMPLETE ML PIPELINE")
print("=" * 60)

print(f"\nInput Image: {IMAGE_PATH.name}")


# ==========================================================
# LOAD MODELS
# ==========================================================

print("\nLoading models...")

detector = FruitDetector("weights/fruit_detection.pt")
segmenter = FruitSegmenter()
classifier = FreshnessClassifier()
rotten_detector = RottenSpotDetector()
shelf_life_predictor = ShelfLifePredictor()

print("All models loaded successfully.")


# ==========================================================
# LOAD SHELF-LIFE DATASET
# ==========================================================

print("\nLoading shelf-life dataset...")

df = pd.read_csv(SHELF_LIFE_DATASET)

print(f"Dataset shape: {df.shape}")


# ==========================================================
# FOOD DETECTION
# ==========================================================

print("\n")
print("=" * 60)
print("1. FOOD DETECTION")
print("=" * 60)

detections = detector.detect(str(IMAGE_PATH))

print(f"Detected fruits: {len(detections)}")

if len(detections) == 0:
    print("\nNo fruit detected.")
    sys.exit(0)


# ==========================================================
# PROCESS EACH DETECTED FRUIT
# ==========================================================

for i, fruit in enumerate(detections, start=1):

    print("\n")
    print("=" * 60)
    print(f"FRUIT #{i}")
    print("=" * 60)

    # ======================================================
    # DETECTION RESULT
    # ======================================================

    print(
        f"Detected Fruit        : "
        f"{fruit['class_name']}"
    )

    print(
        f"Detection Confidence  : "
        f"{fruit['confidence']:.2f}"
    )


    # ======================================================
    # SAM2 SEGMENTATION
    # ======================================================

    print("\nRunning SAM2 segmentation...")

    image, mask = segmenter.segment(
        str(IMAGE_PATH),
        fruit["bbox"]
    )

    mask_uint8 = (mask * 255).astype(np.uint8)

    segmented = cv2.bitwise_and(
        image,
        image,
        mask=mask_uint8
    )

    mask_path = (
        MASK_DIR / f"mask_{i}.png"
    )

    segmented_path = (
        SEGMENTED_DIR / f"fruit_{i}.png"
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

    print(
        f"Mask Saved            : "
        f"{mask_path.name}"
    )

    print(
        f"Segment Saved         : "
        f"{segmented_path.name}"
    )


    # ======================================================
    # FRESHNESS CLASSIFICATION
    # ======================================================

    print("\nRunning freshness classification...")

    label, cls_conf = classifier.classify(
        str(segmented_path)
    )

    print(
        f"\nFreshness             : "
        f"{label}"
    )

    print(
        f"Classification Conf   : "
        f"{cls_conf:.2f}"
    )


    # ======================================================
    # ROTTEN AREA DETECTION
    # ======================================================

    rotten_percentage = 0.0
    rotten_regions = 0

    output_image = cv2.cvtColor(
        segmented,
        cv2.COLOR_RGB2BGR
    )

    # ------------------------------------------------------
    # IMPORTANT:
    # This is the SAME condition used in your working
    # test_pipeline.py.
    # ------------------------------------------------------

    if label == "Spoiled":

        print("\nRunning rotten-area detection...")

        (
            output_image,
            rotten_mask,
            rotten_percentage,
            rotten_regions
        ) = rotten_detector.detect(
            output_image
        )

        rotten_output_path = (
            ROTTEN_DIR / f"fruit_{i}.png"
        )

        rotten_mask_path = (
            ROTTEN_DIR / f"rotten_mask_{i}.png"
        )

        cv2.imwrite(
            str(rotten_output_path),
            output_image
        )

        cv2.imwrite(
            str(rotten_mask_path),
            rotten_mask
        )

        print("\n--- ROTTEN AREA RESULT ---")

        print(
            f"Rotten Regions        : "
            f"{rotten_regions}"
        )

        print(
            f"Rotten Area           : "
            f"{rotten_percentage:.2f}%"
        )

        print(
            f"Rotten Output Saved   : "
            f"{rotten_output_path.name}"
        )

        print(
            f"Rotten Mask Saved     : "
            f"{rotten_mask_path.name}"
        )

    else:

        print(
            "\nRotten-area detection skipped "
            "because freshness is not Spoiled."
        )


    # ======================================================
    # SHELF-LIFE PREDICTION
    # ======================================================

    print("\n")
    print("=" * 60)
    print("2. SHELF-LIFE PREDICTION")
    print("=" * 60)


    # ------------------------------------------------------
    # Match detected food with shelf-life dataset
    # ------------------------------------------------------

    detected_food = fruit["class_name"]

    food_matches = df[
        df["Food_Type"]
        .astype(str)
        .str.strip()
        .str.lower()
        ==
        str(detected_food)
        .strip()
        .lower()
    ]


    if len(food_matches) == 0:

        print(
            f"\nNo shelf-life data found for "
            f"Food Type: {detected_food}"
        )

        continue


    # ------------------------------------------------------
    # Select a representative row
    #
    # Prefer Storage Day close to 3.
    # ------------------------------------------------------

    food_matches = food_matches.copy()

    food_matches["day_difference"] = (
        food_matches["Storage_Day"] - 3.0
    ).abs()

    shelf_row = (
        food_matches
        .sort_values("day_difference")
        .iloc[0]
    )


    # ======================================================
    # PREPARE MODEL INPUT
    # ======================================================

    input_data = {}

    for feature in shelf_life_predictor.feature_names:

        input_data[feature] = shelf_row[feature]


    # ======================================================
    # PREDICT SHELF LIFE
    # ======================================================

    predicted_shelf_life = (
        shelf_life_predictor.predict(
            input_data
        )
    )


    # ======================================================
    # DISPLAY SHELF-LIFE INPUT
    # ======================================================

    print("\n--- SHELF-LIFE INPUT ---")

    print(
        f"Food Type              : "
        f"{shelf_row['Food_Type']}"
    )

    print(
        f"Variety                : "
        f"{shelf_row['Variety']}"
    )

    print(
        f"Storage Temperature    : "
        f"{shelf_row['Storage_Temperature_C']:.3f} °C"
    )

    print(
        f"Relative Humidity      : "
        f"{shelf_row['Relative_Humidity_percent']:.3f} %"
    )

    print(
        f"Storage Day            : "
        f"{shelf_row['Storage_Day']:.3f}"
    )


    # ======================================================
    # SHELF-LIFE RESULT
    # ======================================================

    print("\n--- SHELF-LIFE RESULT ---")

    print(
        f"Remaining Shelf Life  : "
        f"{predicted_shelf_life:.2f} days"
    )


# ==========================================================
# FINAL
# ==========================================================

print("\n")
print("=" * 60)
print("COMPLETE PIPELINE FINISHED")
print("=" * 60)

print("\nOutput folders:")

print(
    f"  Masks     : {MASK_DIR}"
)

print(
    f"  Segmented : {SEGMENTED_DIR}"
)

print(
    f"  Rotten    : {ROTTEN_DIR}"
)

print("\nAll ML components executed successfully.")