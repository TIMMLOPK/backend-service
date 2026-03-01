from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter
from fastapi import Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.v1 import response
from app.api.v1.context import RequiresAuth
from app.api.v1.context import RequiresStudentAuth
from app.resources.course import CourseDifficulty
from app.resources.course import CourseGenerationStatus
from app.resources.course import CourseMaterialType
from app.resources.course import CoursePublicity
from app.resources.course import CourseTopic
from app.resources.course import CourseType
from app.resources.course import MaterialSectionModel
from app.resources.quiz_scores import QuizAnswerRecordModel
from app.services import courses
from app.services import is_error

router = APIRouter(
    prefix="/courses",
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class GenerateCourseRequest(BaseModel):
    topic: str
    difficulty: CourseDifficulty
    course_type: CourseType
    additional_details: str | None = None


class CourseResponse(BaseModel):
    id: str
    name: str
    description: str
    type: CourseType
    difficulty: CourseDifficulty
    topic: CourseTopic
    colour: str
    estimated_hours: int
    tags: list[str]
    publicity: CoursePublicity
    status: CourseGenerationStatus
    created_at: str


class MaterialSectionResponse(BaseModel):
    index: int
    title: str
    material: dict
    is_completed: bool


class CourseMaterialResponse(BaseModel):
    id: str
    course_id: str
    type: CourseMaterialType
    data: list[MaterialSectionResponse]
    title: str
    description: str
    is_completed: bool


class GenerateCourseResponseData(BaseModel):
    course: CourseResponse


class QuizAnswerRecord(BaseModel):
    question_index: int
    selected_answer_indices: list[int]
    is_correct: bool


class SubmitQuizRequest(BaseModel):
    section_index: int
    answers: list[QuizAnswerRecord]


class QuizScoreResponse(BaseModel):
    id: str
    score: int
    total: int


class ExplainRequest(BaseModel):
    question: str
    selected_answer: str
    correct_answer: str


class ExplainResponse(BaseModel):
    explanation: str


class ExtendCourseRequest(BaseModel):
    prompt: str


class JourneyStepResponse(BaseModel):
    step_index: int
    material_type: str
    material_id: str
    section_index: int
    subtopic_title: str
    is_completed: bool


class JourneyResponse(BaseModel):
    steps: list[JourneyStepResponse]
    total_steps: int
    completed_steps: int
    recommended_step_index: int | None


class CompleteSectionRequest(BaseModel):
    section_index: int


class TrackSuggestionResponse(BaseModel):
    title: str
    description: str
    subtopics: list[str]


class GenerateTrackRequest(BaseModel):
    title: str
    subtopics: list[str]


class WeakAreaResponse(BaseModel):
    subtopic_title: str
    average_score_pct: float


class GenerateWeakAreaRequest(BaseModel):
    subtopic_title: str


type GenerateWrapped = response.BaseResponse[GenerateCourseResponseData]
type GenerationStatusWrapped = response.BaseResponse[dict]
type CourseListWrapped = response.BaseResponse[list[CourseResponse]]
type CourseWrapped = response.BaseResponse[CourseResponse]
type MaterialListWrapped = response.BaseResponse[list[CourseMaterialResponse]]
type QuizScoreWrapped = response.BaseResponse[QuizScoreResponse]
type QuizScoreListWrapped = response.BaseResponse[list[dict]]
type ExplainWrapped = response.BaseResponse[ExplainResponse]
type ExtendWrapped = response.BaseResponse[list[CourseMaterialResponse]]
type JourneyWrapped = response.BaseResponse[JourneyResponse]
type CompleteSectionWrapped = response.BaseResponse[dict]
type TracksWrapped = response.BaseResponse[list[TrackSuggestionResponse]]
type WeakAreasWrapped = response.BaseResponse[list[WeakAreaResponse]]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _course_response(course: courses.CourseModel) -> CourseResponse:
    return CourseResponse(
        id=course.id,
        name=course.name,
        description=course.description,
        type=course.type,
        difficulty=course.difficulty,
        topic=course.topic,
        colour=course.colour,
        estimated_hours=course.estimated_hours,
        tags=course.tags,
        publicity=course.publicity,
        status=course.status,
        created_at=course.created_at.isoformat(),
    )


def _section_response(section: MaterialSectionModel) -> MaterialSectionResponse:
    return MaterialSectionResponse(
        index=section.index,
        title=section.title,
        material=section.material.model_dump(),
        is_completed=section.is_completed,
    )


def _material_response(mat: courses.CourseMaterialModel) -> CourseMaterialResponse:
    return CourseMaterialResponse(
        id=mat.id,
        course_id=mat.course_id,
        type=mat.type,
        data=[_section_response(s) for s in mat.data],
        title=mat.title,
        description=mat.description,
        is_completed=mat.is_completed,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/generate", response_model=GenerateWrapped)
async def generate_course(
    ctx: RequiresAuth,
    body: GenerateCourseRequest,
) -> Response:
    result = await courses.generate_course(
        ctx,
        topic=body.topic,
        difficulty=body.difficulty,
        course_type=body.course_type,
        additional_details=body.additional_details,
    )
    course = response.unwrap(result)
    return response.create(
        GenerateCourseResponseData(course=_course_response(course)),
        status=201,
    )


@router.get("/{course_id}/events")
async def course_generation_events(
    ctx: RequiresAuth,
    course_id: str,
) -> StreamingResponse:
    async def event_stream():
        while True:
            result = await courses.get_course(ctx, course_id)
            if is_error(result):
                data = json.dumps({"type": "error", "message": result.value})
                yield f"data: {data}\n\n"
                return

            data = json.dumps({"type": "status", "status": result.status.value})
            yield f"data: {data}\n\n"

            if result.status is not CourseGenerationStatus.GENERATING:
                return

            await asyncio.sleep(3)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/", response_model=CourseListWrapped)
async def list_courses(
    ctx: RequiresAuth,
) -> Response:
    result = await courses.get_user_courses(ctx)
    course_list = response.unwrap(result)
    return response.create([_course_response(c) for c in course_list])


@router.get("/explore", response_model=CourseListWrapped)
async def explore_courses(
    ctx: RequiresAuth,
    limit: int = 40,
    offset: int = 0,
) -> Response:
    result = await courses.get_public_courses(ctx, limit=limit, offset=offset)
    course_list = response.unwrap(result)
    return response.create([_course_response(c) for c in course_list])


@router.post("/{course_id}/enrol", response_model=CourseWrapped)
async def enrol_in_course(
    ctx: RequiresStudentAuth,
    course_id: str,
) -> Response:
    result = await courses.enrol_in_course(ctx, course_id)
    course = response.unwrap(result)
    return response.create(_course_response(course), status=201)


@router.get("/{course_id}", response_model=CourseWrapped)
async def get_course(
    ctx: RequiresAuth,
    course_id: str,
) -> Response:
    result = await courses.get_course(ctx, course_id)
    course = response.unwrap(result)
    return response.create(_course_response(course))


@router.get("/{course_id}/materials", response_model=MaterialListWrapped)
async def get_course_materials(
    ctx: RequiresAuth,
    course_id: str,
) -> Response:
    result = await courses.get_course_materials(ctx, course_id)
    materials = response.unwrap(result)
    return response.create([_material_response(m) for m in materials])


@router.post("/{course_id}/materials/{material_id}/submit", response_model=QuizScoreWrapped)
async def submit_quiz_score(
    ctx: RequiresAuth,
    course_id: str,
    material_id: str,
    body: SubmitQuizRequest,
) -> Response:
    answer_records = [
        QuizAnswerRecordModel(
            question_index=a.question_index,
            selected_answer_indices=a.selected_answer_indices,
            is_correct=a.is_correct,
        )
        for a in body.answers
    ]
    result = await courses.submit_quiz_score(
        ctx,
        course_id=course_id,
        material_id=material_id,
        section_index=body.section_index,
        answers=answer_records,
    )
    data = response.unwrap(result)
    return response.create(
        QuizScoreResponse(id=data["id"], score=data["score"], total=data["total"]),
        status=201,
    )


@router.get("/{course_id}/materials/{material_id}/scores", response_model=QuizScoreListWrapped)
async def get_quiz_scores(
    ctx: RequiresAuth,
    course_id: str,
    material_id: str,
) -> Response:
    result = await courses.get_quiz_scores(ctx, course_id, material_id)
    scores = response.unwrap(result)
    return response.create([
        {
            "id": s.id,
            "section_index": s.section_index,
            "score": s.score,
            "total": s.total,
            "created_at": s.created_at.isoformat(),
        }
        for s in scores
    ])


@router.post("/{course_id}/materials/{material_id}/explain", response_model=ExplainWrapped)
async def explain_wrong_answer(
    ctx: RequiresAuth,
    course_id: str,
    material_id: str,
    body: ExplainRequest,
) -> Response:
    result = await courses.explain_wrong_answer(
        ctx,
        material_id=material_id,
        question=body.question,
        selected_answer=body.selected_answer,
        correct_answer=body.correct_answer,
    )
    explanation = response.unwrap(result)
    return response.create(ExplainResponse(explanation=explanation))


@router.post("/{course_id}/extend", response_model=ExtendWrapped)
async def extend_course(
    ctx: RequiresAuth,
    course_id: str,
    body: ExtendCourseRequest,
) -> Response:
    result = await courses.extend_course(ctx, course_id, body.prompt)
    materials = response.unwrap(result)
    return response.create([_material_response(m) for m in materials])


@router.get("/{course_id}/journey", response_model=JourneyWrapped)
async def get_journey(
    ctx: RequiresAuth,
    course_id: str,
) -> Response:
    result = await courses.get_journey(ctx, course_id)
    data = response.unwrap(result)
    return response.create(
        JourneyResponse(
            steps=[JourneyStepResponse(**s) for s in data["steps"]],
            total_steps=data["total_steps"],
            completed_steps=data["completed_steps"],
            recommended_step_index=data["recommended_step_index"],
        ),
    )


@router.post("/{course_id}/materials/{material_id}/complete", response_model=CompleteSectionWrapped)
async def complete_section(
    ctx: RequiresAuth,
    course_id: str,
    material_id: str,
    body: CompleteSectionRequest,
) -> Response:
    result = await courses.complete_section(ctx, course_id, material_id, body.section_index)
    data = response.unwrap(result)
    return response.create(data)


@router.post("/{course_id}/suggest-tracks", response_model=TracksWrapped)
async def suggest_tracks(
    ctx: RequiresAuth,
    course_id: str,
) -> Response:
    result = await courses.suggest_tracks(ctx, course_id)
    tracks = response.unwrap(result)
    return response.create([
        TrackSuggestionResponse(
            title=t.get("title", ""),
            description=t.get("description", ""),
            subtopics=t.get("subtopics", []),
        )
        for t in tracks
    ])


@router.post("/{course_id}/generate-track", response_model=ExtendWrapped)
async def generate_track(
    ctx: RequiresAuth,
    course_id: str,
    body: GenerateTrackRequest,
) -> Response:
    result = await courses.generate_track_content(ctx, course_id, body.title, body.subtopics)
    materials = response.unwrap(result)
    return response.create([_material_response(m) for m in materials])


@router.get("/{course_id}/weak-areas", response_model=WeakAreasWrapped)
async def get_weak_areas(
    ctx: RequiresAuth,
    course_id: str,
) -> Response:
    result = await courses.get_weak_areas(ctx, course_id)
    areas = response.unwrap(result)
    return response.create([
        WeakAreaResponse(
            subtopic_title=a["subtopic_title"],
            average_score_pct=a["average_score_pct"],
        )
        for a in areas
    ])


@router.post("/{course_id}/generate-weak-practice", response_model=ExtendWrapped)
async def generate_weak_practice(
    ctx: RequiresAuth,
    course_id: str,
    body: GenerateWeakAreaRequest,
) -> Response:
    result = await courses.generate_weak_area_practice(ctx, course_id, body.subtopic_title)
    materials = response.unwrap(result)
    return response.create([_material_response(m) for m in materials])


class ImprovementStatusResponse(BaseModel):
    is_improving: bool


type ImprovementStatusWrapped = response.BaseResponse[ImprovementStatusResponse]


@router.get("/{course_id}/improvement-status", response_model=ImprovementStatusWrapped)
async def get_improvement_status(
    ctx: RequiresAuth,
    course_id: str,
) -> Response:
    status = await courses.get_improvement_status(ctx, course_id)
    return response.create(ImprovementStatusResponse(is_improving=status["is_improving"]))


class TrackActivityRequest(BaseModel):
    material_id: str
    section_index: int
    material_type: str
    time_spent_seconds: int
    was_completed: bool


@router.post("/{course_id}/activity")
async def track_activity(
    ctx: RequiresAuth,
    course_id: str,
    body: TrackActivityRequest,
) -> Response:
    result = await courses.track_activity(
        ctx,
        course_id,
        body.material_id,
        body.section_index,
        body.material_type,
        body.time_spent_seconds,
        was_completed=body.was_completed,
    )
    return response.create(result)
