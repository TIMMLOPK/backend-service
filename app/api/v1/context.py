# =============================================================================
# WARNING: DO NOT ADD `from __future__ import annotations` TO THIS FILE
# =============================================================================
#
# FastAPI's dependency injection relies on runtime type introspection to resolve
# dependencies. When `from __future__ import annotations` is enabled (PEP 563),
# all annotations become forward references (strings) that are evaluated lazily.

# The workaround is to NOT use `from __future__ import annotations` in files
# that define FastAPI dependencies. All other files in this codebase use it.
# =============================================================================

from collections.abc import Callable
from typing import Annotated
from typing import override

from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from fastapi import status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

from app.adapters.aws import AWSSessionAdapter
from app.adapters.mongodb import ImplementsMongoDB
from app.adapters.mongodb import MongoDBClientAdapter
from app.adapters.openai import OpenAIClientAdapter
from app.adapters.redis import RedisClient
from app.adapters.storage import StorageAdapter
from app.resources import UserModel
from app.resources import UserRepository
from app.resources import UserType
from app.services import AbstractAuthContext
from app.services import AbstractContext
from app.utilities import tokens


class HTTPContext(AbstractContext):
    """Context for read-only operations using the client directly."""

    def __init__(self, request: Request) -> None:
        self.request = request

    @property
    @override
    def _mongodb(self) -> ImplementsMongoDB:
        return self.request.app.state.mongodb

    @property
    @override
    def _redis(self) -> RedisClient:
        return self.request.app.state.redis

    @property
    @override
    def _aws(self) -> AWSSessionAdapter:
        return self.request.app.state.aws

    @property
    @override
    def _openai(self) -> OpenAIClientAdapter:
        return self.request.app.state.openai

    @property
    @override
    def _storage(self) -> StorageAdapter:
        return self.request.app.state.storage


class HTTPAuthContext(HTTPContext, AbstractAuthContext):
    """Context for authenticated operations."""

    def __init__(self, request: Request, user: UserModel) -> None:
        super().__init__(request)
        self._user_model = user

    @property
    @override
    def user(self) -> UserModel:
        return self._user_model


_bearer_scheme = HTTPBearer(auto_error=False)


async def _get_authenticated_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> UserModel:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    user_id = tokens.decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    adapter: MongoDBClientAdapter = request.app.state.mongodb
    user_repo = UserRepository(adapter)
    user = await user_repo.find_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def _get_auth_context(
    request: Request,
    user: UserModel = Depends(_get_authenticated_user),
) -> HTTPAuthContext:
    return HTTPAuthContext(request, user)


def _require_user_type(
    *allowed: UserType,
) -> Callable[..., HTTPAuthContext]:
    def dependency(
        request: Request,
        user: UserModel = Depends(_get_authenticated_user),
    ) -> HTTPAuthContext:
        if user.type not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return HTTPAuthContext(request, user)

    return dependency


RequiresContext = Annotated[HTTPContext, Depends(HTTPContext)]
"""A type alias for read-only operations using the client."""

RequiresAuth = Annotated[HTTPAuthContext, Depends(_get_auth_context)]
"""A type alias for authenticated operations (any user type)."""

RequiresStudentAuth = Annotated[
    HTTPAuthContext,
    Depends(_require_user_type(UserType.STUDENT, UserType.SUPERVISED_STUDENT)),
]
"""A type alias for operations requiring a student or supervised student."""

RequiresParentAuth = Annotated[
    HTTPAuthContext,
    Depends(_require_user_type(UserType.PARENT)),
]
"""A type alias for operations requiring a parent account."""

RequiresAdminAuth = Annotated[
    HTTPAuthContext,
    Depends(_require_user_type(UserType.ADMIN)),
]
"""A type alias for operations requiring an admin account."""
