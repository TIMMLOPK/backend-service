from __future__ import annotations

from pydantic import BaseModel


class CourseModel(BaseModel):
    id: int
