from __future__ import annotations

from app.services._common import AbstractContext
from app.services._common import ServiceError
from app.services._common import is_error
from app.services._common import is_success
from app.resources.user import UserModel
from app.resources.user import UserRepository

from fastapi import status

from typing import override


class UsersServiceError(ServiceError):
    USER_INVALID_PASSWORD = "user_invalid_password"

    @override
    def service(self) -> str:
        return "users"

    @override
    def status_code(self) -> int:
        match self:
            case UsersServiceError.USER_INVALID_PASSWORD:
                return status.HTTP_401_UNAUTHORIZED
            case _:
                return status.HTTP_500_INTERNAL_SERVER_ERROR
