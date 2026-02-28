from __future__ import annotations

from openai import AsyncOpenAI

from app.utilities import logging

logger = logging.get_logger(__name__)


class OpenAIClientAdapter:
    """An adapter wrapping the OpenAI async client with configurable base URL."""

    def __init__(self, api_key: str, base_url: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    @property
    def client(self) -> AsyncOpenAI:
        return self._client


def default() -> OpenAIClientAdapter:
    """Creates a default OpenAI client adapter from settings."""

    from app import settings

    return OpenAIClientAdapter(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
    )
