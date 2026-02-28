# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learning platform backend (hackathon project). Features AI-powered adaptive learning with AWS Bedrock/AgentCore, content generation, progress tracking, and gamification. Supports content from primary school to university level.

**Tech stack:** Python 3.13, FastAPI, MongoDB 8, Redis, Docker, AWS Bedrock (AgentCore).

## Commands

```bash
make build              # Build Docker images
make run                # Run app (foreground)
make run-d              # Run app (background)
make lint               # Pre-commit hooks on all files (black, isort, autoflake, pyupgrade)
make mongo-express      # Start Mongo Express (dev)

# Run a specific pre-commit hook
pre-commit run black --all-files
```

## Architecture

**One-way data flow:** `API routes → Services → Resources (repositories) → Adapters (MongoDB/Redis)`

- **`app/adapters/`** — Database/service connection wrappers. `MongoDBClientAdapter` (client connection), `MongoDBTransaction` (explicit transactions), `RedisClient` (with PubSub router), `AWSSessionAdapter` (aiobotocore session for Bedrock, S3, etc.).
- **`app/resources/`** — Repository classes. Each takes an `ImplementsMongoDB` via constructor injection. Uses Pydantic models for document data.
- **`app/services/`** — Business logic as module-level async functions that take `AbstractContext` as first arg. Return `ServiceError.OnSuccess[T]` (union of `T | ServiceError`) instead of raising exceptions.
- **`app/api/v1/`** — FastAPI routers. Endpoints call services and use `response.unwrap()` to convert `ServiceError` into HTTP error responses.
- **`app/api/v1/context.py`** — Dependency injection. `RequiresContext` for reads (client), `RequiresTransaction` for writes (transaction with auto-commit/rollback).

### Adding a New Feature

1. Create repository in `app/resources/` with Pydantic model and query methods
2. Register repository as a `@property` on `AbstractContext` in `app/services/_common.py`
3. Create service module in `app/services/` with error enum (extends `ServiceError`) and async functions
4. Create router in `app/api/v1/` using `RequiresContext` or `RequiresTransaction`
5. Register router in `app/api/v1/__init__.py`'s `create_router()`
6. Add indexes in `MongoDBClientAdapter.create_indexes()` if needed

### Service Error Pattern

```python
class MyError(ServiceError):
    NOT_FOUND = "not_found"

    def service(self) -> str:
        return "my_resource"

    def status_code(self) -> int:
        match self:
            case MyError.NOT_FOUND:
                return 404
            case _:
                return 500


async def get_thing(ctx: AbstractContext, id: str) -> MyError.OnSuccess[Thing]:
    thing = await ctx.things.find_by_id(id)
    if thing is None:
        return MyError.NOT_FOUND
    return thing
```

## Critical Gotchas

- **DO NOT** add `from __future__ import annotations` to `app/api/v1/context.py` — it breaks FastAPI's runtime type introspection for dependency injection. All other files use it.
- Middleware runs in **reverse registration order**. Request tracing is registered last so it runs first.
- Redis PubSub handlers must be registered **before** calling `redis.initialise()`.

## Code Style

- Formatter: **black**. Import sorting: **isort**. Unused import removal: **autoflake**.
- Use `from __future__ import annotations` in all files (except `context.py`).
- Prefer `T | None` over `Optional[T]`, `match` statements for branching.
- Use structured JSON logging: `logger.info("msg", extra={...})` not f-strings.
- Dependencies flow one way — no circular imports.
- Prefer composition over inheritance (except `abc.ABC`).
- Use British English in identifiers where there is a difference.
- Avoid exceptions for expected errors — return `ServiceError` variants instead.
