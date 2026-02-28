from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

APP_COMPONENT = os.environ["APP_COMPONENT"]

# MySQL configuration
MYSQL_HOST = os.environ["MYSQL_HOST"]  # Non-standard
MYSQL_TCP_PORT = int(os.environ["MYSQL_TCP_PORT"])
MYSQL_USER = os.environ["MYSQL_USER"]
MYSQL_PASSWORD = os.environ["MYSQL_PASSWORD"]
MYSQL_DATABASE = os.environ["MYSQL_DATABASE"]

# Redis configuration
REDIS_HOST = os.environ["REDIS_HOST"]  # Non-standard
REDIS_PORT = int(os.environ["REDIS_PORT"])  # Non-standard
REDIS_DATABASE = int(os.environ["REDIS_DATABASE"])  # Non-standard

# MiniMax configuration
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MINIMAX_GROUP_ID = os.environ.get("MINIMAX_GROUP_ID", "")

# AWS configuration
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")

# JWT configuration
JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.environ.get("JWT_EXPIRATION_MINUTES", "1440"))  # 24h

# CORS configuration (comma-separated list of origins, empty to disable)
CORS_ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
