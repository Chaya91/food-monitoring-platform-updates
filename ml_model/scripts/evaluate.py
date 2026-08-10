from pathlib import Path
import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
from ultralytics import YOLO

# =====================================================
# Project Base Directory
# Current File:
# ml_model/scripts/evaluate.py
#
# BASE_DIR becomes:
# ml_model/
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# =====================================================
# Paths
# =====================================================

MODEL_PATH = (
    BASE_DIR
    / "runs"
    / "classify"
    / "runs"
    / "food_freshness_dataset1"
    / "weights"
    / "best.pt"
)

TEST_DATASET = BASE_DIR / "dataset" / "test"

REPORT_FOLDER = BASE_DIR / "reports"
REPORT_FOLDER.mkdir(exist_ok=True)

# =====================================================
# Check Paths
# =====================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"\nModel not found:\n{MODEL_PATH}")

if not TEST_DATASET.exists():
    raise FileNotFoundError(f"\nTest dataset not found:\n{TEST_DATASET}")

# =====================================================
# Load Model
# =====================================================

model = YOLO(str(MODEL_PATH))

# =====================================================
# Class Names
# =====================================================

class_names = sorted(
    [
        d.name
        for d in TEST_DATASET.iterdir()
        if d.is_dir()
    ]
)

name_to_index = {
    name: idx
    for idx, name in enumerate(class_names)
}

y_true = []
y_pred = []

print("\nRunning Evaluation...\n")

# =====================================================
# Predict Every Image
# =====================================================

for class_name in class_names:

    folder = TEST_DATASET / class_name

    for image in folder.iterdir():

        if image.suffix.lower() not in [
            ".jpg",
            ".jpeg",
            ".png",
            ".bmp",
            ".webp"
        ]:
            continue

        results = model.predict(
            source=str(image),
            verbose=False
        )

        pred_class = results[0].names[
            results[0].probs.top1
        ]

        y_true.append(name_to_index[class_name])
        y_pred.append(name_to_index[pred_class])

# =====================================================
# Classification Report
# =====================================================

print("=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)

print(
    classification_report(
        y_true,
        y_pred,
        target_names=class_names
    )
)

# =====================================================
# Confusion Matrix
# =====================================================

cm = confusion_matrix(y_true, y_pred)

plt.figure(figsize=(14, 12))

sns.heatmap(
    cm,
    annot=False,
    cmap="Blues",
    xticklabels=class_names,
    yticklabels=class_names
)

plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.tight_layout()

save_path = REPORT_FOLDER / "evaluation_confusion_matrix.png"

plt.savefig(save_path)
plt.show()

print(f"\nConfusion Matrix saved at:\n{save_path}")

# =====================================================
# Accuracy
# =====================================================

accuracy = np.mean(
    np.array(y_true) == np.array(y_pred)
)

print(f"\nOverall Accuracy : {accuracy * 100:.2f}%")