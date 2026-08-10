from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg://postgres:Food_1234@localhost:5432/food_freshness_db"

engine = create_engine(DATABASE_URL)