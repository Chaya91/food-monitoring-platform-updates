from ultralytics import YOLO

model = YOLO("weights/yolov8s-cls.pt")

model.train(
    data="final_dataset",
    epochs=15,
    imgsz=224,
    batch=32,
    project="runs/classify",
    name="freshness_binary"
)