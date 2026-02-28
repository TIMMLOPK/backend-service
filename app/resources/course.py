from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel


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
type CourseMaterialType = Literal["flashcards", "quiz", "fill_in_the_blank"]
type CourseMaterialData = FlashcardSetModel | QuizModel | FillInTheBlankModel


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


# Activity organisation
class MaterialSectionModel(BaseModel):
    index: int
    material: CourseMaterialData


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
