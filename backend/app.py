from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

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
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# Upload Folder
# ==========================================================

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

# ==========================================================
# ML OUTPUT FILES
# ==========================================================

ML_OUTPUT_FOLDER = Path("ml_model") / "outputs"
ML_OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

app.mount(
    "/ml-output",
    StaticFiles(directory=str(ML_OUTPUT_FOLDER)),
    name="ml-output"
)

# ==========================================================
# FRESHNESS SCORE CALCULATION
# ==========================================================

def calculate_freshness_score(status, confidence):
    """
    Convert ML prediction into freshness percentage.

    Fresh:
        99.7% confidence -> 99.7% freshness

    Spoiled:
        99.7% confidence -> 0.3% freshness

    Not Scanned:
        None
    """

    status = (status or "Not Scanned").strip()

    if status == "Not Scanned":
        return None

    confidence = float(confidence or 0.0)

    confidence_percent = confidence * 100

    confidence_percent = max(
        0.0,
        min(100.0, confidence_percent)
    )

    if status == "Fresh":
        return round(
            confidence_percent,
            2
        )

    if status == "Spoiled":
        return round(
            100.0 - confidence_percent,
            2
        )

    if status == "Good":
        return round(
            confidence_percent,
            2
        )

    if status == "Acceptable":
        return round(
            confidence_percent,
            2
        )

    if status == "Near Spoilage":
        return round(
            100.0 - confidence_percent,
            2
        )

    if status == "Warning":
        return round(
            confidence_percent,
            2
        )

    return None


# ==========================================================
# SHELF-LIFE INPUT
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
# INVENTORY INPUT
# ==========================================================

class InventoryInput(BaseModel):

    user_id: int
    food_name: str
    category: str
    batch_number: str
    quantity: int
    manufacture_date: str
    expiry_date: str


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/health")
def health():
    try:
        with engine.begin() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected"
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "database": "unavailable",
                "error": str(e)
            }
        )


# ==========================================================
# HOME
# ==========================================================

@app.get("/")
def home():

    return {
        "message":
            "Food Freshness Monitoring API is running!"
    }


# ==========================================================
# IMAGE PREDICTION
# ==========================================================

# ==========================================================
# IMAGE PREDICTION
# ==========================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    inventory_id: int = 1
):

    image_path = None

    try:

        # --------------------------------------------------
        # Save uploaded image
        # --------------------------------------------------

        safe_filename = Path(
            file.filename or "uploaded_image.jpg"
        ).name

        image_path = (
            UPLOAD_FOLDER /
            safe_filename
        )

        with open(
            image_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # --------------------------------------------------
        # ML Prediction
        # --------------------------------------------------

        result = predict_image(
            str(image_path)
        )

        print("PREDICTION RESULT:", result)

        food_category = result[
            "food_category"
        ]

        freshness_status = result[
            "freshness_status"
        ]

        confidence = float(
            result["confidence"]
        )

        # --------------------------------------------------
        # Freshness Score
        # --------------------------------------------------

        freshness_score = (
            calculate_freshness_score(
                freshness_status,
                confidence
            )
        )

        # --------------------------------------------------
        # Rotten Area Results
        # --------------------------------------------------

        rotten_regions = int(
            result.get(
                "rotten_regions",
                0
            )
        )

        rotten_area_percent = float(
            result.get(
                "rotten_area_percent",
                0.0
            )
        )

        rotten_output_path = result.get(
            "rotten_output_path"
        )

        rotten_mask_path = result.get(
            "rotten_mask_path"
        )

            # --------------------------------------------------
        # Convert ML output paths to browser URLs
        # --------------------------------------------------

        rotten_output_url = None
        rotten_mask_url = None

        if rotten_output_path:
            rotten_output_url = (
                "/ml-output/rotten/api_rotten.png"
            )

        if rotten_mask_path:
            rotten_mask_url = (
                "/ml-output/rotten/api_rotten_mask.png"
            )
        # --------------------------------------------------
        # Save prediction to database
        # --------------------------------------------------

        with engine.begin() as connection:

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
                    "inventory_id":
                        inventory_id,

                    "image_name":
                        safe_filename,

                    "image_path":
                        str(image_path)
                }
            )

            image_id = (
                image_result.scalar_one()
            )

            prediction_result = (
                connection.execute(
                    text("""
                        INSERT INTO predictions
                        (
                            image_id,
                            food_category,
                            freshness_status,
                            confidence,
                            rotten_regions,
            rotten_area_percent,
            rotten_output_path,
            rotten_mask_path
                        )
                        VALUES
                        (
                            :image_id,
                            :food_category,
                            :freshness_status,
                            :confidence,
                            :rotten_regions,
            :rotten_area_percent,
            :rotten_output_path,
            :rotten_mask_path
                        )
                        RETURNING prediction_id
                    """),
                    {
                        "image_id":
                            image_id,

                        "food_category":
                            food_category,

                        "freshness_status":
                            freshness_status,

                        "confidence":
                            confidence,
                             "rotten_regions":
            rotten_regions,

        "rotten_area_percent":
            rotten_area_percent,

        "rotten_output_path":
            rotten_output_path,

        "rotten_mask_path":
            rotten_mask_path
                    }
                )
            )

            prediction_id = (
                prediction_result.scalar_one()
            )

        # --------------------------------------------------
        # Delete temporary uploaded image
        # --------------------------------------------------

        if image_path:
            image_path.unlink(
                missing_ok=True
            )

        # --------------------------------------------------
        # Response
        # --------------------------------------------------

        return JSONResponse(
            content={

                "message":
                    "Prediction completed and saved to database",

                "food_category":
                    food_category,

                "freshness_status":
                    freshness_status,

                "confidence":
                    confidence,

                "freshness_score":
                    freshness_score,

                "rotten_regions":
                    rotten_regions,

                "rotten_area_percent":
                    round(
                        rotten_area_percent,
                        2
                    ),

                "rotten_output_url":
                    rotten_output_url,

                "rotten_mask_url":
                    rotten_mask_url,

                "prediction_id":
                    prediction_id,

                "image_id":
                    image_id,

                "inventory_id":
                    inventory_id
            }
        )

    except Exception as e:

        if image_path:
            image_path.unlink(
                missing_ok=True
            )

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )
# ==========================================================
# GET INVENTORY
# ==========================================================

@app.get("/inventory")
def get_inventory():

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        i.inventory_id,
                        i.user_id,
                        i.food_name,
                        i.category,
                        i.batch_number,
                        i.quantity,
                        i.manufacture_date,
                        i.expiry_date,
                        i.created_at,

                        lp.food_category AS predicted_food_category,

                        COALESCE(
                            lp.freshness_status,
                            'Not Scanned'
                        ) AS freshness_status,

                        COALESCE(
                            lp.confidence,
                            0
                        ) AS confidence,

                        lp.predicted_at AS prediction_date

                    FROM inventory i

                    LEFT JOIN (
                        SELECT
                            fi.inventory_id,
                            p.food_category,
                            p.freshness_status,
                            p.confidence,
                            p.predicted_at,
                            ROW_NUMBER() OVER (
                                PARTITION BY fi.inventory_id
                                ORDER BY p.prediction_id DESC
                            ) AS rn
                        FROM food_images fi
                        INNER JOIN predictions p
                            ON p.image_id = fi.image_id
                    ) lp
                        ON lp.inventory_id = i.inventory_id
                        AND lp.rn = 1

                    ORDER BY i.inventory_id DESC
                """)
            )

            rows = (
                result.mappings().all()
            )


        inventory = []

        for row in rows:

            item = dict(row)

            status = (
                item.get(
                    "freshness_status"
                )
                or "Not Scanned"
            )

            confidence = float(
                item.get(
                    "confidence"
                ) or 0
            )

            item[
                "freshness_status"
            ] = status

            item[
                "confidence"
            ] = confidence

            item[
                "freshness_score"
            ] = calculate_freshness_score(
                status,
                confidence
            )

            inventory.append(item)


        return inventory


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )


# ==========================================================
# GET SINGLE INVENTORY ITEM
# ==========================================================

# ==========================================================
# GET SINGLE INVENTORY ITEM
# ==========================================================

@app.get("/inventory/{inventory_id}")
def get_inventory_item(inventory_id: int):

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        i.inventory_id,
                        i.user_id,
                        i.food_name,
                        i.category,
                        i.batch_number,
                        i.quantity,
                        i.manufacture_date,
                        i.expiry_date,
                        i.created_at,

                        lp.food_category
                            AS predicted_food_category,

                        COALESCE(
                            lp.freshness_status,
                            'Not Scanned'
                        )
                            AS freshness_status,

                        COALESCE(
                            lp.confidence,
                            0
                        )
                            AS confidence,

                        lp.predicted_at
                            AS prediction_date,

                        COALESCE(
                            lp.rotten_regions,
                            0
                        )
                            AS rotten_regions,

                        COALESCE(
                            lp.rotten_area_percent,
                            0
                        )
                            AS rotten_area_percent,

                        lp.rotten_output_path
                            AS rotten_output_path,

                        lp.rotten_mask_path
                            AS rotten_mask_path,

                        CASE

                            WHEN lp.freshness_status = 'Spoiled'
                            THEN
                                GREATEST(
                                    0,
                                    (
                                        1 -
                                        COALESCE(
                                            lp.confidence,
                                            0
                                        )
                                    ) * 100
                                )

                            WHEN lp.freshness_status IN (
                                'Fresh',
                                'Good',
                                'Acceptable'
                            )
                            THEN
                                COALESCE(
                                    lp.confidence,
                                    0
                                ) * 100

                            WHEN lp.freshness_status IN (
                                'Warning',
                                'Near Spoilage'
                            )
                            THEN
                                GREATEST(
                                    0,
                                    (
                                        1 -
                                        COALESCE(
                                            lp.confidence,
                                            0
                                        )
                                    ) * 100
                                )

                            ELSE NULL

                        END AS freshness_score

                    FROM inventory i

                    LEFT JOIN (

                        SELECT
                            fi.inventory_id,

                            p.food_category,

                            p.freshness_status,

                            p.confidence,

                            p.predicted_at,

                            p.rotten_regions,

                            p.rotten_area_percent,

                            p.rotten_output_path,

                            p.rotten_mask_path,

                            ROW_NUMBER() OVER (
                                PARTITION BY
                                    fi.inventory_id

                                ORDER BY
                                    p.prediction_id DESC
                            ) AS rn

                        FROM food_images fi

                        INNER JOIN predictions p
                            ON p.image_id = fi.image_id

                    ) lp

                        ON lp.inventory_id =
                           i.inventory_id

                        AND lp.rn = 1

                    WHERE
                        i.inventory_id =
                        :inventory_id

                    LIMIT 1
                """),

                {
                    "inventory_id":
                        inventory_id
                }
            )

            row = result.mappings().first()

            if not row:

                raise HTTPException(
                    status_code=404,
                    detail="Inventory item not found"
                )

            data = dict(row)

            # --------------------------------------------------
            # Convert stored filesystem paths to browser URLs
            # --------------------------------------------------

            if data.get("rotten_output_path"):

                data["rotten_output_url"] = (
                    "/ml-output/rotten/api_rotten.png"
                )

            else:

                data["rotten_output_url"] = None

            if data.get("rotten_mask_path"):

                data["rotten_mask_url"] = (
                    "/ml-output/rotten/api_rotten_mask.png"
                )

            else:

                data["rotten_mask_url"] = None

            # --------------------------------------------------
            # Do not expose internal Windows filesystem paths
            # --------------------------------------------------

            data.pop(
                "rotten_output_path",
                None
            )

            data.pop(
                "rotten_mask_path",
                None
            )

            return data

    except HTTPException:

        raise

    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )
# ==========================================================
# CREATE INVENTORY
# ==========================================================

@app.post("/inventory")
def create_inventory(
    data: InventoryInput
):

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text("""
                    INSERT INTO inventory
                    (
                        user_id,
                        food_name,
                        category,
                        batch_number,
                        quantity,
                        manufacture_date,
                        expiry_date
                    )
                    VALUES
                    (
                        :user_id,
                        :food_name,
                        :category,
                        :batch_number,
                        :quantity,
                        :manufacture_date,
                        :expiry_date
                    )
                    RETURNING
                        inventory_id,
                        user_id,
                        food_name,
                        category,
                        batch_number,
                        quantity,
                        manufacture_date,
                        expiry_date,
                        created_at
                """),
                {
                    "user_id":
                        data.user_id,

                    "food_name":
                        data.food_name,

                    "category":
                        data.category,

                    "batch_number":
                        data.batch_number,

                    "quantity":
                        data.quantity,

                    "manufacture_date":
                        data.manufacture_date,

                    "expiry_date":
                        data.expiry_date
                }
            )

            inventory = (
                result.mappings().first()
            )


        return {
            "message":
                "Inventory item created successfully",

            "inventory":
                dict(inventory)
        }


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )


# ==========================================================
# UPDATE INVENTORY
# ==========================================================

@app.put("/inventory/{inventory_id}")
def update_inventory(
    inventory_id: int,
    data: InventoryInput
):

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text("""
                    UPDATE inventory

                    SET
                        user_id =
                            :user_id,

                        food_name =
                            :food_name,

                        category =
                            :category,

                        batch_number =
                            :batch_number,

                        quantity =
                            :quantity,

                        manufacture_date =
                            :manufacture_date,

                        expiry_date =
                            :expiry_date

                    WHERE inventory_id =
                          :inventory_id

                    RETURNING
                        inventory_id,
                        user_id,
                        food_name,
                        category,
                        batch_number,
                        quantity,
                        manufacture_date,
                        expiry_date,
                        created_at
                """),
                {
                    "inventory_id":
                        inventory_id,

                    "user_id":
                        data.user_id,

                    "food_name":
                        data.food_name,

                    "category":
                        data.category,

                    "batch_number":
                        data.batch_number,

                    "quantity":
                        data.quantity,

                    "manufacture_date":
                        data.manufacture_date,

                    "expiry_date":
                        data.expiry_date
                }
            )

            inventory = (
                result.mappings().first()
            )


        if not inventory:

            return JSONResponse(
                status_code=404,
                content={
                    "error":
                        "Inventory item not found"
                }
            )


        return {
            "message":
                "Inventory item updated successfully",

            "inventory":
                dict(inventory)
        }


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )


# ==========================================================
# DELETE INVENTORY
# ==========================================================

@app.delete("/inventory/{inventory_id}")
def delete_inventory(
    inventory_id: int
):

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text("""
                    DELETE FROM inventory

                    WHERE inventory_id =
                          :inventory_id

                    RETURNING inventory_id
                """),
                {
                    "inventory_id":
                        inventory_id
                }
            )

            deleted = (
                result.scalar()
            )


        if deleted is None:

            return JSONResponse(
                status_code=404,
                content={
                    "error":
                        "Inventory item not found"
                }
            )


        return {
            "message":
                "Inventory item deleted successfully",

            "inventory_id":
                deleted
        }


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

        input_data = data.model_dump()

        result = predict_shelf_life(
            input_data
        )

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


# ==========================================================
# DASHBOARD SUMMARY
# ==========================================================

