from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class TrackingMaterialCompletionModel(BaseModel):
    material_id: str
    user_id: str
    completed_at: datetime
