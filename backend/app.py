from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import shutil
from pathlib import Path

from sqlalchemy import text

from backend.predictor import predict_image
from backend.database import engine
from backend.shelf_life_service import predict_shelf_life


# ==========================================================
# FastAPI Application
# ==========================================================

app = FastAPI(
    title="Food Freshness Monitoring API",
    description="YOLOv8 Food Freshness and Shelf-Life Prediction API",
    version="1.0"
)


# ==========================================================
# Upload Folder
# ==========================================================

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)


# ==========================================================
# Shelf-Life Input Schema
# ==========================================================

class ShelfLifeInput(BaseModel):

    Food_Type: str
    Variety: str

    Initial_Weight_g: float
    Current_Weight_g: float
    Weight_Loss_percent: float

    Storage_Temperature_C: float
    Relative_Humidity_percent: float

    Storage_Day: float
    Storage_Hours: float

    CO2_ppm: float
    Ethylene_ppm: float

    Firmness: float

    Color_L: float
    Color_a: float
    Color_b: float

    pH: float
    TSS_Brix: float

    Mold_Present: int
    Bruising: int
    Wrinkling: int
    Discoloration: int
    Yellowing: int
    Browning: int
    Rot: int
    Wilting: int
    Sprouting: int
    Odor_Change: int

    Freshness_Score: float
    Spoilage_Score: float


# ==========================================================
# Home
# ==========================================================

@app.get("/")
def home():

    return {
        "message": "Food Freshness Monitoring API is running!"
    }


# ==========================================================
# IMAGE PREDICTION
# ==========================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    inventory_id: int = 1
):

    try:

        # --------------------------------------------------
        # Save uploaded image temporarily
        # --------------------------------------------------

        image_path = UPLOAD_FOLDER / file.filename

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer
            )


        # --------------------------------------------------
        # Predict using YOLO model
        # --------------------------------------------------

        result = predict_image(
            str(image_path)
        )


        # --------------------------------------------------
        # Save information into database
        # --------------------------------------------------

        with engine.begin() as connection:

            # Save image
            image_result = connection.execute(
                text("""
                    INSERT INTO food_images
                    (
                        inventory_id,
                        image_name,
                        image_path
                    )
                    VALUES
                    (
                        :inventory_id,
                        :image_name,
                        :image_path
                    )
                    RETURNING image_id
                """),
                {
                    "inventory_id": inventory_id,
                    "image_name": file.filename,
                    "image_path": str(image_path)
                }
            )

            image_id = image_result.scalar_one()


            # Save prediction
            connection.execute(
                text("""
                    INSERT INTO predictions
                    (
                        image_id,
                        food_category,
                        freshness_status,
                        confidence
                    )
                    VALUES
                    (
                        :image_id,
                        :food_category,
                        :freshness_status,
                        :confidence
                    )
                """),
                {
                    "image_id": image_id,
                    "food_category": result["food_category"],
                    "freshness_status": result["freshness_status"],
                    "confidence": result["confidence"]
                }
            )


        # --------------------------------------------------
        # Delete temporary image
        # --------------------------------------------------

        image_path.unlink(
            missing_ok=True
        )


        # --------------------------------------------------
        # Response
        # --------------------------------------------------

        return JSONResponse(
            content={
                "message": "Prediction completed and saved to database",

                "food_category":
                    result["food_category"],

                "freshness_status":
                    result["freshness_status"],

                "confidence":
                    result["confidence"],

                "image_id":
                    image_id,

                "inventory_id":
                    inventory_id
            }
        )


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )


# ==========================================================
# SHELF-LIFE PREDICTION
# ==========================================================

@app.post("/predict/shelf-life")
async def predict_shelf_life_endpoint(
    data: ShelfLifeInput
):

    try:

        # --------------------------------------------------
        # Convert Pydantic model to dictionary
        # --------------------------------------------------

        input_data = data.model_dump()


        # --------------------------------------------------
        # Predict remaining shelf life
        # --------------------------------------------------

        result = predict_shelf_life(
            input_data
        )


        # --------------------------------------------------
        # Response
        # --------------------------------------------------

        return JSONResponse(
            content={
                "message":
                    "Shelf-life prediction completed",

                "food_type":
                    data.Food_Type,

                "variety":
                    data.Variety,

                "remaining_shelf_life_days":
                    result[
                        "remaining_shelf_life_days"
                    ]
            }
        )


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )