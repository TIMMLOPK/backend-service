from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

APP_COMPONENT = os.environ["APP_COMPONENT"]

# MongoDB configuration
MONGODB_HOST = os.environ["MONGODB_HOST"]  # Non-standard
MONGODB_PORT = int(os.environ["MONGODB_PORT"])  # Non-standard
MONGODB_USER = os.environ["MONGO_INITDB_ROOT_USERNAME"]
MONGODB_PASSWORD = os.environ["MONGO_INITDB_ROOT_PASSWORD"]
MONGODB_DATABASE = os.environ["MONGO_INITDB_DATABASE"]

# Redis configuration
REDIS_HOST = os.environ["REDIS_HOST"]  # Non-standard
REDIS_PORT = int(os.environ["REDIS_PORT"])  # Non-standard
REDIS_DATABASE = int(os.environ["REDIS_DATABASE"])  # Non-standard

# AWS configuration
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")

# OpenAI configuration
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "Qwen/Qwen3-32B")

# JWT configuration
JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.environ.get("JWT_EXPIRATION_MINUTES", "1440"))  # 24h

# Storage configuration
STORAGE_BASE_PATH = os.environ.get("STORAGE_BASE_PATH", "/data/content")

# CORS configuration (comma-separated list of origins, empty to disable)
CORS_ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
