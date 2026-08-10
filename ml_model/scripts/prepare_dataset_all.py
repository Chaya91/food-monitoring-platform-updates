import os
import shutil
import random
import hashlib
from pathlib import Path
from PIL import Image
from tqdm import tqdm

# ======================================================
# PROJECT PATHS
# ======================================================

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

DATASETS = {
    "dataset1": PROJECT_ROOT / "datasets" / "dataset1_fruits_fresh_rotten",
    "dataset2": PROJECT_ROOT / "datasets" / "dataset2_fresh_stale",
    "dataset3": PROJECT_ROOT / "datasets" / "dataset3_fruits_quality",
    "dataset4": PROJECT_ROOT / "datasets" / "dataset4_fresh_spoiled",
}

OUTPUT = BASE_DIR / "final_dataset"

TRAIN_DIR = OUTPUT / "train"
VAL_DIR = OUTPUT / "val"
TEST_DIR = OUTPUT / "test"

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp"
]

random.seed(42)
# ======================================================
# LABEL NORMALIZATION
# ======================================================

CATEGORY_MAPPING = {

    "apple": "Apple",
    "apples": "Apple",

    "banana": "Banana",
    "bananas": "Banana",

    "orange": "Orange",
    "oranges": "Orange",

    "tomato": "Tomato",
    "tomatoes": "Tomato",

    "potato": "Potato",
    "potatoes": "Potato",

    "capsicum": "Capsicum",
    "capciscum": "Capsicum",

    "bellpepper": "BellPepper",

    "bittergroud": "BitterGourd",
    "bittergourd": "BitterGourd",

    "okra": "Okra",
    "okara": "Okra",

    "carrot": "Carrot",

    "cucumber": "Cucumber",

    "strawberry": "Strawberry",

    "mango": "Mango",

    "bread": "Bread",

    "dairy": "Dairy",

    "vegetables": "Vegetables",

    "fruits": "MixedFruit"
}
# ======================================================
# NORMALIZE LABEL
# ======================================================

def normalize_label(folder_name):

    name = folder_name.lower()

    freshness = "Fresh"

    if any(x in name for x in [
        "rotten",
        "spoiled",
        "stale",
        "bad"
    ]):
        freshness = "Spoiled"

    category = "Other"

    for key, value in CATEGORY_MAPPING.items():

        if key in name:
            category = value
            break

    return category, freshness
# ======================================================
# CHECK IMAGE
# ======================================================

def is_image(file):

    return file.suffix.lower() in IMAGE_EXTENSIONS

# ======================================================
# CORRUPTED IMAGE CHECK
# ======================================================

def is_corrupted(image_path):

    try:

        img = Image.open(image_path)

        img.verify()

        return False

    except:

        return True
    
# ======================================================
# IMAGE HASH
# ======================================================

def image_hash(image_path):

    hasher = hashlib.md5()

    with open(image_path, "rb") as f:

        hasher.update(f.read())

    return hasher.hexdigest()

# ======================================================
# CREATE OUTPUT
# ======================================================

def create_output():

    if OUTPUT.exists():

        shutil.rmtree(OUTPUT)

    TRAIN_DIR.mkdir(parents=True)

    VAL_DIR.mkdir()

    TEST_DIR.mkdir()

    print("Output folders created.")


# ======================================================
# DATASET 1
# ======================================================

def load_dataset1():

    print("\nLoading Dataset 1...")

    root = DATASETS["dataset1"]

    count = 0

    for freshness in root.iterdir():

        if not freshness.is_dir():
            continue

        for category in freshness.iterdir():

            if not category.is_dir():
                continue

            for img in category.iterdir():

                add_image(
                    img,
                    category.name,
                    "dataset1"
                )
            


                count += 1

    print(f"Dataset 1 Loaded : {count} images")

# ======================================================
# DATASET 2
# ======================================================

