from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any
from typing import Literal

from bson import ObjectId
from pydantic import BaseModel

from app.adapters.mongodb import ImplementsMongoDB


class CourseType(StrEnum):
    ACADEMIC = "academic"
    HOBBY = "hobby"
    JOB = "job"


class CourseDifficulty(StrEnum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CourseTopic(StrEnum):
    MATH = "math"
    SCIENCE = "science"
    HISTORY = "history"
    ART = "art"
    MUSIC = "music"
    OTHER = "other"


class BasisMaterialType(StrEnum):
    SLIDES = "slides"
    NOTES = "notes"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    OTHER = "other"


class BasisMaterialModel(BaseModel):
    type: BasisMaterialType
    url: str
    description: str
    is_generated: bool


class CoursePublicity(StrEnum):
    PUBLIC = "public"
    PRIVATE = "private"


# Actual course data itself.
class CourseModel(BaseModel):
    id: str
    name: str
    description: str
    type: CourseType
    difficulty: CourseDifficulty
    topic: CourseTopic
    colour: str

    estimated_hours: int
    tags: list[str]
    preview_url: str | None
    basis_materials: list[BasisMaterialModel]
    publicity: CoursePublicity
    created_at: datetime


class CourseAssignRelationship(StrEnum):
    OWNER = "owner"  # Main manager, not necessarily has to take it.
    PERSONAL = "personal"  # Creator of their own course for just themselves.
    ASSIGNEE = "assignee"  # Assigned by the owner to take it.


class CourseAssignModel(BaseModel):
    id: str
    course_id: str
    user_id: str
    relationship: CourseAssignRelationship
    created_at: datetime


# Activities we have
type CourseMaterialType = Literal[
    "lecture", "flashcards", "quiz", "fill_in_the_blank", "multiple_choice",
    "matching", "ordering", "true_false", "case_study", "sorting", "spotlight",
]
type CourseMaterialData = (
    LectureModel | FlashcardSetModel | QuizModel | FillInTheBlankModel | MultipleChoiceModel
    | MatchingModel | OrderingModel | TrueFalseModel | CaseStudyModel | SortingModel | SpotlightModel
)

JOURNEY_STEP_ORDER: list[str] = [
    "lecture", "spotlight", "flashcards", "matching",
    "true_false", "case_study", "ordering", "sorting",
    "quiz", "fill_in_the_blank", "multiple_choice",
]


class LectureModel(BaseModel):
    content: str  # Markdown text


class FlashcardModel(BaseModel):
    question: str
    answer: str


class FlashcardSetModel(BaseModel):
    flashcards: list[FlashcardModel]


class QuizModel(BaseModel):
    questions: list[QuizQuestionModel]


class QuizAnswerModel(BaseModel):
    answer: str
    is_correct: bool


class QuizQuestionModel(BaseModel):
    question: str
    answers: list[QuizAnswerModel]


class MaterialVideoModel(BaseModel):
    url: str


class FillInTheBlankModel(BaseModel):
    question: str
    answers: list[str]


class MultipleChoiceAnswerModel(BaseModel):
    answer: str
    is_correct: bool


class MultipleChoiceQuestionModel(BaseModel):
    question: str
    answers: list[MultipleChoiceAnswerModel]


class MultipleChoiceModel(BaseModel):
    questions: list[MultipleChoiceQuestionModel]


class MatchingPairModel(BaseModel):
    left: str
    right: str


class MatchingModel(BaseModel):
    pairs: list[MatchingPairModel]
    instruction: str


class OrderingModel(BaseModel):
    items: list[str]  # Stored in correct order; frontend shuffles
    instruction: str


class TrueFalseStatementModel(BaseModel):
    statement: str
    is_true: bool
    explanation: str


class TrueFalseModel(BaseModel):
    statements: list[TrueFalseStatementModel]


class CaseStudyQuestionModel(BaseModel):
    question: str
    sample_answer: str


class CaseStudyModel(BaseModel):
    scenario: str  # Markdown
    questions: list[CaseStudyQuestionModel]


class SortingCategoryModel(BaseModel):
    name: str
    items: list[str]


class SortingModel(BaseModel):
    instruction: str
    categories: list[SortingCategoryModel]


class SpotlightItemModel(BaseModel):
    type: str  # "fact", "tip", "mnemonic", "analogy"
    content: str


class SpotlightModel(BaseModel):
    highlights: list[SpotlightItemModel]


# Activity organisation
class MaterialSectionModel(BaseModel):
    index: int
    title: str
    material: CourseMaterialData
    is_completed: bool


class CourseMaterialModel(BaseModel):
    id: str
    course_id: str
    user_id: str

    type: CourseMaterialType
    data: list[MaterialSectionModel]  # Each material can have multiple sections.
    title: str
    description: str
    is_visible: bool
    is_completed: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Document → Model helpers
# ---------------------------------------------------------------------------


def _to_course_model(document: dict[str, Any]) -> CourseModel:
    return CourseModel(
        id=str(document["_id"]),
        name=document["name"],
        description=document["description"],
        type=document["type"],
        difficulty=document["difficulty"],
        topic=document["topic"],
        colour=document.get("colour", "#6366f1"),
        estimated_hours=document["estimated_hours"],
        tags=document["tags"],
        preview_url=document.get("preview_url"),
        basis_materials=[
            BasisMaterialModel(**m) for m in document.get("basis_materials", [])
        ],
        publicity=document["publicity"],
        created_at=document["created_at"],
    )


def _to_assign_model(document: dict[str, Any]) -> CourseAssignModel:
    return CourseAssignModel(
        id=str(document["_id"]),
        course_id=document["course_id"],
        user_id=document["user_id"],
        relationship=document["relationship"],
        created_at=document["created_at"],
    )


def _to_material_data(material_type: str, raw: dict[str, Any]) -> CourseMaterialData:
    match material_type:
        case "lecture":
            return LectureModel(**raw)
        case "flashcards":
            return FlashcardSetModel(**raw)
        case "quiz":
            return QuizModel(**raw)
        case "fill_in_the_blank":
            return FillInTheBlankModel(**raw)
        case "multiple_choice":
            return MultipleChoiceModel(**raw)
        case "matching":
            return MatchingModel(**raw)
        case "ordering":
            return OrderingModel(**raw)
        case "true_false":
            return TrueFalseModel(**raw)
        case "case_study":
            return CaseStudyModel(**raw)
        case "sorting":
            return SortingModel(**raw)
        case "spotlight":
            return SpotlightModel(**raw)
        case _:
            raise ValueError(f"Unknown material type: {material_type}")


def _to_material_model(document: dict[str, Any]) -> CourseMaterialModel:
    material_type = document["type"]
    sections = [
        MaterialSectionModel(
            index=s["index"],
            title=s.get("title", f"Section {s['index'] + 1}"),
            material=_to_material_data(material_type, s["material"]),
            is_completed=s["is_completed"],
        )
        for s in document.get("data", [])
    ]

    return CourseMaterialModel(
        id=str(document["_id"]),
        course_id=document["course_id"],
        user_id=document["user_id"],
        type=material_type,
        data=sections,
        title=document["title"],
        description=document["description"],
        is_visible=document["is_visible"],
        is_completed=document["is_completed"],
        created_at=document["created_at"],
    )


# ---------------------------------------------------------------------------
# Repositories
# ---------------------------------------------------------------------------


class CourseRepository:
    __slots__ = ("_mongodb",)

    def __init__(self, mongodb: ImplementsMongoDB) -> None:
        self._mongodb = mongodb

    async def create(
        self,
        name: str,
        description: str,
        course_type: CourseType,
        difficulty: CourseDifficulty,
        topic: CourseTopic,
        estimated_hours: int,
        tags: list[str],
        preview_url: str | None,
        basis_materials: list[BasisMaterialModel],
        publicity: CoursePublicity,
        colour: str = "#6366f1",
    ) -> CourseModel:
        now = datetime.now()
        document: dict[str, Any] = {
            "name": name,
            "description": description,
            "type": course_type.value,
            "difficulty": difficulty.value,
            "topic": topic.value,
            "colour": colour,
            "estimated_hours": estimated_hours,
            "tags": tags,
            "preview_url": preview_url,
            "basis_materials": [m.model_dump() for m in basis_materials],
            "publicity": publicity.value,
            "created_at": now,
        }
        result = await self._mongodb.collection("courses").insert_one(document)
        return CourseModel(
            id=str(result.inserted_id),
            name=name,
            description=description,
            type=course_type,
            difficulty=difficulty,
            topic=topic,
            colour=colour,
            estimated_hours=estimated_hours,
            tags=tags,
            preview_url=preview_url,
            basis_materials=basis_materials,
            publicity=publicity,
            created_at=now,
        )

    async def find_by_id(self, id: str) -> CourseModel | None:
        document = await self._mongodb.collection("courses").find_one(
            {"_id": ObjectId(id)},
        )
        return _to_course_model(document) if document else None

    async def find_public(self, limit: int = 20, offset: int = 0) -> list[CourseModel]:
        cursor = (
            self._mongodb.collection("courses")
            .find({"publicity": CoursePublicity.PUBLIC.value})
            .sort("created_at", -1)
            .skip(offset)
            .limit(limit)
        )
        return [_to_course_model(doc) async for doc in cursor]

    async def find_by_topic(
        self,
        topic: CourseTopic,
        limit: int = 20,
        offset: int = 0,
    ) -> list[CourseModel]:
        cursor = (
            self._mongodb.collection("courses")
            .find({"topic": topic.value})
            .sort("created_at", -1)
            .skip(offset)
            .limit(limit)
        )
        return [_to_course_model(doc) async for doc in cursor]

    async def update_preview_url(self, id: str, preview_url: str) -> bool:
        result = await self._mongodb.collection("courses").update_one(
            {"_id": ObjectId(id)},
            {"$set": {"preview_url": preview_url}},
        )
        return result.modified_count > 0

    async def add_basis_material(self, id: str, material: BasisMaterialModel) -> bool:
        result = await self._mongodb.collection("courses").update_one(
            {"_id": ObjectId(id)},
            {"$push": {"basis_materials": material.model_dump()}},
        )
        return result.modified_count > 0

    async def delete(self, id: str) -> bool:
        result = await self._mongodb.collection("courses").delete_one(
            {"_id": ObjectId(id)},
        )
        return result.deleted_count > 0


class CourseAssignRepository:
    __slots__ = ("_mongodb",)

    def __init__(self, mongodb: ImplementsMongoDB) -> None:
        self._mongodb = mongodb

    async def create(
        self,
        course_id: str,
        user_id: str,
        relationship: CourseAssignRelationship,
    ) -> CourseAssignModel:
        now = datetime.now()
        document: dict[str, Any] = {
            "course_id": course_id,
            "user_id": user_id,
            "relationship": relationship.value,
            "created_at": now,
        }
        result = await self._mongodb.collection("course_assigns").insert_one(document)
        return CourseAssignModel(
            id=str(result.inserted_id),
            course_id=course_id,
            user_id=user_id,
            relationship=relationship,
            created_at=now,
        )

    async def find_by_id(self, id: str) -> CourseAssignModel | None:
        document = await self._mongodb.collection("course_assigns").find_one(
            {"_id": ObjectId(id)},
        )
        return _to_assign_model(document) if document else None

    async def find_by_course_id(self, course_id: str) -> list[CourseAssignModel]:
        cursor = self._mongodb.collection("course_assigns").find(
            {"course_id": course_id},
        )
        return [_to_assign_model(doc) async for doc in cursor]

    async def find_by_user_id(self, user_id: str) -> list[CourseAssignModel]:
        cursor = self._mongodb.collection("course_assigns").find(
            {"user_id": user_id},
        )
        return [_to_assign_model(doc) async for doc in cursor]

    async def find_by_course_and_user(
        self,
        course_id: str,
        user_id: str,
    ) -> CourseAssignModel | None:
        document = await self._mongodb.collection("course_assigns").find_one(
            {"course_id": course_id, "user_id": user_id},
        )
        return _to_assign_model(document) if document else None

    async def delete(self, id: str) -> bool:
        result = await self._mongodb.collection("course_assigns").delete_one(
            {"_id": ObjectId(id)},
        )
        return result.deleted_count > 0


class CourseMaterialRepository:
    __slots__ = ("_mongodb",)

    def __init__(self, mongodb: ImplementsMongoDB) -> None:
        self._mongodb = mongodb

    async def create(
        self,
        course_id: str,
        user_id: str,
        material_type: CourseMaterialType,
        data: list[MaterialSectionModel],
        title: str,
        description: str,
        is_visible: bool,
    ) -> CourseMaterialModel:
        now = datetime.now()
        document: dict[str, Any] = {
            "course_id": course_id,
            "user_id": user_id,
            "type": material_type,
            "data": [
                {
                    "index": s.index,
                    "title": s.title,
                    "material": s.material.model_dump(),
                    "is_completed": s.is_completed,
                }
                for s in data
            ],
            "title": title,
            "description": description,
            "is_visible": is_visible,
            "is_completed": False,
            "created_at": now,
        }
        result = await self._mongodb.collection("course_materials").insert_one(document)
        return CourseMaterialModel(
            id=str(result.inserted_id),
            course_id=course_id,
            user_id=user_id,
            type=material_type,
            data=data,
            title=title,
            description=description,
            is_visible=is_visible,
            is_completed=False,
            created_at=now,
        )

    async def find_by_id(self, id: str) -> CourseMaterialModel | None:
        document = await self._mongodb.collection("course_materials").find_one(
            {"_id": ObjectId(id)},
        )
        return _to_material_model(document) if document else None

    async def find_by_course_id(self, course_id: str) -> list[CourseMaterialModel]:
        cursor = self._mongodb.collection("course_materials").find(
            {"course_id": course_id},
        )
        return [_to_material_model(doc) async for doc in cursor]

    async def find_by_course_and_user(
        self,
        course_id: str,
        user_id: str,
    ) -> list[CourseMaterialModel]:
        cursor = self._mongodb.collection("course_materials").find(
            {"course_id": course_id, "user_id": user_id},
        )
        return [_to_material_model(doc) async for doc in cursor]

    async def mark_section_completed(self, id: str, section_index: int) -> bool:
        result = await self._mongodb.collection("course_materials").update_one(
            {"_id": ObjectId(id), "data.index": section_index},
            {"$set": {"data.$.is_completed": True}},
        )
        return result.modified_count > 0

    async def append_sections(
        self,
        id: str,
        new_sections: list[MaterialSectionModel],
    ) -> bool:
        raw_sections = [
            {
                "index": s.index,
                "title": s.title,
                "material": s.material.model_dump(),
                "is_completed": s.is_completed,
            }
            for s in new_sections
        ]
        result = await self._mongodb.collection("course_materials").update_one(
            {"_id": ObjectId(id)},
            {"$push": {"data": {"$each": raw_sections}}},
        )
        return result.modified_count > 0

    async def delete(self, id: str) -> bool:
        result = await self._mongodb.collection("course_materials").delete_one(
            {"_id": ObjectId(id)},
        )
        return result.deleted_count > 0
