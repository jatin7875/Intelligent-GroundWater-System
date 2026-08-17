"""
utils/config.py — single source of truth for env vars and column-name mapping.
If the backend changes a column name or table name, this is the only file to edit.
"""
import os
from urllib.parse import urlparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be configured for the ML service.")

_database = urlparse(DATABASE_URL)
DB_HOST = _database.hostname
DB_PORT = str(_database.port or 5432)
DB_NAME = _database.path.lstrip("/")
DB_USER = _database.username
DB_PASSWORD = _database.password

# Set to False to work from CSV exports in data/ instead of Postgres
USE_DB = True

# Backend column names -> internal names used across ml-service
COLUMN_MAP = {
    "stationId": "station_id",
    "timestamp": "timestamp",
    "rawWaterLevel": "water_level",
}
