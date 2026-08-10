from pathlib import Path
import pandas as pd

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
# Load Shelf-Life Model
# ==========================================================

predictor = ShelfLifePredictor()


# ==========================================================
# Select a REAL row
# ==========================================================

row = df.iloc[0]


# ==========================================================
# Display Real Row Information
# ==========================================================

print()
print("=" * 60)
print("REAL DATA SHELF-LIFE TEST")
print("=" * 60)

print(f"Sample ID              : {row['Sample_ID']}")
print(f"Batch ID               : {row['Batch_ID']}")
print(f"Food Type              : {row['Food_Type']}")
print(f"Variety                : {row['Variety']}")

print(
    f"Storage Temperature    : "
    f"{row['Storage_Temperature_C']} °C"
)

print(
    f"Relative Humidity      : "
    f"{row['Relative_Humidity_percent']} %"
)

print(
    f"Storage Day            : "
    f"{row['Storage_Day']}"
)


# ==========================================================
# Prepare Model Input
# ==========================================================

input_data = {}

for feature in predictor.feature_names:
    input_data[feature] = row[feature]


# ==========================================================
# Predict
# ==========================================================

predicted = predictor.predict(input_data)

actual = float(
    row["Remaining_Shelf_Life_Days"]
)

absolute_error = abs(
    actual - predicted
)


# ==========================================================
# Results
# ==========================================================

print()
print("-" * 60)

print(
    f"Actual Shelf Life      : "
    f"{actual:.4f} days"
)

print(
    f"Predicted Shelf Life   : "
    f"{predicted:.4f} days"
)

print(
    f"Absolute Error         : "
    f"{absolute_error:.4f} days"
)

print("=" * 60)
print("Test completed successfully!")
print("=" * 60)