import random
import shutil
from pathlib import Path

# =====================================================
# Project Base Directory
# Current File:
# ml_model/scripts/prepare_dataset.py
#
# BASE_DIR becomes:
# ml_model/
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# =====================================================
# DATASET PATHS
# =====================================================

# Original downloaded dataset
SOURCE_DIR = (
    BASE_DIR.parent
    / "datasets"
    / "dataset1_food_freshness"
)

# YOLO training dataset
DEST_DIR = BASE_DIR / "dataset"

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp"
}

# =====================================================
# CHECK DATASET
# =====================================================

if not SOURCE_DIR.exists():
    raise FileNotFoundError(
        f"\nDataset not found:\n{SOURCE_DIR}"
    )

# =====================================================
# CREATE OUTPUT FOLDERS
# =====================================================

for split in ["train", "val", "test"]:
    (DEST_DIR / split).mkdir(parents=True, exist_ok=True)

# =====================================================
# COPY IMAGES
# =====================================================

def split_and_copy(class_name, image_list):

    random.shuffle(image_list)

    total = len(image_list)

    train_end = int(total * TRAIN_RATIO)
    val_end = train_end + int(total * VAL_RATIO)

    splits = {
        "train": image_list[:train_end],
        "val": image_list[train_end:val_end],
        "test": image_list[val_end:]
    }

    for split_name, images in splits.items():

        class_folder = DEST_DIR / split_name / class_name
        class_folder.mkdir(parents=True, exist_ok=True)

        for img in images:
            shutil.copy2(
                img,
                class_folder / img.name
            )

# =====================================================
# READ DATASET
# =====================================================

print("\nPreparing Dataset...\n")

for freshness_folder in SOURCE_DIR.iterdir():

    if not freshness_folder.is_dir():
        continue

    for class_folder in freshness_folder.iterdir():

        if not class_folder.is_dir():
            continue

        class_name = class_folder.name

        images = [
            img
            for img in class_folder.iterdir()
            if img.suffix.lower() in IMAGE_EXTENSIONS
        ]

        print(f"{class_name:<25} {len(images):>6} images")

        split_and_copy(class_name, images)

print("\n" + "=" * 50)
print("Dataset preparation completed successfully!")
print("=" * 50)

print(f"\nDataset saved at:\n{DEST_DIR}")