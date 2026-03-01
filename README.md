# Learning Platform

An AI-powered adaptive learning platform with course generation, progress tracking, and parental supervision.

## Features

- **AI course generation** — Describe a topic and the platform generates a full structured course with lectures, flashcards, quizzes, matching exercises, case studies, and more
- **Adaptive learning** — Personalised specialisation tracks and weak area analysis after 50%+ course completion
- **Parental supervision** — Parent accounts can create and monitor supervised student (child) accounts
- **Gamification** — Dashboard with completion stats, best quiz scores, and course progress
- **Rich activity types** — Lectures, spotlights, flashcards, matching, true/false, case studies, ordering, sorting, quizzes, fill-in-the-blank, multiple choice

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.13, FastAPI, uvicorn + uvloop |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Database | MongoDB 8 |
| Cache | Redis |
| AI | OpenAI SDK (compatible with any OpenAI-compatible provider) |
| Cloud | AWS (Bedrock, S3 via aiobotocore) |
| Web search | Exa (optional, enriches course generation) |

## Prerequisites

- Docker and Docker Compose
- An OpenAI-compatible API key (OpenAI, MiniMax, Ollama, vLLM, etc.)

## Quick Start

**1. Clone the repository and configure environment files.**

Copy the example files and fill in your values:

```bash
cp configuration/aws.env.example configuration/aws.env
```

Edit `configuration/app.env`:

```bash
JWT_SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=                  # Optional; leave blank for OpenAI default
OPENAI_MODEL=gpt-4o               # Or your chosen model
EXA_API_KEY=                      # Optional; enables web search during generation
```

Edit `configuration/mongodb.env`:

```bash
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-password-here
MONGO_INITDB_DATABASE=learning
```

**2. Build and run.**

```bash
make build
make run
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:80
- API docs: http://localhost:80/docs

## Configuration

All configuration is split into files under `configuration/`. A summary of the available settings:

### `configuration/app.env`

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET_KEY` | Yes | Arbitrary secret for signing JWT tokens |
| `JWT_ALGORITHM` | No | Default: `HS256` |
| `JWT_EXPIRATION_MINUTES` | No | Default: `1440` (24 hours) |
| `CORS_ALLOWED_ORIGINS` | No | Default: `http://localhost:3000` |
| `OPENAI_API_KEY` | Yes | API key for LLM provider |
| `OPENAI_BASE_URL` | No | Custom base URL for OpenAI-compatible providers |
| `OPENAI_MODEL` | No | Model name to use for generation |
| `EXA_API_KEY` | No | Enables web search enrichment during course generation |
| `STORAGE_BASE_PATH` | No | Default: `/data/content` |

### `configuration/mongodb.env`

| Variable | Description |
|---|---|
| `MONGO_INITDB_ROOT_USERNAME` | MongoDB root username |
| `MONGO_INITDB_ROOT_PASSWORD` | MongoDB root password |
| `MONGO_INITDB_DATABASE` | Database name |

### `configuration/aws.env` (optional)

AWS credentials are optional if the host has IAM roles configured.

| Variable | Description |
|---|---|
| `AWS_REGION` | Default: `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |

### Frontend

The frontend reads `NEXT_PUBLIC_API_URL` (set in `frontend/.env.local` or the Docker build args). Defaults to `http://localhost:80`.

## Development

### Commands

```bash
make build          # Build Docker images
make run            # Run app and frontend (foreground)
make run-d          # Run app and frontend (background)
make run-backend    # Run backend only
make run-frontend   # Run frontend only
make stop           # Stop all services
make lint           # Run all pre-commit hooks (black, isort, autoflake, pyupgrade)
make test           # Run pytest
make mongo-express  # Start Mongo Express UI on port 8081
```

### Hot Reload

In development, `docker-compose.override.yaml` is automatically loaded and enables uvicorn `--reload` for the backend. The `./app` and `./frontend/src` directories are mounted into their respective containers.

## Architecture

Data flows one-way through four layers:

```
API routes → Services → Resources (repositories) → Adapters
```

- **`app/adapters/`** — Thin wrappers around MongoDB, Redis, AWS, OpenAI, Exa, and local storage.
- **`app/resources/`** — Repository classes with Pydantic models and MongoDB query methods.
- **`app/services/`** — Business logic as async functions. Return `ServiceError.OnSuccess[T]` instead of raising exceptions.
- **`app/api/v1/`** — FastAPI routers that call services and convert `ServiceError` into HTTP responses.

### Adding a New Feature

1. Create a repository in `app/resources/` with a Pydantic model and query methods
2. Register it as a `@property` on `AbstractContext` in `app/services/_common.py`
3. Create a service module in `app/services/` with an error enum and async functions
4. Create a router in `app/api/v1/` using `RequiresContext` or `RequiresTransaction`
5. Register the router in `app/api/v1/__init__.py`'s `create_router()`
6. Add MongoDB indexes in `MongoDBClientAdapter.create_indexes()` if needed

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


async def get_thing(ctx: AbstractContext, *, id: str) -> MyError.OnSuccess[Thing]:
    thing = await ctx.things.find_by_id(id)
    if thing is None:
        return MyError.NOT_FOUND
    return thing
```

## API Reference

Interactive API docs are available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

Key endpoint groups:

| Prefix | Description |
|---|---|
| `POST /api/v1/auth/register` | Register a new account |
| `POST /api/v1/auth/login` | Log in, receive JWT |
| `GET /api/v1/@me` | Get current user |
| `PUT /api/v1/@me/dependants` | Create a supervised child account |
| `GET /api/v1/courses` | List courses |
| `POST /api/v1/courses` | Create (generate) a course via SSE stream |
| `GET /api/v1/courses/{id}/journey` | Get learning journey for a course |
| `POST /api/v1/courses/{id}/sections/{section}/complete` | Mark section complete |
| `POST /api/v1/courses/{id}/quiz/{section}/submit` | Submit quiz answers |
| `GET /api/v1/dashboard/summary` | Get dashboard stats |
| `GET /api/v1/parent/children` | List supervised children (parent only) |
