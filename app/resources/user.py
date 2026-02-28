from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId
from pydantic import BaseModel

from app.adapters.mongodb import ImplementsMongoDB


class UserModel(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    password: str
    created_at: datetime


def _to_model(document: dict[str, Any]) -> UserModel:
    return UserModel(
        id=str(document["_id"]),
        username=document["username"],
        full_name=document["full_name"],
        email=document["email"],
        password=document["password"],
        created_at=document["created_at"],
    )


class UserRepository:
    __slots__ = ("_mongodb",)

    def __init__(self, mongodb: ImplementsMongoDB) -> None:
        self._mongodb = mongodb

    async def create(
        self,
        username: str,
        full_name: str,
        email: str,
        password: str,
        create_at: datetime | None = None,
    ) -> UserModel:
        create_at = create_at or datetime.now()
        document = {
            "username": username,
            "full_name": full_name,
            "email": email,
            "password": password,
            "created_at": create_at,
        }
        result = await self._mongodb.collection("users").insert_one(document)
        return UserModel(
            id=str(result.inserted_id),
            username=username,
            full_name=full_name,
            email=email,
            password=password,
            created_at=create_at,
        )

    async def find_by_id(self, id: str) -> UserModel | None:
        document = await self._mongodb.collection("users").find_one(
            {"_id": ObjectId(id)},
        )
        return _to_model(document) if document else None

    async def find_by_username(self, username: str) -> UserModel | None:
        document = await self._mongodb.collection("users").find_one(
            {"username": username},
        )
        return _to_model(document) if document else None

    async def find_by_email(self, email: str) -> UserModel | None:
        document = await self._mongodb.collection("users").find_one(
            {"email": email},
        )
        return _to_model(document) if document else None
