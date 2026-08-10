from pathlib import Path
from ultralytics import YOLO

# Load model once when the application starts
MODEL_PATH = Path(__file__).parent / "models" / "best.pt"

model = YOLO(str(MODEL_PATH))


def predict_image(image_path: str):
    """
    Predict food category and freshness.
    """

    results = model.predict(
        source=image_path,
        verbose=False
    )

    result = results[0]

    class_id = result.probs.top1
    confidence = float(result.probs.top1conf) * 100

    class_name = result.names[class_id]

    # -------------------------
    # Freshness
    # -------------------------

    if class_name.lower().startswith("fresh"):
        freshness = "Fresh"
    elif class_name.lower().startswith("rotten"):
        freshness = "Spoiled"
    else:
        freshness = "Unknown"

    # -------------------------
    # Food Category
    # -------------------------

    food_category = class_name

    prefixes = [
        "Fresh",
        "Rotten",
        "fresh",
        "rotten"
    ]

    for prefix in prefixes:
        if food_category.startswith(prefix):
            food_category = food_category.replace(prefix, "")

    return {
        "food_category": food_category,
        "freshness_status": freshness,
        "confidence": round(confidence, 2)
    }
