from __future__ import annotations

from pydantic import BaseModel

from datetime import datetime


class TrackingMaterialCompletionModel(BaseModel):
    material_id: str
    user_id: str
    completed_at: datetime
