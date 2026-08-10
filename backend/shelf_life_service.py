from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_model.shelf_life.shelf_life_predictor import (
    ShelfLifePredictor
)


predictor = ShelfLifePredictor()


def predict_shelf_life(data: dict):

    result = predictor.predict(data)

    return {
        "remaining_shelf_life_days": round(
            float(result),
            2
        )
    }