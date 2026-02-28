from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from bson import ObjectId
from pydantic import BaseModel

from app.adapters.mongodb import ImplementsMongoDB


class UserType(StrEnum):
    ADMIN = "admin"
    STUDENT = "student"
    PARENT = "parent"
    SUPERVISED_STUDENT = "supervised_student"


class SupervisionDetailsModel(BaseModel):
    parent_id: str


class UserModel(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    password: str
    type: UserType
    supervision_details: SupervisionDetailsModel | None
    created_at: datetime


def _to_model(document: dict[str, Any]) -> UserModel:
    supervision_details = None
    if document.get("supervision_details") is not None:
        supervision_details = SupervisionDetailsModel(**document["supervision_details"])

    return UserModel(
        id=str(document["_id"]),
        username=document["username"],
        full_name=document["full_name"],
        email=document["email"],
        password=document["password"],
        type=document["type"],
        supervision_details=supervision_details,
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
        user_type: UserType,
        supervision_details: SupervisionDetailsModel | None = None,
        create_at: datetime | None = None,
    ) -> UserModel:
        create_at = create_at or datetime.now()
        document: dict[str, Any] = {
            "username": username,
            "full_name": full_name,
            "email": email,
            "password": password,
            "type": user_type.value,
            "supervision_details": (
                supervision_details.model_dump() if supervision_details else None
            ),
            "created_at": create_at,
        }
        result = await self._mongodb.collection("users").insert_one(document)
        return UserModel(
            id=str(result.inserted_id),
            username=username,
            full_name=full_name,
            email=email,
            password=password,
            type=user_type,
            supervision_details=supervision_details,
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

    async def find_dependants(self, parent_id: str) -> list[UserModel]:
        cursor = self._mongodb.collection("users").find(
            {"supervision_details.parent_id": parent_id},
        )
        return [_to_model(doc) async for doc in cursor]
