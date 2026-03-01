from __future__ import annotations

from typing import override

from fastapi import status

from app.resources.user import UserType
from app.services._common import AbstractAuthContext
from app.services._common import ServiceError
from app.utilities import logging

logger = logging.get_logger(__name__)


class ParentError(ServiceError):
    NOT_FOUND = "not_found"
    NOT_PARENT = "not_parent"
    NOT_OWNER = "not_owner"

    @override
    def service(self) -> str:
        return "parent"

    @override
    def status_code(self) -> int:
        match self:
            case ParentError.NOT_FOUND:
                return status.HTTP_404_NOT_FOUND
            case ParentError.NOT_PARENT | ParentError.NOT_OWNER:
                return status.HTTP_403_FORBIDDEN
            case _:
                return status.HTTP_500_INTERNAL_SERVER_ERROR


async def get_children_overview(
    ctx: AbstractAuthContext,
) -> ParentError.OnSuccess[list[dict]]:
    """Return a summary of all children belonging to the authenticated parent."""

    if ctx.user.type != UserType.PARENT:
        return ParentError.NOT_PARENT

    children = await ctx.users.find_dependants(ctx.user.id)
    overview: list[dict] = []

    for child in children:
        assigns = await ctx.course_assigns.find_by_user_id(child.id)
        total_sections = 0
        completed_sections = 0
        course_count = len(assigns)

        for assign in assigns:
            materials = await ctx.course_materials.find_by_course_and_user(
                assign.course_id, child.id
            )
            for mat in materials:
                total_sections += len(mat.data)
                completed_sections += sum(1 for s in mat.data if s.is_completed)

        completion_pct = (
            round((completed_sections / total_sections) * 100)
            if total_sections > 0
            else 0
        )

        overview.append(
            {
                "id": child.id,
                "username": child.username,
                "full_name": child.full_name,
                "email": child.email,
                "course_count": course_count,
                "total_sections": total_sections,
                "completed_sections": completed_sections,
                "completion_pct": completion_pct,
            }
        )

    return overview


async def get_child_summary(
    ctx: AbstractAuthContext,
    *,
    child_id: str,
) -> ParentError.OnSuccess[dict]:
    """Return a full dashboard summary for a specific child, validated by parent ownership."""

    if ctx.user.type != UserType.PARENT:
        return ParentError.NOT_PARENT

    child = await ctx.users.find_by_id(child_id)
    if child is None:
        return ParentError.NOT_FOUND

    if (
        child.supervision_details is None
        or child.supervision_details.parent_id != ctx.user.id
    ):
        return ParentError.NOT_OWNER

    assigns = await ctx.course_assigns.find_by_user_id(child.id)

    total_sections = 0
    completed_sections = 0
    best_quiz_percentage: int | None = None
    courses_with_progress: list[dict] = []

    for assign in assigns:
        materials = await ctx.course_materials.find_by_course_and_user(
            assign.course_id, child.id
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

            scores = await ctx.quiz_scores.find_by_material_and_user(
                mat.id, child.id
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
        "child": {
            "id": child.id,
            "username": child.username,
            "full_name": child.full_name,
            "email": child.email,
        },
        "total_sections": total_sections,
        "completed_sections": completed_sections,
        "courses_with_progress": courses_with_progress,
        "best_quiz_percentage": best_quiz_percentage,
    }


async def get_child_courses(
    ctx: AbstractAuthContext,
    *,
    child_id: str,
) -> ParentError.OnSuccess[list[dict]]:
    """Return the list of courses for a specific child, validated by parent ownership."""

    if ctx.user.type != UserType.PARENT:
        return ParentError.NOT_PARENT

    child = await ctx.users.find_by_id(child_id)
    if child is None:
        return ParentError.NOT_FOUND

    if (
        child.supervision_details is None
        or child.supervision_details.parent_id != ctx.user.id
    ):
        return ParentError.NOT_OWNER

    assigns = await ctx.course_assigns.find_by_user_id(child.id)
    course_list: list[dict] = []

    for assign in assigns:
        course = await ctx.courses.find_by_id(assign.course_id)
        if course is None:
            continue

        materials = await ctx.course_materials.find_by_course_and_user(
            assign.course_id, child.id
        )
        total_sections = sum(len(m.data) for m in materials)
        completed_sections = sum(
            sum(1 for s in m.data if s.is_completed) for m in materials
        )

        course_list.append(
            {
                "id": course.id,
                "name": course.name,
                "description": course.description,
                "type": course.type,
                "difficulty": course.difficulty,
                "topic": course.topic,
                "colour": course.colour,
                "estimated_hours": course.estimated_hours,
                "tags": course.tags,
                "publicity": course.publicity,
                "status": course.status,
                "created_at": course.created_at.isoformat(),
                "total_sections": total_sections,
                "completed_sections": completed_sections,
                "completion_pct": (
                    round((completed_sections / total_sections) * 100)
                    if total_sections > 0
                    else 0
                ),
            }
        )

    return course_list
