import cv2
import numpy as np

from ml_model.segmentation.sam_segment import FruitSegmenter
from ml_model.rotten_detection.rotten_detector import RottenSpotDetector


IMAGE_PATH = r"C:\Users\gvski\Downloads\images_apple.jpg"

OUTPUT_PATH = r"ml_model\debug_full_rotten_result.jpg"
SEGMENTED_PATH = r"ml_model\debug_segmented_fruit.jpg"
MASK_PATH = r"ml_model\debug_sam_mask.png"

BBOX = [197.47, 81.225, 494.45, 368.51]


print("Loading SAM2...")
segmenter = FruitSegmenter()

print("Loading rotten detector...")
detector = RottenSpotDetector()

print("Segmenting fruit...")

image_rgb, fruit_mask = segmenter.segment(
    IMAGE_PATH,
    BBOX
)

# RGB -> BGR
image_bgr = cv2.cvtColor(
    image_rgb,
    cv2.COLOR_RGB2BGR
)

# SAM2 mask
mask = (
    fruit_mask.astype(np.uint8) * 255
)

# Save mask
cv2.imwrite(
    MASK_PATH,
    mask
)

# Create segmented fruit
segmented_fruit = cv2.bitwise_and(
    image_bgr,
    image_bgr,
    mask=mask
)

# Save segmented fruit
cv2.imwrite(
    SEGMENTED_PATH,
    segmented_fruit
)

print("Saved segmented fruit:")
print(SEGMENTED_PATH)

print("Detecting rotten regions...")

(
    annotated,
    rotten_mask,
    rotten_percentage,
    rotten_regions
) = detector.detect(
    segmented_fruit
)

cv2.imwrite(
    OUTPUT_PATH,
    annotated
)

cv2.imwrite(
    "ml_model/debug_rotten_mask.png",
    rotten_mask
)

print()
print("================================")
print("RESULT")
print("================================")
print(
    f"Rotten Percentage : {rotten_percentage:.2f}%"
)
print(
    f"Rotten Regions    : {rotten_regions}"
)
print(
    f"Output Image      : {OUTPUT_PATH}"
)
print("================================")