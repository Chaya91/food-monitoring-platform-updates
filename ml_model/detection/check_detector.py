from ultralytics import YOLO

model = YOLO("../weights/fruit_detection.pt")  # since you're in detection/

image = r"C:\Users\gvski\OneDrive\Desktop\infosys7.0\ml_model\final_dataset\test\Spoiled\SpoiledBanana\b_r004.png"

results = model.predict(
    source=image,
    conf=0.10,      # Lower threshold
    verbose=False
)

r = results[0]

print("Detected boxes:", len(r.boxes))

for box in r.boxes:
    cls = int(box.cls[0])
    print(
        "Class:", r.names[cls],
        "Confidence:", float(box.conf[0]),
        "BBox:", box.xyxy[0].tolist()
    )