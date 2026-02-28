from __future__ import annotations

from minimax import AsyncMinimax

from app.utilities import logging

logger = logging.get_logger(__name__)


class MiniMaxAdapter:
    """Wraps an async MiniMax client for video generation and other MiniMax API calls."""

    __slots__ = ("_client",)

    def __init__(self, api_key: str, group_id: str) -> None:
        self._client = AsyncMinimax(api_key=api_key, group_id=group_id)

    @property
    def client(self) -> AsyncMinimax:
        return self._client


def default() -> MiniMaxAdapter:
    """Creates a default configuration for the MiniMax adapter using the ``settings`` module."""

    from app import settings

    return MiniMaxAdapter(
        api_key=settings.MINIMAX_API_KEY,
        group_id=settings.MINIMAX_GROUP_ID,
    )
