from detector import FruitDetector

detector = FruitDetector("../weights/fruit_detection.pt")

results = detector.detect("../../datasets/test.jpg")

results[0].show()