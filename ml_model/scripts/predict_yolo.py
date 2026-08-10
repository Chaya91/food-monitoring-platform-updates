import sys
from pathlib import Path

from ultralytics import YOLO

# ----------------------------------------------------
# Project Base Directory
# ----------------------------------------------------
# Current file:
# ml_model/scripts/predict_yolo.py
#
# BASE_DIR becomes:
# ml_model/
# ----------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# ----------------------------------------------------
# Model Path
# ----------------------------------------------------

MODEL_PATH = (
    BASE_DIR
    / "runs"
    / "classify"
    / "runs"
    / "food_freshness_dataset1"
    / "weights"
    / "best.pt"
)

# Check model exists
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found:\n{MODEL_PATH}")

# Load trained model
model = YOLO(str(MODEL_PATH))

# ----------------------------------------------------
# Check Image Path
# ----------------------------------------------------

if len(sys.argv) < 2:
    print("Usage:")
    print("python predict_yolo.py <image_path>")
    sys.exit(1)

image_path = Path(sys.argv[1])

if not image_path.exists():
    print(f"\nImage not found:\n{image_path}")
    sys.exit(1)

# ----------------------------------------------------
# Prediction
# ----------------------------------------------------

results = model.predict(
    source=str(image_path),
    verbose=False
)

result = results[0]

class_id = result.probs.top1
confidence = float(result.probs.top1conf) * 100
class_name = result.names[class_id]

# ----------------------------------------------------
# Extract Food & Freshness
# ----------------------------------------------------

if class_name.lower().startswith("fresh"):
    freshness = "Fresh"
    food = class_name[5:]  # Remove "Fresh"

elif class_name.lower().startswith("rotten"):
    freshness = "Spoiled"
    food = class_name[6:]  # Remove "Rotten"

else:
    freshness = "Unknown"
    food = class_name

# ----------------------------------------------------
# Output
# ----------------------------------------------------

print("\nPrediction")
print("-" * 35)
print(f"Food Category : {food}")
print(f"Freshness     : {freshness}")
print(f"Confidence    : {confidence:.2f}%")