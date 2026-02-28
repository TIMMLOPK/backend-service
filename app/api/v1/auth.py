from __future__ import annotations

from fastapi import APIRouter
from fastapi import Response
from pydantic import BaseModel

from app.api.v1 import response
from app.api.v1.context import RequiresAuth
from app.api.v1.context import RequiresContext
from app.api.v1.context import RequiresParentAuth
from app.resources.user import UserType
from app.services import auth

router = APIRouter(
    prefix="/auth",
)


class RegisterRequest(BaseModel):
    username: str
    full_name: str
    email: str
    password: str
    user_type: UserType = UserType.STUDENT


class CreateSupervisedStudentRequest(BaseModel):
    username: str
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    user_type: UserType


class SupervisorResponse(BaseModel):
    id: str
    username: str
    full_name: str


class DependantResponse(BaseModel):
    id: str
    username: str
    full_name: str


class MeResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    user_type: UserType
    supervisor: SupervisorResponse | None
    dependants: list[DependantResponse]


class TokenResponse(BaseModel):
    access_token: str


type MeWrapped = response.BaseResponse[MeResponse]
type RegisterResponse = response.BaseResponse[UserResponse]
type LoginResponse = response.BaseResponse[TokenResponse]


def _user_response(user: auth.UserModel) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        user_type=user.type,
    )


@router.get("/@me", response_model=MeWrapped)
async def me(
    ctx: RequiresAuth,
) -> Response:
    supervisor = None
    if ctx.user.supervision_details is not None:
        parent = await ctx.users.find_by_id(ctx.user.supervision_details.parent_id)
        if parent is not None:
            supervisor = SupervisorResponse(
                id=parent.id,
                username=parent.username,
                full_name=parent.full_name,
            )

    dependants_list: list[DependantResponse] = []
    if ctx.user.type == UserType.PARENT:
        dependants = await ctx.users.find_dependants(ctx.user.id)
        dependants_list = [
            DependantResponse(
                id=d.id,
                username=d.username,
                full_name=d.full_name,
            )
            for d in dependants
        ]

    return response.create(
        MeResponse(
            id=ctx.user.id,
            username=ctx.user.username,
            full_name=ctx.user.full_name,
            email=ctx.user.email,
            user_type=ctx.user.type,
            supervisor=supervisor,
            dependants=dependants_list,
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
        user_type=body.user_type,
    )
    user = response.unwrap(result)
    return response.create(_user_response(user), status=201)


@router.put("/@me/dependants", response_model=RegisterResponse)
async def create_supervised_student(
    ctx: RequiresParentAuth,
    body: CreateSupervisedStudentRequest,
) -> Response:
    result = await auth.create_supervised_student(
        ctx,
        username=body.username,
        full_name=body.full_name,
        email=body.email,
        password=body.password,
    )
    user = response.unwrap(result)
    return response.create(_user_response(user), status=201)


@router.post("/login", response_model=LoginResponse)
async def login(
    ctx: RequiresContext,
    body: LoginRequest,
) -> Response:
    result = await auth.login(
        ctx,
        email=body.email,
        password=body.password,
    )
    token = response.unwrap(result)
    return response.create(TokenResponse(access_token=token))