@app.get("/dashboard/summary")
def dashboard_summary():

    try:

        with engine.begin() as connection:

            # --------------------------------------------------
            # Get inventory + latest prediction
            # --------------------------------------------------

            result = connection.execute(
                text("""
                    SELECT
                        i.inventory_id,

                        COALESCE(
                            p.freshness_status,
                            'Not Scanned'
                        ) AS freshness_status,

                        COALESCE(
                            p.confidence,
                            0
                        ) AS confidence,

                        i.expiry_date

                    FROM inventory i

                    LEFT JOIN LATERAL
                    (
                        SELECT
                            p.freshness_status,
                            p.confidence

                        FROM food_images fi

                        INNER JOIN predictions p
                            ON fi.image_id = p.image_id

                        WHERE fi.inventory_id =
                              i.inventory_id

                        ORDER BY
                            p.prediction_id DESC

                        LIMIT 1

                    ) p ON TRUE

                    ORDER BY
                        i.inventory_id
                """)
            )

            rows = result.mappings().all()


            # --------------------------------------------------
            # Calculate statistics
            # --------------------------------------------------

            total_items = len(rows)

            fresh_items = 0
            good_items = 0
            acceptable_items = 0
            near_spoilage_items = 0
            spoiled_items = 0

            freshness_values = []


            for row in rows:

                status = (
                    row["freshness_status"]
                    or "Not Scanned"
                )

                confidence = float(
                    row["confidence"] or 0
                )


                # Status counts
                if status == "Fresh":
                    fresh_items += 1

                elif status == "Good":
                    good_items += 1

                elif status == "Acceptable":
                    acceptable_items += 1

                elif status == "Near Spoilage":
                    near_spoilage_items += 1

                elif status == "Spoiled":
                    spoiled_items += 1


                # Correct freshness score
                freshness_score = (
                    calculate_freshness_score(
                        status,
                        confidence
                    )
                )

                if freshness_score is not None:
                    freshness_values.append(
                        freshness_score
                    )


            # --------------------------------------------------
            # Average freshness
            # --------------------------------------------------

            if freshness_values:

                average_freshness = round(
                    sum(freshness_values)
                    /
                    len(freshness_values),
                    2
                )

            else:

                average_freshness = 0


            # --------------------------------------------------
            # Average shelf life
            # --------------------------------------------------

            shelf_result = connection.execute(
                text("""
                    SELECT
                        AVG(
                            expiry_date -
                            CURRENT_DATE
                        ) AS avg_days

                    FROM inventory

                    WHERE expiry_date IS NOT NULL
                """)
            )

            shelf_row = (
                shelf_result.mappings().first()
            )


            average_shelf_life = round(
                float(
                    shelf_row["avg_days"] or 0
                ),
                1
            )


        # ------------------------------------------------------
        # Quality distribution
        # ------------------------------------------------------

        quality_distribution = {

            "Fresh":
                fresh_items,

            "Good":
                good_items,

            "Acceptable":
                acceptable_items,

            "Near Spoilage":
                near_spoilage_items,

            "Spoiled":
                spoiled_items
        }


        return {

            "total_items":
                total_items,

            "fresh_items":
                fresh_items,

            "good_items":
                good_items,

            "acceptable_items":
                acceptable_items,

            "near_spoilage_items":
                near_spoilage_items,

            "spoiled_items":
                spoiled_items,

            "average_freshness":
                average_freshness,

            "average_shelf_life":
                average_shelf_life,

            "quality_distribution":
                quality_distribution
        }


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )
# ==========================================================
# DASHBOARD ANALYTICS
# ==========================================================

