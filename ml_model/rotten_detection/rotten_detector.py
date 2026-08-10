import cv2
import numpy as np


class RottenSpotDetector:

    def __init__(self):

        # Ignore tiny spots
        self.min_contour_area = 150

    def detect(self, image):

        """
        image : BGR segmented fruit image

        Returns:
            annotated_image
            rotten_mask
            rotten_percentage
            rotten_regions
        """

        output = image.copy()

        # ---------------------------------------------------
        # Fruit mask (remove black background)
        # ---------------------------------------------------

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        fruit_mask = gray > 10

        fruit_pixels = np.count_nonzero(fruit_mask)

        if fruit_pixels == 0:
            return output, np.zeros(gray.shape, dtype=np.uint8), 0.0, 0

        # ---------------------------------------------------
        # HSV
        # ---------------------------------------------------

        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

        h, s, v = cv2.split(hsv)

        # ---------------------------------------------------
        # Brown mask
        # ---------------------------------------------------

        brown_mask = cv2.inRange(
            hsv,
            np.array([5, 60, 20]),
            np.array([25, 255, 120])
        )

        # ---------------------------------------------------
        # Dark pixels
        # ---------------------------------------------------

        dark_mask = cv2.inRange(v, 0, 90)

        # ---------------------------------------------------
        # High saturation
        # ---------------------------------------------------

        sat_mask = cv2.inRange(s, 50, 255)

        # ---------------------------------------------------
        # Combine masks
        # ---------------------------------------------------

        rotten_mask = cv2.bitwise_and(brown_mask, dark_mask)
        rotten_mask = cv2.bitwise_and(rotten_mask, sat_mask)

        rotten_mask[~fruit_mask] = 0

        # ---------------------------------------------------
        # Morphology
        # ---------------------------------------------------

        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (5, 5)
        )

        rotten_mask = cv2.morphologyEx(
            rotten_mask,
            cv2.MORPH_OPEN,
            kernel
        )

        rotten_mask = cv2.morphologyEx(
            rotten_mask,
            cv2.MORPH_CLOSE,
            kernel
        )

        # Optional debugging
        cv2.imwrite("debug_rotten_mask.png", rotten_mask)

        # ---------------------------------------------------
        # Find contours
        # ---------------------------------------------------

        contours, _ = cv2.findContours(
            rotten_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        rotten_regions = 0
        rotten_pixels = 0

        for contour in contours:

            area = cv2.contourArea(contour)

            if area < self.min_contour_area:
                continue

            rotten_regions += 1

            contour_mask = np.zeros_like(gray)

            cv2.drawContours(
                contour_mask,
                [contour],
                -1,
                255,
                thickness=-1
            )

            rotten_pixels += np.count_nonzero(contour_mask)

            cv2.drawContours(
                output,
                [contour],
                -1,
                (0, 0, 255),
                2
            )

        # ---------------------------------------------------
        # Rotten percentage
        # ---------------------------------------------------

        rotten_percentage = (rotten_pixels / fruit_pixels) * 100

        cv2.putText(
            output,
            f"Rotten Area: {rotten_percentage:.2f}%",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

        return (
            output,
            rotten_mask,
            rotten_percentage,
            rotten_regions
        )