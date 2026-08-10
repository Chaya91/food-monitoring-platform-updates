from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import shutil
from pathlib import Path

from sqlalchemy import text

from predictor import predict_image
from database import engine


app = FastAPI(
    title="Food Freshness Monitoring API",
    description="YOLOv8 Food Freshness Classification",
    version="1.0"
)


# Folder to temporarily store uploaded images
UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "Food Freshness Monitoring API is running!"
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    inventory_id: int = 1
):
    try:
        # Save uploaded image temporarily
        image_path = UPLOAD_FOLDER / file.filename

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Predict using YOLO model
        result = predict_image(str(image_path))

        # Save image information into food_images table
        with engine.begin() as connection:

            image_result = connection.execute(
                text("""
                    INSERT INTO food_images
                    (inventory_id, image_name, image_path)
                    VALUES
                    (:inventory_id, :image_name, :image_path)
                    RETURNING image_id
                """),
                {
                    "inventory_id": inventory_id,
                    "image_name": file.filename,
                    "image_path": str(image_path)
                }
            )

            image_id = image_result.scalar_one()

            # Save prediction into predictions table
            connection.execute(
                text("""
                    INSERT INTO predictions
                    (image_id, food_category, freshness_status, confidence)
                    VALUES
                    (:image_id, :food_category, :freshness_status, :confidence)
                """),
                {
                    "image_id": image_id,
                    "food_category": result["food_category"],
                    "freshness_status": result["freshness_status"],
                    "confidence": result["confidence"]
                }
            )

        # Delete temporary uploaded image
        image_path.unlink(missing_ok=True)

        return JSONResponse(
            content={
                "message": "Prediction completed and saved to database",
                "food_category": result["food_category"],
                "freshness_status": result["freshness_status"],
                "confidence": result["confidence"],
                "image_id": image_id,
                "inventory_id": inventory_id
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )