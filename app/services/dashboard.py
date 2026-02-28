from __future__ import annotations

from typing import override

from fastapi import status

from app.services._common import AbstractAuthContext
from app.services._common import ServiceError
from app.utilities import logging

logger = logging.get_logger(__name__)


class DashboardError(ServiceError):
    FETCH_FAILED = "fetch_failed"

    @override
    def service(self) -> str:
        return "dashboard"

    @override
    def status_code(self) -> int:
        match self:
            case DashboardError.FETCH_FAILED:
                return status.HTTP_500_INTERNAL_SERVER_ERROR
            case _:
                return status.HTTP_500_INTERNAL_SERVER_ERROR


async def get_dashboard_summary(
    ctx: AbstractAuthContext,
) -> DashboardError.OnSuccess[dict]:
    """Aggregate section completion and quiz score data across all user courses."""

    assigns = await ctx.course_assigns.find_by_user_id(ctx.user.id)

    total_sections = 0
    completed_sections = 0
    best_quiz_percentage: int | None = None
    courses_with_progress: list[dict] = []

    for assign in assigns:
        materials = await ctx.course_materials.find_by_course_and_user(
            assign.course_id, ctx.user.id
        )

        material_progress: list[dict] = []
        recent_scores: list[dict] = []

        for mat in materials:
            mat_total = len(mat.data)
            mat_completed = sum(1 for s in mat.data if s.is_completed)
            total_sections += mat_total
            completed_sections += mat_completed

            section_titles = [
                {
                    "index": s.index,
                    "title": s.title,
                    "is_completed": s.is_completed,
                }
                for s in mat.data
            ]

            material_progress.append(
                {
                    "material_id": mat.id,
                    "type": mat.type,
                    "title": mat.title,
                    "total_sections": mat_total,
                    "completed_sections": mat_completed,
                    "section_titles": section_titles,
                }
            )

            # Fetch quiz scores for this material
            scores = await ctx.quiz_scores.find_by_material_and_user(
                mat.id, ctx.user.id
            )
            for score in scores:
                pct = round((score.score / score.total) * 100) if score.total > 0 else 0
                if best_quiz_percentage is None or pct > best_quiz_percentage:
                    best_quiz_percentage = pct

                recent_scores.append(
                    {
                        "material_id": score.material_id,
                        "section_index": score.section_index,
                        "score": score.score,
                        "total": score.total,
                        "created_at": score.created_at.isoformat(),
                    }
                )

        courses_with_progress.append(
            {
                "course_id": assign.course_id,
                "materials": material_progress,
                "recent_scores": recent_scores,
            }
        )

    return {
        "total_sections": total_sections,
        "completed_sections": completed_sections,
        "courses_with_progress": courses_with_progress,
        "best_quiz_percentage": best_quiz_percentage,
    }
