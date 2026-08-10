from pathlib import Path
from ultralytics import YOLO


class FreshnessClassifier:

    def __init__(self):
        base_dir = Path(__file__).resolve().parent.parent
        model_path = base_dir / "weights" / "freshness_classifier.pt"

        self.model = YOLO(str(model_path))

    def classify(self, image_path):

        results = self.model.predict(
            source=image_path,
            verbose=False
        )

        result = results[0]

        class_id = int(result.probs.top1)
        confidence = float(result.probs.top1conf)
        print(result.names)
        class_name = result.names[class_id]
        print(result.names)
        return class_name, confidence