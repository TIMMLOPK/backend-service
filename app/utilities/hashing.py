from __future__ import annotations

import asyncio

import bcrypt


async def hash_password(password: str) -> str:
    return (
        await asyncio.to_thread(bcrypt.hashpw, password.encode(), bcrypt.gensalt())
    ).decode()


async def verify_password(password: str, hashed_password: str) -> bool:
    return await asyncio.to_thread(
        bcrypt.checkpw, password.encode(), hashed_password.encode()
    )