@app.get("/dashboard/analytics")
def dashboard_analytics():

    try:

        with engine.begin() as connection:

            # --------------------------------------------------
            # Freshness trend
            # --------------------------------------------------

            trend_result = connection.execute(
    text("""
        SELECT
            DATE(p.predicted_at) AS prediction_date,

            ROUND(
                AVG(
                    CASE

                        WHEN p.freshness_status = 'Fresh'
                        THEN p.confidence * 100

                        WHEN p.freshness_status = 'Spoiled'
                        THEN 100 - (p.confidence * 100)

                        WHEN p.freshness_status = 'Near Spoilage'
                        THEN 100 - (p.confidence * 100)

                        WHEN p.freshness_status = 'Good'
                        THEN p.confidence * 100

                        WHEN p.freshness_status = 'Acceptable'
                        THEN p.confidence * 100

                        WHEN p.freshness_status = 'Warning'
                        THEN p.confidence * 100

                        ELSE NULL

                    END
                )::numeric,
                2
            ) AS score

        FROM predictions p

        INNER JOIN food_images fi
            ON p.image_id = fi.image_id

        INNER JOIN
        (
            SELECT
                fi2.inventory_id,
                MAX(p2.prediction_id)
                    AS latest_prediction_id

            FROM food_images fi2

            INNER JOIN predictions p2
                ON fi2.image_id = p2.image_id

            GROUP BY
                fi2.inventory_id

        ) latest

            ON fi.inventory_id =
               latest.inventory_id

            AND p.prediction_id =
                latest.latest_prediction_id

        GROUP BY
            DATE(p.predicted_at)

        ORDER BY
            prediction_date
    """)
)

            trend_rows = (
                trend_result.mappings().all()
            )


            # --------------------------------------------------
            # Quality distribution
            # --------------------------------------------------

            quality_result = connection.execute(
                text("""
                    SELECT

                        p.freshness_status
                            AS status,

                        COUNT(*) AS item_count

                    FROM predictions p

                    INNER JOIN food_images fi
                        ON p.image_id =
                           fi.image_id

                    INNER JOIN
                    (
                        SELECT

                            fi2.inventory_id,

                            MAX(
                                p2.prediction_id
                            )
                            AS latest_prediction_id

                        FROM food_images fi2

                        INNER JOIN predictions p2
                            ON fi2.image_id =
                               p2.image_id

                        GROUP BY
                            fi2.inventory_id

                    ) latest

                        ON fi.inventory_id =
                           latest.inventory_id

                        AND p.prediction_id =
                            latest.latest_prediction_id

                    GROUP BY
                        p.freshness_status

                    ORDER BY
                        p.freshness_status
                """)
            )

            quality_rows = (
                quality_result.mappings().all()
            )


            # --------------------------------------------------
            # Spoilage risk
            # --------------------------------------------------

            category_result = connection.execute(
                text("""
                    SELECT

                        i.category,

                        COUNT(*) AS total_items,

                        SUM(
                            CASE

                                WHEN
                                    p.freshness_status
                                    IN (
                                        'Near Spoilage',
                                        'Spoiled'
                                    )

                                THEN 1

                                ELSE 0

                            END
                        ) AS risky_items

                    FROM inventory i

                    INNER JOIN food_images fi
                        ON i.inventory_id =
                           fi.inventory_id

                    INNER JOIN predictions p
                        ON fi.image_id =
                           p.image_id

                    INNER JOIN
                    (
                        SELECT

                            fi2.inventory_id,

                            MAX(
                                p2.prediction_id
                            )
                            AS latest_prediction_id

                        FROM food_images fi2

                        INNER JOIN predictions p2
                            ON fi2.image_id =
                               p2.image_id

                        GROUP BY
                            fi2.inventory_id

                    ) latest

                        ON fi.inventory_id =
                           latest.inventory_id

                        AND p.prediction_id =
                            latest.latest_prediction_id

                    GROUP BY
                        i.category

                    ORDER BY
                        i.category
                """)
            )

            category_rows = (
                category_result.mappings().all()
            )


            # --------------------------------------------------
            # Shelf-life distribution
            # --------------------------------------------------

            shelf_result = connection.execute(
                text("""
                    SELECT

                        shelf_range,

                        COUNT(*) AS item_count

                    FROM
                    (
                        SELECT

                            CASE

                                WHEN
                                    (
                                        i.expiry_date -
                                        CURRENT_DATE
                                    ) <= 2

                                THEN '0-2 Days'


                                WHEN
                                    (
                                        i.expiry_date -
                                        CURRENT_DATE
                                    ) <= 5

                                THEN '3-5 Days'


                                WHEN
                                    (
                                        i.expiry_date -
                                        CURRENT_DATE
                                    ) <= 10

                                THEN '6-10 Days'


                                ELSE '11+ Days'

                            END AS shelf_range,

                            CASE

                                WHEN
                                    (
                                        i.expiry_date -
                                        CURRENT_DATE
                                    ) <= 2

                                THEN 1


                                WHEN
                                    (
                                        i.expiry_date -
                                        CURRENT_DATE
                                    ) <= 5

                                THEN 2


                                WHEN
                                    (
                                        i.expiry_date -
                                        CURRENT_DATE
                                    ) <= 10

                                THEN 3


                                ELSE 4

                            END AS sort_order

                        FROM inventory i

                    ) shelf_data

                    GROUP BY
                        shelf_range,
                        sort_order

                    ORDER BY
                        sort_order
                """)
            )

            shelf_rows = (
                shelf_result.mappings().all()
            )


        # ------------------------------------------------------
        # Build analytics response
        # ------------------------------------------------------

        freshness_trend = [

            {
                "date":
                    row["prediction_date"],

                "score":
                    float(
                        row["score"] or 0
                    )
            }

            for row in trend_rows
        ]


        quality_distribution = [

            {
                "status":
                    row["status"],

                "count":
                    int(
                        row["item_count"]
                    )
            }

            for row in quality_rows
        ]


        spoilage_risk = []

        for row in category_rows:

            total = int(
                row["total_items"] or 0
            )

            risky = int(
                row["risky_items"] or 0
            )

            risk = (
                (risky / total) * 100
                if total > 0
                else 0
            )

            spoilage_risk.append(
                {
                    "category":
                        row["category"],

                    "risk":
                        round(
                            risk,
                            2
                        )
                }
            )


        shelf_life_distribution = [

            {
                "range":
                    row["shelf_range"],

                "count":
                    int(
                        row["item_count"]
                    )
            }

            for row in shelf_rows
        ]


        return {

            "freshness_trend":
                freshness_trend,

            "quality_distribution":
                quality_distribution,

            "spoilage_risk":
                spoilage_risk,

            "shelf_life_distribution":
                shelf_life_distribution,

            "storage_temperature":
                [],

            "humidity_logs":
                []
        }


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )


