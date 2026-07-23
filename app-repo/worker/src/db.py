from pymongo import MongoClient
from pymongo.database import Database
from .config import config


_client: MongoClient | None = None
_db: Database | None = None


def get_database() -> Database:
    """Get or create the MongoDB database connection."""
    global _client, _db

    if _db is not None:
        return _db

    _client = MongoClient(config.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db_name = config.MONGODB_URI.rsplit("/", 1)[-1].split("?")[0]
    _db = _client[db_name]

    # Verify connection
    _client.admin.command("ping")
    print("Worker connected to MongoDB")

    return _db


def close_database() -> None:
    """Close the MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        print("MongoDB connection closed")
