from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.adapters.mysql import ImplementsMySQL


class UserModel(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    password: str
    created_at: datetime


class UserRepository:
    __slots__ = ("_mysql",)

    def __init__(self, mysql: ImplementsMySQL) -> None:
        self._mysql = mysql

    async def create(
        self,
        username: str,
        full_name: str,
        email: str,
        password: str,
        create_at: datetime | None = None,
    ) -> UserModel:
        create_at = create_at or datetime.now()
        user_id = await self._mysql.execute(
            "INSERT INTO users (username, full_name, email, password, created_at) "
            "VALUES (:username, :full_name, :email, :password, :created_at)",
            {
                "username": username,
                "full_name": full_name,
                "email": email,
                "password": password,
                "created_at": create_at,
            },
        )
        return UserModel(
            id=user_id,
            username=username,
            full_name=full_name,
            email=email,
            password=password,
            created_at=create_at,
        )

    async def find_by_id(self, id: int) -> UserModel | None:
        user = await self._mysql.fetch_one(
            "SELECT id, username, full_name, email, password, created_at FROM users WHERE id = :id",
            {"id": id},
        )
        return UserModel(**user) if user else None

    async def find_by_username(self, username: str) -> UserModel | None:
        user = await self._mysql.fetch_one(
            "SELECT id, username, full_name, email, password, created_at FROM users WHERE username = :username",
            {"username": username},
        )
        return UserModel(**user) if user else None

    async def find_by_email(self, email: str) -> UserModel | None:
        user = await self._mysql.fetch_one(
            "SELECT id, username, full_name, email, password, created_at FROM users WHERE email = :email",
            {"email": email},
        )
        return UserModel(**user) if user else None
