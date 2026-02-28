from __future__ import annotations

from abc import ABC
from abc import abstractmethod

from pymongo import AsyncMongoClient
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase

from app.utilities import logging

logger = logging.get_logger(__name__)


class ImplementsMongoDB(ABC):
    """An abstract class that implements MongoDB access methods."""

    @abstractmethod
    def collection(self, name: str) -> AsyncCollection: ...

    @property
    @abstractmethod
    def database(self) -> AsyncDatabase: ...


class MongoDBClientAdapter(ImplementsMongoDB):
    """A MongoDB client adapter that manages the connection and provides
    collection access."""

    def __init__(self, connection_uri: str, database_name: str) -> None:
        self._client: AsyncMongoClient = AsyncMongoClient(connection_uri)
        self._database_name = database_name

    def collection(self, name: str) -> AsyncCollection:
        return self._client[self._database_name][name]

    @property
    def database(self) -> AsyncDatabase:
        return self._client[self._database_name]

    async def connect(self) -> None:
        await self._client.admin.command("ping")

    async def disconnect(self) -> None:
        self._client.close()

    async def create_indexes(self) -> None:
        users = self.collection("users")
        await users.create_index("username", unique=True)
        await users.create_index("email", unique=True)

        courses = self.collection("courses")
        await courses.create_index("topic")
        await courses.create_index("publicity")
        await courses.create_index("created_at")

        course_assigns = self.collection("course_assigns")
        await course_assigns.create_index("course_id")
        await course_assigns.create_index("user_id")
        await course_assigns.create_index(
            [("course_id", 1), ("user_id", 1)],
            unique=True,
        )

        course_materials = self.collection("course_materials")
        await course_materials.create_index("course_id")
        await course_materials.create_index([("course_id", 1), ("user_id", 1)])

        quiz_scores = self.collection("quiz_scores")
        await quiz_scores.create_index([("material_id", 1), ("user_id", 1)])
        await quiz_scores.create_index("created_at")

        logger.info("Created MongoDB indexes.")


def default() -> MongoDBClientAdapter:
    """Creates a default configuration for the MongoDB adapter using the `settings` module."""

    import urllib.parse

    from app import settings

    connection_uri = "mongodb://{username}:{password}@{host}:{port}".format(
        username=settings.MONGODB_USER,
        password=urllib.parse.quote(settings.MONGODB_PASSWORD),
        host=settings.MONGODB_HOST,
        port=settings.MONGODB_PORT,
    )

    return MongoDBClientAdapter(connection_uri, settings.MONGODB_DATABASE)
