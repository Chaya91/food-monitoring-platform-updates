from detector import FruitDetector

# Load trained YOLO model
detector = FruitDetector("../weights/fruit_detection.pt")

# Test image
image_path = "../../datasets/test.jpg"

# Run detection
detections = detector.detect(image_path)

print("\nDetected Fruits:\n")

for d in detections:
    print(f"Class      : {d['class_name']}")
    print(f"Confidence : {d['confidence']:.2f}")
    print(f"BBox       : {d['bbox']}")
    print("-" * 40)