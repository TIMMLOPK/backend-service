from __future__ import annotations

from fastapi import APIRouter

from . import auth
from . import courses
from . import dashboard
from . import health
from . import parent


def create_router() -> APIRouter:
    router = APIRouter(
        prefix="/v1",
    )

    router.include_router(auth.router)
    router.include_router(courses.router)
    router.include_router(dashboard.router)
    router.include_router(health.router)
    router.include_router(parent.router)

    return router
