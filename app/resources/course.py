from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel


class CourseType(StrEnum):
    ACADEMIC = "academic"
    HOBBY = "hobby"
    JOB = "job"


# Actual course data itself.
class CourseModel(BaseModel):
    id: str
    name: str
    type: CourseType
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
