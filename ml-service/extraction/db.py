"""
extraction/db.py — read-only PostgreSQL connection.
Never call .to_sql()/.execute(INSERT/UPDATE) through this engine.
"""

import os
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def get_engine():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be configured to read PostgreSQL data.")
    return create_engine(database_url)


def fetch_table(table_name: str) -> pd.DataFrame:
    engine = get_engine()
    return pd.read_sql_table(table_name, engine)
