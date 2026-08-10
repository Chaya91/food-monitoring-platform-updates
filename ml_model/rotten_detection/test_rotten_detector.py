import cv2

from rotten_detector import RottenSpotDetector

image = cv2.imread("../outputs/segmented/fruit_1.png")

detector = RottenSpotDetector()

result, mask, percentage, regions = detector.detect(image)

print(f"Rotten Regions : {regions}")
print(f"Rotten Area    : {percentage:.2f}%")

cv2.imwrite("result.png", result)
cv2.imwrite("mask.png", mask)

print("Done")