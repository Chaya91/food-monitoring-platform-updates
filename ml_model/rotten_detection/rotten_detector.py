import cv2
import numpy as np


class RottenSpotDetector:

    def __init__(self):

        # Ignore very tiny noise
        self.min_contour_area = 80

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

        # ==========================================================
        # 1. FRUIT MASK
        # ==========================================================

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY
        )

        fruit_mask = gray > 10

        fruit_pixels = np.count_nonzero(
            fruit_mask
        )

        if fruit_pixels == 0:

            return (
                output,
                np.zeros(
                    gray.shape,
                    dtype=np.uint8
                ),
                0.0,
                0
            )

        # ==========================================================
        # 2. HSV
        # ==========================================================

        hsv = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2HSV
        )

        h, s, v = cv2.split(hsv)

        # ==========================================================
        # 3. BROWN / DECAY COLOR
        #
        # Wider range than previous detector.
        # ==========================================================

        brown_mask = cv2.inRange(
            hsv,
            np.array([0, 40, 25]),
            np.array([35, 255, 180])
        )

        # ==========================================================
        # 4. DARK REGION
        #
        # Previous value was 90.
        # Increase it to catch darker brown/red areas.
        # ==========================================================

        dark_mask = cv2.inRange(
            v,
            0,
            160
        )

        # ==========================================================
        # 5. SATURATION
        # ==========================================================

        sat_mask = cv2.inRange(
            s,
            40,
            255
        )

        # ==========================================================
        # 6. DARK RED / BROWN
        #
        # Rotten spots can appear reddish-brown.
        # ==========================================================

        dark_red_mask = cv2.inRange(
            hsv,
            np.array([0, 60, 30]),
            np.array([12, 255, 150])
        )

        # ==========================================================
        # 7. COMBINE
        # ==========================================================

        rotten_mask_1 = cv2.bitwise_and(
            brown_mask,
            dark_mask
        )

        rotten_mask_1 = cv2.bitwise_and(
            rotten_mask_1,
            sat_mask
        )

        rotten_mask_2 = cv2.bitwise_and(
            dark_red_mask,
            dark_mask
        )

        rotten_mask = cv2.bitwise_or(
            rotten_mask_1,
            rotten_mask_2
        )

        # Keep only fruit pixels
        rotten_mask[~fruit_mask] = 0

        # ==========================================================
        # 8. MORPHOLOGY
        # ==========================================================

        kernel_small = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (3, 3)
        )

        kernel_large = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (5, 5)
        )

        rotten_mask = cv2.morphologyEx(
            rotten_mask,
            cv2.MORPH_OPEN,
            kernel_small
        )

        rotten_mask = cv2.morphologyEx(
            rotten_mask,
            cv2.MORPH_CLOSE,
            kernel_large
        )

        # ==========================================================
        # 9. FIND CONTOURS
        # ==========================================================

        contours, _ = cv2.findContours(
            rotten_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        rotten_regions = 0
        rotten_pixels = 0

        # Final clean mask
        final_mask = np.zeros_like(
            gray,
            dtype=np.uint8
        )

        for contour in contours:

            area = cv2.contourArea(
                contour
            )

            if area < self.min_contour_area:
                continue

            rotten_regions += 1

            # Fill detected rotten region
            cv2.drawContours(
                final_mask,
                [contour],
                -1,
                255,
                thickness=-1
            )

        # ==========================================================
        # 10. CALCULATE ROTTEN PIXELS
        # ==========================================================

        rotten_pixels = np.count_nonzero(
            final_mask
        )

        rotten_percentage = (
            rotten_pixels /
            fruit_pixels
        ) * 100.0

        # ==========================================================
        # 11. HIGHLIGHT ROTTEN AREAS
        # ==========================================================

        if rotten_regions > 0:

            # Red overlay
            overlay = output.copy()

            overlay[final_mask > 0] = (
                0,
                0,
                255
            )

            # Transparent red highlight
            output = cv2.addWeighted(
                output,
                0.65,
                overlay,
                0.35,
                0
            )

            # Find final contours
            final_contours, _ = cv2.findContours(
                final_mask,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )

            for contour in final_contours:

                area = cv2.contourArea(
                    contour
                )

                if area < self.min_contour_area:
                    continue

                # Red outline
                cv2.drawContours(
                    output,
                    [contour],
                    -1,
                    (0, 0, 255),
                    3
                )

        # ==========================================================
        # 12. DISPLAY INFORMATION
        # ==========================================================

        cv2.putText(
            output,
            f"Rotten Area: {rotten_percentage:.2f}%",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

        cv2.putText(
            output,
            f"Rotten Regions: {rotten_regions}",
            (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        return (
            output,
            final_mask,
            rotten_percentage,
            rotten_regions
        )