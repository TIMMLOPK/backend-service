from __future__ import annotations

from fastapi import APIRouter
from fastapi import Response

from app.api.v1 import response
from app.api.v1.context import RequiresAuth
from app.services import dashboard

router = APIRouter(
    prefix="/dashboard",
)


type SummaryWrapped = response.BaseResponse[dict]


@router.get("/summary", response_model=SummaryWrapped)
async def get_summary(
    ctx: RequiresAuth,
) -> Response:
    result = await dashboard.get_dashboard_summary(ctx)
    data = response.unwrap(result)
    return response.create(data)
