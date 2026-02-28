from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel


# Actual course data itself.
class CourseModel(BaseModel):
    id: str
    name: str
    preview_url: str | None
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


class BasisMaterialType(StrEnum):
    SLIDES = "slides"
    NOTES = "notes"


class CourseBasisMaterialModel(BaseModel):
    id: str
    course_id: str
    title: str
    summary: str
    description: str
    is_ai_generated: bool
    type: BasisMaterialType
    url: str
    created_at: datetime


type ResourceCreatedBy = Literal["user", "ai"]


class CourseResourceModel(BaseModel):
    id: str
    course_id: str
