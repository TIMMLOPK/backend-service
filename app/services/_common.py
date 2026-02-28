from __future__ import annotations

from abc import ABC
from abc import ABCMeta
from abc import abstractmethod
from enum import EnumMeta
from enum import StrEnum
from typing import TypeIs

from fastapi import status

from app.adapters.aws import AWSSessionAdapter
from app.adapters.mongodb import ImplementsMongoDB
from app.adapters.openai import OpenAIClientAdapter
from app.adapters.redis import RedisClient
from app.adapters.storage import StorageAdapter
from app.resources import CourseAssignRepository
from app.resources import CourseMaterialRepository
from app.resources import CourseRepository
from app.resources import QuizScoreRepository
from app.resources import UserModel
from app.resources import UserRepository


class _CombinedMeta(EnumMeta, ABCMeta):
    pass


class ServiceError(ABC, StrEnum, metaclass=_CombinedMeta):
    # Stops EnumMeta from complaining about the OnSuccess type.
    _ignore_ = ["OnSuccess"]
    type OnSuccess[T] = T | ServiceError

    # This is technically more correct, but most type checkers really struggle with
    # the resolution of Self.
    # type OnSuccess[T] = T | Self

    @abstractmethod
    def service(self) -> str:
        """The prefix of the service for the error. Will resolve to `<service>.<error>`."""

        ...

    def status_code(self) -> int:
        """HTTP status code for this error. Override in subclasses for specific mappings."""
        return status.HTTP_500_INTERNAL_SERVER_ERROR

    def resolve_name(self) -> str:
        """A name of the error involving the service name."""
        return f"{self.service()}.{self.value}"


def is_success[V](result: ServiceError.OnSuccess[V]) -> TypeIs[V]:
    return not isinstance(result, ServiceError)


def is_error[V](result: ServiceError.OnSuccess[V]) -> TypeIs[ServiceError]:
    return isinstance(result, ServiceError)


class AbstractContext(ABC):
    """An abstract context class defining the context required for service functions
    to be provided by context providers."""

    @property
    @abstractmethod
    def _mongodb(self) -> ImplementsMongoDB: ...

    @property
    @abstractmethod
    def _redis(self) -> RedisClient: ...

    @property
    @abstractmethod
    def _aws(self) -> AWSSessionAdapter: ...

    @property
    @abstractmethod
    def _openai(self) -> OpenAIClientAdapter: ...

    @property
    @abstractmethod
    def _storage(self) -> StorageAdapter: ...

    @property
    def aws(self) -> AWSSessionAdapter:
        return self._aws

    @property
    def openai(self) -> OpenAIClientAdapter:
        return self._openai

    @property
    def storage(self) -> StorageAdapter:
        return self._storage

    @property
    def users(self) -> UserRepository:
        return UserRepository(self._mongodb)

    @property
    def courses(self) -> CourseRepository:
        return CourseRepository(self._mongodb)

    @property
    def course_assigns(self) -> CourseAssignRepository:
        return CourseAssignRepository(self._mongodb)

    @property
    def course_materials(self) -> CourseMaterialRepository:
        return CourseMaterialRepository(self._mongodb)

    @property
    def quiz_scores(self) -> QuizScoreRepository:
        return QuizScoreRepository(self._mongodb)


class AbstractAuthContext(AbstractContext):
    """An abstract context class for authenticated operations, providing
    a non-optional user property."""

    @property
    @abstractmethod
    def user(self) -> UserModel: ...
