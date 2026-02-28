from __future__ import annotations

from aiobotocore.session import AioSession

from app.utilities import logging

logger = logging.get_logger(__name__)


class AWSSessionAdapter:
    """Wraps an aiobotocore session for creating async AWS service clients.

    Clients are created per-use via async context managers, so there is no
    startup/shutdown lifecycle to manage.
    """

    __slots__ = ("_session", "_region", "_access_key", "_secret_key")

    def __init__(
        self,
        region: str,
        access_key: str | None = None,
        secret_key: str | None = None,
    ) -> None:
        self._session = AioSession()
        self._region = region
        self._access_key = access_key
        self._secret_key = secret_key

    def create_client(self, service_name: str):
        """Returns an async context manager that yields an AWS service client.

        Usage::

            async with adapter.create_client("bedrock-runtime") as client:
                response = await client.invoke_model(...)
        """
        return self._session.create_client(
            service_name,
            region_name=self._region,
            aws_access_key_id=self._access_key,
            aws_secret_access_key=self._secret_key,
        )


def default() -> AWSSessionAdapter:
    """Creates a default configuration for the AWS adapter using the ``settings`` module."""

    from app import settings

    return AWSSessionAdapter(
        region=settings.AWS_REGION,
        access_key=settings.AWS_ACCESS_KEY_ID,
        secret_key=settings.AWS_SECRET_ACCESS_KEY,
    )
