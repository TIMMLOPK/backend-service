from __future__ import annotations

from fastapi import status

from app.resources import SupervisionDetailsModel
from app.resources import UserModel
from app.resources import UserType
from app.services._common import AbstractAuthContext
from app.services._common import AbstractContext
from app.services._common import ServiceError
from app.utilities import hashing
from app.utilities import tokens


class AuthError(ServiceError):
    INVALID_CREDENTIALS = "invalid_credentials"
    USERNAME_TAKEN = "username_taken"
    EMAIL_TAKEN = "email_taken"

    def service(self) -> str:
        return "auth"

    def status_code(self) -> int:
        match self:
            case AuthError.INVALID_CREDENTIALS:
                return status.HTTP_401_UNAUTHORIZED
            case AuthError.USERNAME_TAKEN | AuthError.EMAIL_TAKEN:
                return status.HTTP_409_CONFLICT
            case _:
                return status.HTTP_500_INTERNAL_SERVER_ERROR


async def register(
    ctx: AbstractContext,
    username: str,
    full_name: str,
    email: str,
    password: str,
    user_type: UserType = UserType.STUDENT,
) -> AuthError.OnSuccess[UserModel]:
    existing_user = await ctx.users.find_by_username(username)
    if existing_user is not None:
        return AuthError.USERNAME_TAKEN

    existing_email = await ctx.users.find_by_email(email)
    if existing_email is not None:
        return AuthError.EMAIL_TAKEN

    hashed_password = await hashing.hash_password(password)
    user = await ctx.users.create(
        username=username,
        full_name=full_name,
        email=email,
        password=hashed_password,
        user_type=user_type,
    )
    return user


async def create_supervised_student(
    ctx: AbstractAuthContext,
    username: str,
    full_name: str,
    email: str,
    password: str,
) -> AuthError.OnSuccess[UserModel]:
    existing_user = await ctx.users.find_by_username(username)
    if existing_user is not None:
        return AuthError.USERNAME_TAKEN

    existing_email = await ctx.users.find_by_email(email)
    if existing_email is not None:
        return AuthError.EMAIL_TAKEN

    hashed_password = await hashing.hash_password(password)
    user = await ctx.users.create(
        username=username,
        full_name=full_name,
        email=email,
        password=hashed_password,
        user_type=UserType.SUPERVISED_STUDENT,
        supervision_details=SupervisionDetailsModel(parent_id=ctx.user.id),
    )
    return user


async def login(
    ctx: AbstractContext,
    email: str,
    password: str,
) -> AuthError.OnSuccess[str]:
    user = await ctx.users.find_by_email(email)
    if user is None:
        return AuthError.INVALID_CREDENTIALS

    valid = await hashing.verify_password(password, user.password)
    if not valid:
        return AuthError.INVALID_CREDENTIALS

    return tokens.create_access_token(user.id)
