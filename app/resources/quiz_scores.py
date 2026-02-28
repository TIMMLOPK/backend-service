from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId
from pydantic import BaseModel

from app.adapters.mongodb import ImplementsMongoDB


class QuizAnswerRecordModel(BaseModel):
    question_index: int
    selected_answer_indices: list[int]
    is_correct: bool


class QuizScoreModel(BaseModel):
    id: str
    material_id: str
    user_id: str
    section_index: int
    score: int
    total: int
    answers: list[QuizAnswerRecordModel]
    created_at: datetime


def _to_score_model(document: dict[str, Any]) -> QuizScoreModel:
    return QuizScoreModel(
        id=str(document["_id"]),
        material_id=document["material_id"],
        user_id=document["user_id"],
        section_index=document["section_index"],
        score=document["score"],
        total=document["total"],
        answers=[QuizAnswerRecordModel(**a) for a in document.get("answers", [])],
        created_at=document["created_at"],
    )


class QuizScoreRepository:
    __slots__ = ("_mongodb",)

    def __init__(self, mongodb: ImplementsMongoDB) -> None:
        self._mongodb = mongodb

    async def create(
        self,
        material_id: str,
        user_id: str,
        section_index: int,
        score: int,
        total: int,
        answers: list[QuizAnswerRecordModel],
    ) -> QuizScoreModel:
        now = datetime.now()
        document: dict[str, Any] = {
            "material_id": material_id,
            "user_id": user_id,
            "section_index": section_index,
            "score": score,
            "total": total,
            "answers": [a.model_dump() for a in answers],
            "created_at": now,
        }
        result = await self._mongodb.collection("quiz_scores").insert_one(document)
        return QuizScoreModel(
            id=str(result.inserted_id),
            material_id=material_id,
            user_id=user_id,
            section_index=section_index,
            score=score,
            total=total,
            answers=answers,
            created_at=now,
        )

    async def find_by_material_and_user(
        self,
        material_id: str,
        user_id: str,
    ) -> list[QuizScoreModel]:
        cursor = (
            self._mongodb.collection("quiz_scores")
            .find({"material_id": material_id, "user_id": user_id})
            .sort("created_at", -1)
        )
        return [_to_score_model(doc) async for doc in cursor]
