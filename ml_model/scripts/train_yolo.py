from pathlib import Path
from ultralytics import YOLO



BASE_DIR = Path(__file__).resolve().parent.parent




DATASET_PATH = BASE_DIR / "final_dataset"

if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset folder not found:\n{DATASET_PATH}")


MODEL = YOLO(str(BASE_DIR / "yolov8s-cls.pt"))


MODEL.train(
    data=str(DATASET_PATH),
    epochs=3,              # Change to 20/30 later if needed
    imgsz=224,
    batch=8,
    workers=2,
    project=str(BASE_DIR / "runs"),
    name="food_freshness_final",
    pretrained=True,
    patience=3
)

print("\nTraining Completed Successfully!")