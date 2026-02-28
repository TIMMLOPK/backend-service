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

from collections.abc import AsyncGenerator
from typing import Annotated
from typing import override

from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from fastapi import status

from app.adapters.aws import AWSSessionAdapter
from app.adapters.minimax import MiniMaxAdapter
from app.adapters.mysql import ImplementsMySQL
from app.adapters.mysql import MySQLPoolAdapter
from app.adapters.redis import RedisClient
from app.resources import UserModel
from app.resources import UserRepository
from app.services import AbstractContext
from app.utilities import tokens


class HTTPContext(AbstractContext):
    """Context for read-only operations using the connection pool directly."""

    def __init__(self, request: Request) -> None:
        self.request = request

    @property
    @override
    def _mysql(self) -> ImplementsMySQL:
        return self.request.app.state.mysql

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
    def _minimax(self) -> MiniMaxAdapter:
        return self.request.app.state.minimax


class HTTPTransactionContext(AbstractContext):
    """Context for write operations using an explicit transaction."""

    def __init__(
        self,
        mysql: ImplementsMySQL,
        redis: RedisClient,
        aws: AWSSessionAdapter,
        minimax: MiniMaxAdapter,
    ) -> None:
        self._mysql_conn = mysql
        self._redis_conn = redis
        self._aws_session = aws
        self._minimax_client = minimax

    @property
    @override
    def _mysql(self) -> ImplementsMySQL:
        return self._mysql_conn

    @property
    @override
    def _redis(self) -> RedisClient:
        return self._redis_conn

    @property
    @override
    def _aws(self) -> AWSSessionAdapter:
        return self._aws_session

    @property
    @override
    def _minimax(self) -> MiniMaxAdapter:
        return self._minimax_client


async def _get_transaction_context(
    request: Request,
) -> AsyncGenerator[HTTPTransactionContext, None]:
    """Dependency that provides a context with an active database transaction."""
    pool: MySQLPoolAdapter = request.app.state.mysql
    redis_client: RedisClient = request.app.state.redis
    aws_session: AWSSessionAdapter = request.app.state.aws
    minimax_client: MiniMaxAdapter = request.app.state.minimax

    async with pool.transaction() as transaction:
        yield HTTPTransactionContext(
            transaction,
            redis_client,
            aws_session,
            minimax_client,
        )


class HTTPAuthContext(HTTPContext):
    """Context for authenticated read-only operations."""

    def __init__(self, request: Request, user: UserModel) -> None:
        super().__init__(request)
        self._user = user


class HTTPAuthTransactionContext(HTTPTransactionContext):
    """Context for authenticated write operations with a transaction."""

    def __init__(
        self,
        mysql: ImplementsMySQL,
        redis: RedisClient,
        aws: AWSSessionAdapter,
        minimax: MiniMaxAdapter,
        user: UserModel,
    ) -> None:
        super().__init__(mysql, redis, aws, minimax)
        self._user = user


async def _get_authenticated_user(request: Request) -> UserModel:
    auth_header: str | None = request.headers.get("Authorization")
    if auth_header is None or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = auth_header[7:]
    user_id = tokens.decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    pool: MySQLPoolAdapter = request.app.state.mysql
    user_repo = UserRepository(pool)
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


async def _get_auth_transaction_context(
    request: Request,
    user: UserModel = Depends(_get_authenticated_user),
) -> AsyncGenerator[HTTPAuthTransactionContext, None]:
    pool: MySQLPoolAdapter = request.app.state.mysql
    redis_client: RedisClient = request.app.state.redis
    aws_session: AWSSessionAdapter = request.app.state.aws
    minimax_client: MiniMaxAdapter = request.app.state.minimax

    async with pool.transaction() as transaction:
        yield HTTPAuthTransactionContext(
            transaction,
            redis_client,
            aws_session,
            minimax_client,
            user,
        )


RequiresContext = Annotated[HTTPContext, Depends(HTTPContext)]
"""A type alias for read-only operations using the connection pool."""

RequiresTransaction = Annotated[
    HTTPTransactionContext,
    Depends(_get_transaction_context),
]
"""A type alias for write operations that require an explicit database transaction."""

RequiresAuth = Annotated[HTTPAuthContext, Depends(_get_auth_context)]
"""A type alias for authenticated read-only operations."""

RequiresAuthTransaction = Annotated[
    HTTPAuthTransactionContext,
    Depends(_get_auth_transaction_context),
]
"""A type alias for authenticated write operations that require a transaction."""