def load_dataset2():

    print("\nLoading Dataset 2...")

    root = DATASETS["dataset2"]

    count = 0

    for split in ["Train", "Test"]:

        folder = root / split

        if not folder.exists():
            continue

        for category in folder.iterdir():

            if not category.is_dir():
                continue

            for img in category.iterdir():

                add_image(
                    img,
                    category.name,
                    "dataset2"
)

                count += 1

    print(f"Dataset 2 Loaded : {count} images")

# ======================================================
# DATASET 3
# ======================================================

# ======================================================
# DATASET 3
# ======================================================

def load_dataset3():

    print("\nLoading Dataset 3...")

    root = DATASETS["dataset3"]

    count = 0

    for split in ["train", "test", "valid"]:

        split_folder = root / split

        if not split_folder.exists():
            continue

        for category in split_folder.iterdir():

            if not category.is_dir():
                continue

            for img in category.iterdir():

                add_image(
                    img,
                    category.name,
                    "dataset3"
                )

                count += 1

    stats["dataset3"] = count

    print(f"Dataset 3 Loaded : {count} images")

# ======================================================
# DATASET 4
# ======================================================

# ======================================================
# DATASET 4
# ======================================================

def load_dataset4():

    print("\nLoading Dataset 4...")

    root = DATASETS["dataset4"]

    count = 0

    for category in root.iterdir():

        if not category.is_dir():
            continue

        for img in category.iterdir():

            add_image(
                img,
                category.name,
                "dataset4"
            )

            count += 1

    stats["dataset4"] = count

    print(f"Dataset 4 Loaded : {count} images")

# ======================================================
# SPLIT DATASET
# ======================================================

def split_dataset():

    print("\nSplitting Dataset...")

    random.shuffle(merged_images)

    total = len(merged_images)

    train_end = int(total * TRAIN_RATIO)
    val_end = train_end + int(total * VAL_RATIO)

    train_images = merged_images[:train_end]
    val_images = merged_images[train_end:val_end]
    test_images = merged_images[val_end:]

    return train_images, val_images, test_images

# ======================================================
# COPY IMAGES
# ======================================================

def copy_images(images, destination):

    print(f"\nCopying to {destination.name}...")

    for item in tqdm(images):

        class_folder = destination / item["class"]

        class_folder.mkdir(parents=True, exist_ok=True)

        shutil.copy2(
            item["path"],
            class_folder / item["path"].name
        )


# ============================================================
# STORAGE
# ============================================================

merged_images = []
seen_hashes = set()

stats = {
    "dataset1": 0,
    "dataset2": 0,
    "dataset3": 0,
    "dataset4": 0,
    "duplicates": 0,
    "corrupted": 0
}


# ============================================================
# SAVE IMAGE
# ============================================================

def add_image(image_path: Path, folder_name: str, source_dataset: str):

    if not is_image(image_path):
        return

    if is_corrupted(image_path):
        stats["corrupted"] += 1
        return

    img_hash = image_hash(image_path)

    if img_hash in seen_hashes:
        stats["duplicates"] += 1
        return

    seen_hashes.add(img_hash)

    category, freshness = normalize_label(folder_name)

    class_name = freshness + category

    merged_images.append({
        "path": image_path,
        "class": class_name
    })

    stats[source_dataset] += 1
    


# ======================================================
# MAIN
# ======================================================

# ======================================================
# MAIN
# ======================================================

if __name__ == "__main__":

    create_output()

    load_dataset1()
    load_dataset2()
    load_dataset3()
    load_dataset4()

    train_images, val_images, test_images = split_dataset()

    copy_images(train_images, TRAIN_DIR)
    copy_images(val_images, VAL_DIR)
    copy_images(test_images, TEST_DIR)

    print("\n" + "-" * 40)

    print(f"Dataset 1 : {stats['dataset1']}")
    print(f"Dataset 2 : {stats['dataset2']}")
    print(f"Dataset 3 : {stats['dataset3']}")
    print(f"Dataset 4 : {stats['dataset4']}")
    print(f"Duplicates: {stats['duplicates']}")
    print(f"Corrupted : {stats['corrupted']}")
    print(f"Merged Images : {len(merged_images)}")

    print("\nDataset preparation completed successfully!")

