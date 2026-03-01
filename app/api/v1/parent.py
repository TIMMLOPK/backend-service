from __future__ import annotations

from fastapi import APIRouter
from fastapi import Response

from app.api.v1 import response
from app.api.v1.context import RequiresParentAuth
from app.services import parent

router = APIRouter(
    prefix="/parent",
)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


type ChildrenOverviewWrapped = response.BaseResponse[list[dict]]
type ChildSummaryWrapped = response.BaseResponse[dict]
type ChildCoursesWrapped = response.BaseResponse[list[dict]]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/children", response_model=ChildrenOverviewWrapped)
async def list_children_overview(
    ctx: RequiresParentAuth,
) -> Response:
    result = await parent.get_children_overview(ctx)
    data = response.unwrap(result)
    return response.create(data)


@router.get("/children/{child_id}/summary", response_model=ChildSummaryWrapped)
async def get_child_summary(
    ctx: RequiresParentAuth,
    child_id: str,
) -> Response:
    result = await parent.get_child_summary(ctx, child_id=child_id)
    data = response.unwrap(result)
    return response.create(data)


@router.get("/children/{child_id}/courses", response_model=ChildCoursesWrapped)
async def get_child_courses(
    ctx: RequiresParentAuth,
    child_id: str,
) -> Response:
    result = await parent.get_child_courses(ctx, child_id=child_id)
    data = response.unwrap(result)
    return response.create(data)
