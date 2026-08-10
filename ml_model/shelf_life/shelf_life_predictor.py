from pathlib import Path
import joblib
import pandas as pd


class ShelfLifePredictor:

    def __init__(self, model_path=None):

        base_dir = Path(__file__).resolve().parent

        if model_path is None:
            model_path = base_dir / "shelf_life_model.joblib"

        self.model = joblib.load(model_path)

        self.feature_names = self.model.feature_names_

        self.categorical_features = [
            "Food_Type",
            "Variety"
        ]

    def predict(self, data):

        """
        Predict remaining shelf life.

        Parameters
        ----------
        data : dict
            Dictionary containing the 29 features required
            by the trained model.

        Returns
        -------
        float
            Predicted remaining shelf life in days.
        """

        # Create DataFrame with exactly the trained feature order
        input_data = pd.DataFrame(
            [data],
            columns=self.feature_names
        )

        # Make sure categorical values are strings
        for column in self.categorical_features:
            input_data[column] = input_data[column].astype(str)

        # Prediction
        prediction = self.model.predict(input_data)[0]

        # Shelf life cannot be negative
        prediction = max(float(prediction), 0.0)

        return prediction