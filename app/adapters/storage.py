from __future__ import annotations

from pathlib import Path

import aiofiles

from app.utilities import logging

logger = logging.get_logger(__name__)


class StorageAdapter:
    """A local file storage adapter for async file I/O backed by a directory."""

    __slots__ = ("_base_path",)

    def __init__(self, base_path: str) -> None:
        self._base_path = Path(base_path).resolve()

    @property
    def base_path(self) -> Path:
        return self._base_path

    def resolve_path(self, relative_path: str) -> Path:
        """Resolve a relative path against the base path with traversal guard."""
        resolved = (self._base_path / relative_path).resolve()
        if not resolved.is_relative_to(self._base_path):
            raise ValueError("Path traversal detected.")
        return resolved

    async def save_file(self, relative_path: str, content: bytes) -> str:
        """Save content to a file at the given relative path. Returns the relative path."""
        target = self.resolve_path(relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)

        async with aiofiles.open(target, "wb") as f:
            await f.write(content)

        logger.info(
            "Saved file.",
            extra={"path": relative_path, "size": len(content)},
        )
        return relative_path

    async def delete_file(self, relative_path: str) -> bool:
        """Delete a file at the given relative path. Returns True if deleted."""
        target = self.resolve_path(relative_path)
        if target.is_file():
            target.unlink()
            logger.info("Deleted file.", extra={"path": relative_path})
            return True
        return False

    async def file_exists(self, relative_path: str) -> bool:
        """Check whether a file exists at the given relative path."""
        return self.resolve_path(relative_path).is_file()

    def ensure_base_directory(self) -> None:
        """Ensure the base directory exists."""
        self._base_path.mkdir(parents=True, exist_ok=True)
        logger.info(
            "Ensured storage base directory.",
            extra={"path": str(self._base_path)},
        )


def default() -> StorageAdapter:
    """Creates a default configuration for the storage adapter using the `settings` module."""
    from app import settings

    return StorageAdapter(settings.STORAGE_BASE_PATH)
