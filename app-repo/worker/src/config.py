import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Worker configuration loaded from environment variables."""

    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/aitaskplatform")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    WORKER_CONCURRENCY: int = int(os.getenv("WORKER_CONCURRENCY", "5"))


config = Config()


