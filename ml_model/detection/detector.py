from ultralytics import YOLO


class FruitDetector:

    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def detect(self, image_path):

        results = self.model.predict(
            source=image_path,
            conf=0.2,
            verbose=False
        )

        detections = []

        result = results[0]

        for box in result.boxes:

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            cls = int(box.cls[0])

            conf = float(box.conf[0])

            detections.append({
                "class_id": cls,
                "class_name": result.names[cls],
                "confidence": conf,
                "bbox": [x1, y1, x2, y2]
            })

        return detections