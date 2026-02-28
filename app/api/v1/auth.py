from __future__ import annotations

from fastapi import APIRouter
from fastapi import Response
from pydantic import BaseModel

from app.api.v1 import response
from app.api.v1.context import RequiresAuth
from app.api.v1.context import RequiresContext
from app.services import auth

router = APIRouter(
    prefix="/auth",
)


class RegisterRequest(BaseModel):
    username: str
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str


type MeResponse = response.BaseResponse[UserResponse]
type RegisterResponse = response.BaseResponse[UserResponse]
type LoginResponse = response.BaseResponse[TokenResponse]


@router.get("/@me", response_model=MeResponse)
async def me(
    ctx: RequiresAuth,
) -> Response:
    return response.create(
        UserResponse(
            id=ctx.user.id,
            username=ctx.user.username,
            full_name=ctx.user.full_name,
            email=ctx.user.email,
        ),
    )


@router.post("/register", response_model=RegisterResponse)
async def register(
    ctx: RequiresContext,
    body: RegisterRequest,
) -> Response:
    result = await auth.register(
        ctx,
        username=body.username,
        full_name=body.full_name,
        email=body.email,
        password=body.password,
    )
    user = response.unwrap(result)

    return response.create(
        UserResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
        ),
        status=201,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    ctx: RequiresContext,
    body: LoginRequest,
) -> Response:
    result = await auth.login(
        ctx,
        username=body.username,
        password=body.password,
    )
    token = response.unwrap(result)

    return response.create(TokenResponse(access_token=token))
