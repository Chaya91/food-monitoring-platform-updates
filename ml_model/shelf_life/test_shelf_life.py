from shelf_life_predictor import ShelfLifePredictor


predictor = ShelfLifePredictor()


sample = {
    "Food_Type": "Apple",
    "Variety": "Granny Smith",

    "Initial_Weight_g": 209.737,
    "Current_Weight_g": 180.000,
    "Weight_Loss_percent": 14.17,

    "Storage_Temperature_C": 5.0,
    "Relative_Humidity_percent": 90.0,

    "Storage_Day": 3.0,
    "Storage_Hours": 72.0,

    "CO2_ppm": 450.0,
    "Ethylene_ppm": 0.5,

    "Firmness": 70.0,

    "Color_L": 60.0,
    "Color_a": 10.0,
    "Color_b": 30.0,

    "pH": 3.5,
    "TSS_Brix": 12.0,

    "Mold_Present": 0,
    "Bruising": 0,
    "Wrinkling": 0,
    "Discoloration": 0,
    "Yellowing": 0,
    "Browning": 0,
    "Rot": 0,
    "Wilting": 0,
    "Sprouting": 0,
    "Odor_Change": 0,

    "Freshness_Score": 85.0,
    "Spoilage_Score": 15.0
}


prediction = predictor.predict(sample)


print("=" * 60)
print("SHELF-LIFE PREDICTION TEST")
print("=" * 60)

print("Food Type :", sample["Food_Type"])
print("Variety   :", sample["Variety"])

print(
    "Temperature :",
    sample["Storage_Temperature_C"],
    "°C"
)

print(
    "Humidity    :",
    sample["Relative_Humidity_percent"],
    "%"
)

print(
    "Storage Day :",
    sample["Storage_Day"]
)

print()
print(
    f"Predicted Remaining Shelf Life: "
    f"{prediction:.2f} days"
)

print("=" * 60)