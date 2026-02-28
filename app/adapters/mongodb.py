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
