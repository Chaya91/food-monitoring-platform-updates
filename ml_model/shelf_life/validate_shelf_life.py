from pathlib import Path
import pandas as pd
import numpy as np

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from shelf_life_predictor import ShelfLifePredictor


# ==========================================================
# Paths
# ==========================================================

DATASET_PATH = Path(
    r"C:\Users\gvski\Downloads\shelf_life_prediction_dataset.csv"
)


# ==========================================================
# Load Dataset
# ==========================================================

print("Loading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Dataset shape: {df.shape}")


# ==========================================================
# Select 1000 REAL samples
# ==========================================================

sample_df = df.sample(
    n=1000,
    random_state=42
).reset_index(drop=True)

print(f"Validation samples: {len(sample_df)}")


# ==========================================================
# Load Model
# ==========================================================

predictor = ShelfLifePredictor()


# ==========================================================
# Predictions
# ==========================================================

actual_values = []
predicted_values = []

print("\nGenerating predictions...")

for _, row in sample_df.iterrows():

    input_data = {}

    for feature in predictor.feature_names:
        input_data[feature] = row[feature]

    prediction = predictor.predict(input_data)

    actual_values.append(
        float(row["Remaining_Shelf_Life_Days"])
    )

    predicted_values.append(
        float(prediction)
    )


# ==========================================================
# Metrics
# ==========================================================

y_true = np.array(actual_values)
y_pred = np.array(predicted_values)

mae = mean_absolute_error(
    y_true,
    y_pred
)

rmse = np.sqrt(
    mean_squared_error(
        y_true,
        y_pred
    )
)

r2 = r2_score(
    y_true,
    y_pred
)


# ==========================================================
# Results
# ==========================================================

print("\n" + "=" * 60)
print("SHELF-LIFE MODEL — LOCAL VALIDATION")
print("=" * 60)

print(f"Samples : {len(y_true)}")
print(f"MAE     : {mae:.4f} days")
print(f"RMSE    : {rmse:.4f} days")
print(f"R²      : {r2:.4f}")

print("=" * 60)


# ==========================================================
# Compare with Kaggle Test Results
# ==========================================================

print("\nOriginal Kaggle test performance:")
print("MAE  : 4.6935 days")
print("RMSE : 14.3444 days")
print("R²   : 0.8158")

print("\nNote:")
print("The 1000-row validation sample is not the same")
print("as the original 8000-row test set, so the metrics")
print("do not need to be exactly identical.")