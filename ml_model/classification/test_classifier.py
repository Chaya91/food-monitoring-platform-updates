from classifier import FreshnessClassifier

classifier = FreshnessClassifier()

image_path = "../../datasets/test.jpg"

label, confidence = classifier.classify(image_path)

print(f"Prediction : {label}")
print(f"Confidence : {confidence:.4f}")