# ==========================================================
# DASHBOARD ALERTS
# ==========================================================

@app.get("/dashboard/alerts")
def dashboard_alerts():

    try:

        with engine.begin() as connection:

            result = connection.execute(
                text("""
                    SELECT

                        p.prediction_id,

                        i.food_name,

                        i.batch_number,

                        p.freshness_status,

                        p.confidence,

                        p.predicted_at

                    FROM predictions p

                    INNER JOIN food_images fi
                        ON p.image_id =
                           fi.image_id

                    INNER JOIN inventory i
                        ON fi.inventory_id =
                           i.inventory_id

                    INNER JOIN
                    (
                        SELECT

                            fi2.inventory_id,

                            MAX(
                                p2.prediction_id
                            )
                            AS latest_prediction_id

                        FROM food_images fi2

                        INNER JOIN predictions p2
                            ON fi2.image_id =
                               p2.image_id

                        GROUP BY
                            fi2.inventory_id

                    ) latest

                        ON fi.inventory_id =
                           latest.inventory_id

                        AND p.prediction_id =
                            latest.latest_prediction_id

                    WHERE
                        p.freshness_status IN
                        (
                            'Spoiled',
                            'Near Spoilage',
                            'Warning',
                            'Good',
                            'Acceptable',
                            'Fresh'
                        )

                    ORDER BY
                        p.predicted_at DESC
                """)
            )

            rows = (
                result.mappings().all()
            )


        alerts = []

        for row in rows:

            status = (
                row["freshness_status"]
                or "Unknown"
            )

            confidence = float(
                row["confidence"] or 0
            )

            confidence_percent = (
                confidence * 100
            )


            if status == "Spoiled":

                level = "Critical"

                title = (
                    "Food item classified as spoiled"
                )

            elif status == "Near Spoilage":

                level = "Warning"

                title = (
                    "Food item is near spoilage"
                )

            elif status == "Warning":

                level = "Warning"

                title = (
                    "Food freshness warning"
                )

            else:

                level = "Info"

                title = (
                    "Food prediction updated"
                )


            target = (
                f"{row['food_name']} "
                f"Batch #{row['batch_number']}"
            )


            details = (
                f"AI classification: "
                f"{status}. "
                f"Confidence: "
                f"{confidence_percent:.2f}%."
            )


            alerts.append(
                {
                    "id":
                        f"prediction_{row['prediction_id']}",

                    "type":
                        "Freshness Alert",

                    "level":
                        level,

                    "title":
                        title,

                    "target":
                        target,

                    "details":
                        details,

                    "timestamp":
                        str(
                            row["predicted_at"]
                        ),

                    "status":
                        status
                }
            )


        return alerts


    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )