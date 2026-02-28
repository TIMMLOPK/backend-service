from __future__ import annotations

from fastapi import APIRouter

from . import auth
from . import health


def create_router() -> APIRouter:
    router = APIRouter(
        prefix="/v1",
    )

    router.include_router(auth.router)
    router.include_router(health.router)

    return router
