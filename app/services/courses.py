from __future__ import annotations

import asyncio
import json
import re
import time as _time
from typing import override

from fastapi import status

from app import settings

from app.resources.course import JOURNEY_STEP_ORDER
from app.resources.course import CaseStudyModel
from app.resources.course import CaseStudyQuestionModel
from app.resources.course import CourseAssignRelationship
from app.resources.course import CourseDifficulty
from app.resources.course import CourseGenerationStatus
from app.resources.course import CourseMaterialModel
from app.resources.course import CourseMaterialType
from app.resources.course import CourseModel
from app.resources.course import CoursePublicity
from app.resources.course import CourseTopic
from app.resources.course import CourseType
from app.resources.course import FillInTheBlankModel
from app.resources.course import FlashcardModel
from app.resources.course import FlashcardSetModel
from app.resources.course import LectureModel
from app.resources.course import MatchingModel
from app.resources.course import MatchingPairModel
from app.resources.course import MaterialSectionModel
from app.resources.course import MultipleChoiceAnswerModel
from app.resources.course import MultipleChoiceModel
from app.resources.course import MultipleChoiceQuestionModel
from app.resources.course import OrderingModel
from app.resources.course import QuizAnswerModel
from app.resources.course import QuizModel
from app.resources.course import QuizQuestionModel
from app.resources.course import SortingCategoryModel
from app.resources.course import SortingModel
from app.resources.course import SpotlightItemModel
from app.resources.course import SpotlightModel
from app.resources.course import TrueFalseModel
from app.resources.course import TrueFalseStatementModel
from app.resources.quiz_scores import QuizAnswerRecordModel
from app.services._common import AbstractAuthContext
from app.services._common import ServiceError
from app.utilities import logging

logger = logging.get_logger(__name__)


class CourseError(ServiceError):
    GENERATION_FAILED = "generation_failed"
    INVALID_AI_RESPONSE = "invalid_ai_response"
    NOT_FOUND = "not_found"
    NOT_OWNER = "not_owner"
    EXPLANATION_FAILED = "explanation_failed"
    INSUFFICIENT_PROGRESS = "insufficient_progress"

    @override
    def service(self) -> str:
        return "courses"

    @override
    def status_code(self) -> int:
        match self:
            case CourseError.NOT_FOUND:
                return status.HTTP_404_NOT_FOUND
            case CourseError.NOT_OWNER | CourseError.INSUFFICIENT_PROGRESS:
                return status.HTTP_403_FORBIDDEN
            case CourseError.GENERATION_FAILED | CourseError.INVALID_AI_RESPONSE:
                return status.HTTP_502_BAD_GATEWAY
            case CourseError.EXPLANATION_FAILED:
                return status.HTTP_502_BAD_GATEWAY
            case _:
                return status.HTTP_500_INTERNAL_SERVER_ERROR


_PHASE1_SYSTEM_PROMPT = """You are a course content generator. Create educational course materials.

Generate 5-8 subtopics and a detailed lecture for each one.

Rules:
- Pick a visually appealing hex colour representing the topic (avoid purple/violet)
- Create one lecture section per subtopic with rich markdown content
- Lectures should use headers, **bold**, *italics*, bullet lists, numbered lists, and code blocks where appropriate
- Write detailed, thorough lectures with examples, analogies, and key takeaways
- Content should match the requested difficulty level
- Estimate hours realistically (1-20 hours total)
- Include 3-6 relevant tag keywords"""

_PHASE1_TOOL: dict = {
    "type": "function",
    "function": {
        "name": "submit_course",
        "description": "Submit the generated course metadata and lecture content",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "colour": {"type": "string"},
                "estimated_hours": {"type": "integer"},
                "tags": {"type": "array", "items": {"type": "string"}},
                "subtopics": {"type": "array", "items": {"type": "string"}},
                "lecture": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "sections": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "content": {"type": "string"},
                                },
                                "required": ["title", "content"],
                            },
                        },
                    },
                    "required": ["title", "description", "sections"],
                },
            },
            "required": [
                "name",
                "description",
                "colour",
                "estimated_hours",
                "tags",
                "subtopics",
                "lecture",
            ],
        },
    },
}

# ── Shared item schemas used across material tool definitions ─────────────────

_ANSWER_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "answer": {"type": "string"},
        "is_correct": {"type": "boolean"},
    },
    "required": ["answer", "is_correct"],
}

_QUIZ_QUESTION_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "question": {"type": "string"},
        "answers": {"type": "array", "items": _ANSWER_SCHEMA},
    },
    "required": ["question", "answers"],
}

_FLASHCARD_ITEM_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "question": {"type": "string"},
        "answer": {"type": "string"},
    },
    "required": ["question", "answer"],
}

_FILL_IN_BLANK_EXERCISE_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "question": {"type": "string"},
        "answers": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["question", "answers"],
}

_MATCHING_PAIR_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "left": {"type": "string"},
        "right": {"type": "string"},
    },
    "required": ["left", "right"],
}

_TRUE_FALSE_STATEMENT_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "statement": {"type": "string"},
        "is_true": {"type": "boolean"},
        "explanation": {"type": "string"},
    },
    "required": ["statement", "is_true", "explanation"],
}

_CASE_STUDY_QUESTION_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "question": {"type": "string"},
        "sample_answer": {"type": "string"},
    },
    "required": ["question", "sample_answer"],
}

_SORTING_CATEGORY_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "items": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["name", "items"],
}

_SPOTLIGHT_ITEM_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "type": {"type": "string"},
        "content": {"type": "string"},
    },
    "required": ["type", "content"],
}

# Section item schemas — one entry per row in the "sections" array
_SECTION_SCHEMAS: dict[str, dict] = {
    "lecture": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "content": {"type": "string"},
        },
        "required": ["title", "content"],
    },
    "flashcards": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "flashcards": {"type": "array", "items": _FLASHCARD_ITEM_SCHEMA},
        },
        "required": ["title", "flashcards"],
    },
    "quiz": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "questions": {"type": "array", "items": _QUIZ_QUESTION_SCHEMA},
        },
        "required": ["title", "questions"],
    },
    "fill_in_the_blank": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "exercises": {"type": "array", "items": _FILL_IN_BLANK_EXERCISE_SCHEMA},
        },
        "required": ["title", "exercises"],
    },
    "multiple_choice": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "questions": {"type": "array", "items": _QUIZ_QUESTION_SCHEMA},
        },
        "required": ["title", "questions"],
    },
    "matching": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "pairs": {"type": "array", "items": _MATCHING_PAIR_SCHEMA},
            "instruction": {"type": "string"},
        },
        "required": ["title", "pairs", "instruction"],
    },
    "ordering": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "items": {"type": "array", "items": {"type": "string"}},
            "instruction": {"type": "string"},
        },
        "required": ["title", "items", "instruction"],
    },
    "true_false": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "statements": {"type": "array", "items": _TRUE_FALSE_STATEMENT_SCHEMA},
        },
        "required": ["title", "statements"],
    },
    "case_study": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "scenario": {"type": "string"},
            "questions": {"type": "array", "items": _CASE_STUDY_QUESTION_SCHEMA},
        },
        "required": ["title", "scenario", "questions"],
    },
    "sorting": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "instruction": {"type": "string"},
            "categories": {"type": "array", "items": _SORTING_CATEGORY_SCHEMA},
        },
        "required": ["title", "instruction", "categories"],
    },
    "spotlight": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "highlights": {"type": "array", "items": _SPOTLIGHT_ITEM_SCHEMA},
        },
        "required": ["title", "highlights"],
    },
}


def _make_material_tool(material_type: str, description: str) -> dict:
    return {
        "type": "function",
        "function": {
            "name": f"submit_{material_type}",
            "description": description,
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "sections": {
                        "type": "array",
                        "items": _SECTION_SCHEMAS[material_type],
                    },
                },
                "required": ["title", "description", "sections"],
            },
        },
    }


_MATERIAL_TOOLS: dict[str, dict] = {
    "flashcards": _make_material_tool("flashcards", "Submit generated flashcard content"),
    "quiz": _make_material_tool("quiz", "Submit generated quiz questions"),
    "fill_in_the_blank": _make_material_tool(
        "fill_in_the_blank", "Submit fill-in-the-blank exercises"
    ),
    "multiple_choice": _make_material_tool(
        "multiple_choice", "Submit multi-select questions"
    ),
    "matching": _make_material_tool("matching", "Submit matching exercises"),
    "ordering": _make_material_tool("ordering", "Submit ordering exercises"),
    "true_false": _make_material_tool("true_false", "Submit true/false statements"),
    "case_study": _make_material_tool("case_study", "Submit case studies"),
    "sorting": _make_material_tool("sorting", "Submit sorting/categorisation exercises"),
    "spotlight": _make_material_tool("spotlight", "Submit spotlight highlights"),
}


def _make_extension_tool(material_type: str) -> dict:
    return {
        "type": "function",
        "function": {
            "name": f"submit_{material_type}_sections",
            "description": f"Submit 1-3 new {material_type} sections",
            "parameters": {
                "type": "object",
                "properties": {
                    "sections": {
                        "type": "array",
                        "items": _SECTION_SCHEMAS[material_type],
                    },
                },
                "required": ["sections"],
            },
        },
    }


_TRACK_SUGGESTION_TOOL: dict = {
    "type": "function",
    "function": {
        "name": "submit_tracks",
        "description": "Submit 2-3 suggested specialisation learning tracks",
        "parameters": {
            "type": "object",
            "properties": {
                "tracks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "subtopics": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["title", "description", "subtopics"],
                    },
                },
            },
            "required": ["tracks"],
        },
    },
}

_SUBTOPICS_TOOL: dict = {
    "type": "function",
    "function": {
        "name": "submit_subtopics",
        "description": "Submit new subtopic titles to extend the course",
        "parameters": {
            "type": "object",
            "properties": {
                "subtopics": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["subtopics"],
        },
    },
}

# ── Simplified system prompts (no JSON format instructions) ───────────────────

_MATERIAL_SYSTEM_PROMPTS: dict[str, str] = {
    "flashcards": """You are a flashcard generator for an educational course. Generate at least 15 flashcards per subtopic — more is better.

Rules:
- One section per subtopic using the exact subtopic titles provided
- At least 15 flashcards per section — MORE IS BETTER
- Cover definitions, facts, comparisons, cause-effect relationships, examples
- Questions should be clear and concise; answers informative but brief
- Match the difficulty level specified""",
    "quiz": """You are a quiz question generator for an educational course. Generate at least 15 questions per subtopic — more is better.

Rules:
- One section per subtopic using the exact subtopic titles provided
- At least 15 questions per section — MORE IS BETTER
- Each question MUST have exactly 4 answers with exactly ONE correct
- Vary question types: recall, application, analysis, comparison
- Wrong answers should be plausible distractors
- Match the difficulty level specified""",
    "fill_in_the_blank": """You are a fill-in-the-blank exercise generator for an educational course. Generate at least 15 exercises per subtopic — more is better.

Rules:
- One section per subtopic using the exact subtopic titles provided
- At least 15 exercises per section — MORE IS BETTER
- Each blank is represented by three underscores: ___
- The number of ___ in each question MUST match the number of answers
- Test key vocabulary, relationships, and concepts
- Match the difficulty level specified""",
    "multiple_choice": """You are a multiple-choice (multi-select) question generator for an educational course. Generate at least 15 questions per subtopic — more is better.

Rules:
- One section per subtopic using the exact subtopic titles provided
- At least 15 questions per section — MORE IS BETTER
- Each question should have 4-5 answers with at least 1 correct answer
- Label questions with "Select all that apply:"
- Test deeper understanding: combinations, relationships, classifications
- Match the difficulty level specified""",
    "matching": """You are a matching exercise generator for an educational course. Create 8-12 matching pairs per subtopic.

Rules:
- One section per subtopic using the exact subtopic titles provided
- 8-12 pairs per section
- Pairs can be term↔definition, cause↔effect, concept↔example, date↔event
- Left and right items should be concise (1-2 sentences max)
- Include a clear instruction for each section
- Match the difficulty level specified""",
    "ordering": """You are an ordering exercise generator for an educational course. Create 5-8 items per subtopic to arrange in sequence.

Rules:
- One section per subtopic using the exact subtopic titles provided
- 5-8 items per section, stored in the CORRECT order
- Items can be chronological steps, procedural stages, ranked importance
- Each item should be concise (1 sentence)
- Include a clear instruction for each section
- Match the difficulty level specified""",
    "true_false": """You are a true/false question generator for an educational course. Create 12-15 statements per subtopic.

Rules:
- One section per subtopic using the exact subtopic titles provided
- 12-15 statements per section
- Statements MUST be unambiguous — clearly true or clearly false
- Every statement needs a brief explanation (1-2 sentences)
- Aim for roughly 50/50 split between true and false
- Match the difficulty level specified""",
    "case_study": """You are a case study generator for an educational course. Create 1 scenario with 3-4 discussion questions per subtopic.

Rules:
- One section per subtopic using the exact subtopic titles provided
- Scenario should be 200-400 words in markdown format
- 3-4 discussion questions per scenario with sample answers
- Scenarios should feel realistic and relatable
- Questions should test higher-order thinking: analysis, evaluation, application
- Match the difficulty level specified""",
    "sorting": """You are a sorting/categorisation exercise generator for an educational course. Create 2-4 categories with 3-6 items each per subtopic.

Rules:
- One section per subtopic using the exact subtopic titles provided
- 2-4 categories per section with 3-6 items each
- Categories should be meaningful classifications
- Items should clearly belong to one category only
- Include a clear instruction for each section
- Match the difficulty level specified""",
    "spotlight": """You are a spotlight content generator for an educational course. Create 4-6 highlights (fun facts, tips, mnemonics, analogies) per subtopic.

Rules:
- One section per subtopic using the exact subtopic titles provided
- 4-6 highlights per section
- Use a mix of types: fact, tip, mnemonic, analogy
- Facts should be surprising or memorable; tips practical and actionable
- Match the difficulty level specified""",
}

_EXTENSION_SYSTEM_PROMPT = """You are a course content extender. Given a course's existing sections and a user request, generate 1-3 new sections that complement and extend the existing content. Do NOT repeat any existing section titles."""

_TRACK_SUGGESTION_SYSTEM_PROMPT = """You are a learning advisor. Given a student's course data and quiz performance, suggest 2-3 diverse specialisation tracks they could pursue. One track could go deeper into strong areas, one could strengthen weak areas, and one could explore related topics."""

_SUBTOPICS_SYSTEM_PROMPT = """You are a course content planner. Given an existing course's topic, difficulty, and current subtopic titles, suggest 3-5 NEW subtopic titles that naturally continue the learning path. Do NOT repeat any existing subtopic titles. Build on what was already covered — go deeper or explore adjacent concepts."""

_EXPLANATION_SYSTEM_PROMPT = """You are a friendly educational tutor. A student got a question wrong. Explain why the correct answer is right and why their choice was wrong. Keep it brief (2-4 sentences), encouraging, and educational. Do not repeat the question — jump straight into the explanation."""


_EXA_SEARCH_RESULTS = 4
_EXA_CONTENT_CHARS = 8000
_EXA_SECTION_CHARS = 1500


async def _fetch_exa_context(
    ctx: AbstractAuthContext,
    topic: str,
) -> str | None:
    """Search Exa for current, real-world information about the course topic.

    Returns a formatted reference string to inject into the LLM prompts, or
    None if Exa is not configured or the search fails.
    """
    if ctx.exa is None:
        return None

    try:
        results = await ctx.exa.client.search_and_contents(
            f"educational overview of {topic}",
            type="fast",
            num_results=_EXA_SEARCH_RESULTS,
            text={"max_characters": _EXA_CONTENT_CHARS},
        )
    except Exception:
        logger.exception(
            "Exa search failed; continuing without web context",
            extra={"topic": topic},
        )
        return None

    snippets: list[str] = []
    for result in results.results:
        text = getattr(result, "text", None) or ""
        title = getattr(result, "title", None) or "Untitled"
        url = getattr(result, "url", None) or ""
        if not text.strip():
            continue
        snippet = text.strip()[: _EXA_SECTION_CHARS]
        snippets.append(f"### {title}\nSource: {url}\n\n{snippet}")

    if not snippets:
        return None

    logger.info(
        "Exa context fetched",
        extra={"topic": topic, "result_count": len(snippets)},
    )
    joined = "\n\n---\n\n".join(snippets)
    return (
        "## Web Reference Material\n\n"
        "The following excerpts were retrieved from the web and reflect current, "
        "real-world knowledge about the topic. Use them to ground and enrich your "
        "course content where relevant, but do not copy them verbatim.\n\n"
        f"{joined}"
    )


def _build_user_prompt(
    topic: str,
    difficulty: CourseDifficulty,
    course_type: CourseType,
    additional_details: str | None,
    exa_context: str | None = None,
) -> str:
    prompt = (
        f"Create a {difficulty.value} level {course_type.value} course about: {topic}"
    )
    if additional_details:
        prompt += f"\n\nAdditional details from the student: {additional_details}"
    if exa_context:
        prompt += f"\n\n{exa_context}"
    return prompt


def _extract_tool_args(completion) -> dict | None:  # type: ignore[no-untyped-def]
    """Extract JSON arguments from the first tool call in a completion."""
    choices = completion.choices
    if not choices:
        return None
    tool_calls = choices[0].message.tool_calls
    if not tool_calls:
        return None
    try:
        return json.loads(tool_calls[0].function.arguments)
    except (json.JSONDecodeError, AttributeError):
        return None


def _map_topic(topic_str: str) -> CourseTopic:
    """Best-effort mapping from a free-text topic to the CourseTopic enum."""
    lower = topic_str.lower()
    if any(
        kw in lower for kw in ("math", "algebra", "calculus", "geometry", "statistics")
    ):
        return CourseTopic.MATH
    if any(kw in lower for kw in ("science", "physics", "chemistry", "biology")):
        return CourseTopic.SCIENCE
    if any(kw in lower for kw in ("history", "war", "civilisation", "civilization")):
        return CourseTopic.HISTORY
    if any(kw in lower for kw in ("art", "paint", "draw", "design", "sculpture")):
        return CourseTopic.ART
    if any(kw in lower for kw in ("music", "instrument", "song", "melody", "rhythm")):
        return CourseTopic.MUSIC
    return CourseTopic.OTHER


def _parse_section_material(
    material_type: str,
    section_raw: dict,
) -> (
    LectureModel
    | FlashcardSetModel
    | QuizModel
    | FillInTheBlankModel
    | MultipleChoiceModel
    | None
):
    """Parse a single section's material data from raw JSON. Returns None on failure."""
    try:
        match material_type:
            case "lecture":
                return LectureModel(content=section_raw.get("content", ""))
            case "flashcards":
                cards = [
                    FlashcardModel(question=c["question"], answer=c["answer"])
                    for c in section_raw.get("flashcards", [])
                ]
                return FlashcardSetModel(flashcards=cards)
            case "quiz":
                questions = []
                for q in section_raw.get("questions", []):
                    answers = [
                        QuizAnswerModel(answer=a["answer"], is_correct=a["is_correct"])
                        for a in q.get("answers", [])
                    ]
                    questions.append(
                        QuizQuestionModel(question=q["question"], answers=answers)
                    )
                return QuizModel(questions=questions)
            case "fill_in_the_blank":
                return FillInTheBlankModel(
                    question=section_raw["question"],
                    answers=section_raw["answers"],
                )
            case "multiple_choice":
                questions = []
                for q in section_raw.get("questions", []):
                    answers = [
                        MultipleChoiceAnswerModel(
                            answer=a["answer"], is_correct=a["is_correct"]
                        )
                        for a in q.get("answers", [])
                    ]
                    questions.append(
                        MultipleChoiceQuestionModel(
                            question=q["question"], answers=answers
                        )
                    )
                return MultipleChoiceModel(questions=questions)
            case "matching":
                pairs = [
                    MatchingPairModel(left=p["left"], right=p["right"])
                    for p in section_raw.get("pairs", [])
                ]
                return MatchingModel(
                    pairs=pairs,
                    instruction=section_raw.get("instruction", "Match the items"),
                )
            case "ordering":
                return OrderingModel(
                    items=section_raw.get("items", []),
                    instruction=section_raw.get("instruction", "Arrange in the correct order"),
                )
            case "true_false":
                statements = [
                    TrueFalseStatementModel(
                        statement=s["statement"],
                        is_true=s["is_true"],
                        explanation=s["explanation"],
                    )
                    for s in section_raw.get("statements", [])
                ]
                return TrueFalseModel(statements=statements)
            case "case_study":
                questions = [
                    CaseStudyQuestionModel(
                        question=q["question"],
                        sample_answer=q["sample_answer"],
                    )
                    for q in section_raw.get("questions", [])
                ]
                return CaseStudyModel(
                    scenario=section_raw.get("scenario", ""),
                    questions=questions,
                )
            case "sorting":
                categories = [
                    SortingCategoryModel(name=c["name"], items=c["items"])
                    for c in section_raw.get("categories", [])
                ]
                return SortingModel(
                    instruction=section_raw.get("instruction", "Sort items into categories"),
                    categories=categories,
                )
            case "spotlight":
                highlights = [
                    SpotlightItemModel(type=h.get("type", "fact"), content=h["content"])
                    for h in section_raw.get("highlights", [])
                ]
                return SpotlightModel(highlights=highlights)
            case _:
                return None
    except (KeyError, TypeError):
        return None


_MATERIAL_GENERATION_MAX_RETRIES = 3
_MATERIAL_GENERATION_RETRY_DELAY = 2.0  # seconds, doubles each retry

_LLM_SEMAPHORE = asyncio.Semaphore(10)


async def _generate_material_type(
    ctx: AbstractAuthContext,
    material_type: str,
    topic: str,
    difficulty: CourseDifficulty,
    subtopics: list[str],
    *,
    course_id: str = "",
) -> dict | None:
    """Generate a single material type using tool calling.

    Retries up to _MATERIAL_GENERATION_MAX_RETRIES times with exponential
    back-off to handle rate limits when multiple calls run in parallel.
    """
    tool = _MATERIAL_TOOLS.get(material_type)
    system_prompt = _MATERIAL_SYSTEM_PROMPTS.get(material_type)
    if not tool or not system_prompt:
        logger.error(
            "No tool/prompt registered for material type",
            extra={"material_type": material_type, "course_id": course_id},
        )
        return None

    tool_name = tool["function"]["name"]
    user_msg = (
        f"Course topic: {topic}\n"
        f"Difficulty: {difficulty.value}\n"
        f"Subtopics (generate one section for each): {json.dumps(subtopics)}\n\n"
        f"Generate as much content as possible for every subtopic."
    )

    last_error: Exception | None = None
    for attempt in range(_MATERIAL_GENERATION_MAX_RETRIES):
        try:
            logger.info(
                "Material LLM call starting",
                extra={
                    "course_id": course_id,
                    "material_type": material_type,
                    "tool": tool_name,
                    "attempt": attempt + 1,
                    "model": settings.OPENAI_MODEL,
                    "subtopic_count": len(subtopics),
                },
            )
            t0 = _time.monotonic()
            async with _LLM_SEMAPHORE:
                wait_s = round(_time.monotonic() - t0, 2)
                if wait_s > 0.1:
                    logger.info(
                        "Material LLM semaphore wait",
                        extra={"course_id": course_id, "material_type": material_type, "wait_s": wait_s},
                    )
                t1 = _time.monotonic()
                completion = await ctx.openai.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                    tools=[tool],
                    tool_choice={"type": "function", "function": {"name": tool_name}},
                    temperature=0.7,
                    max_completion_tokens=16384,
                )
            elapsed = round(_time.monotonic() - t1, 2)
            choice = completion.choices[0] if completion.choices else None
            finish_reason = choice.finish_reason if choice else "no_choice"
            has_tool_calls = bool(choice and choice.message.tool_calls)
            usage = completion.usage
            logger.info(
                "Material LLM call completed",
                extra={
                    "course_id": course_id,
                    "material_type": material_type,
                    "elapsed_s": elapsed,
                    "finish_reason": finish_reason,
                    "has_tool_calls": has_tool_calls,
                    "prompt_tokens": usage.prompt_tokens if usage else None,
                    "completion_tokens": usage.completion_tokens if usage else None,
                    "total_tokens": usage.total_tokens if usage else None,
                },
            )
            break
        except Exception as exc:
            last_error = exc
            delay = _MATERIAL_GENERATION_RETRY_DELAY * (2**attempt)
            logger.exception(
                "Material LLM call failed",
                extra={
                    "course_id": course_id,
                    "material_type": material_type,
                    "attempt": attempt + 1,
                    "max_retries": _MATERIAL_GENERATION_MAX_RETRIES,
                    "retry_delay_s": delay,
                    "error": str(exc),
                },
            )
            await asyncio.sleep(delay)
    else:
        logger.error(
            "Material generation exhausted all retries",
            extra={
                "course_id": course_id,
                "material_type": material_type,
                "max_retries": _MATERIAL_GENERATION_MAX_RETRIES,
            },
            exc_info=last_error,
        )
        return None

    parsed = _extract_tool_args(completion)
    if parsed is None:
        choice = completion.choices[0] if completion.choices else None
        logger.error(
            "Material LLM returned no tool call",
            extra={
                "course_id": course_id,
                "material_type": material_type,
                "finish_reason": choice.finish_reason if choice else "unknown",
                "message_content_preview": (
                    (choice.message.content or "")[:200] if choice else ""
                ),
            },
        )
        return None

    sections = parsed.get("sections", [])
    logger.info(
        "Material tool call parsed",
        extra={
            "course_id": course_id,
            "material_type": material_type,
            "raw_section_count": len(sections),
        },
    )
    return parsed


def _parse_fill_in_blank_sections(sections_raw: list[dict]) -> list[dict]:
    """Normalise fill_in_the_blank sections — the AI may return an 'exercises' array
    with multiple exercises per section, or the old flat format with a single question."""
    flat: list[dict] = []
    for section_raw in sections_raw:
        exercises = section_raw.get("exercises")
        if exercises and isinstance(exercises, list):
            for ex in exercises:
                flat.append(
                    {
                        "title": section_raw.get("title", ""),
                        "question": ex.get("question", ""),
                        "answers": ex.get("answers", []),
                    }
                )
        else:
            flat.append(section_raw)
    return flat


async def _create_material_from_data(
    ctx: AbstractAuthContext,
    course_id: str,
    user_id: str,
    material_type: CourseMaterialType,
    mat_data: dict | str | None,
) -> CourseMaterialModel | None:
    """Parse raw AI material data and create the material in the database."""
    if not isinstance(mat_data, dict):
        logger.error(
            "Material data is not a dict — material dropped",
            extra={
                "course_id": course_id,
                "material_type": material_type,
                "mat_data_type": type(mat_data).__name__,
            },
        )
        return None

    sections_raw = mat_data.get("sections", [])

    if material_type == "fill_in_the_blank":
        sections_raw = _parse_fill_in_blank_sections(sections_raw)

    raw_count = len(sections_raw)
    parsed_sections: list[MaterialSectionModel] = []
    failed_titles: list[str] = []
    for idx, section_raw in enumerate(sections_raw):
        material = _parse_section_material(material_type, section_raw)
        if material is not None:
            parsed_sections.append(
                MaterialSectionModel(
                    index=idx,
                    title=section_raw.get("title", f"Section {idx + 1}"),
                    material=material,
                    is_completed=False,
                ),
            )
        else:
            failed_titles.append(section_raw.get("title", f"section[{idx}]"))

    if failed_titles:
        logger.warning(
            "Some sections failed to parse",
            extra={
                "course_id": course_id,
                "material_type": material_type,
                "raw_count": raw_count,
                "parsed_count": len(parsed_sections),
                "failed_titles": failed_titles,
            },
        )

    if not parsed_sections:
        logger.error(
            "All sections failed to parse — material dropped",
            extra={
                "course_id": course_id,
                "material_type": material_type,
                "raw_count": raw_count,
                "section_keys_sample": (
                    list(sections_raw[0].keys()) if sections_raw else []
                ),
            },
        )
        return None

    return await ctx.course_materials.create(
        course_id=course_id,
        user_id=user_id,
        material_type=material_type,
        data=parsed_sections,
        title=mat_data.get("title", material_type.replace("_", " ").title()),
        description=mat_data.get("description", ""),
        is_visible=True,
    )


async def generate_course(
    ctx: AbstractAuthContext,
    topic: str,
    difficulty: CourseDifficulty,
    course_type: CourseType,
    additional_details: str | None = None,
) -> CourseError.OnSuccess[CourseModel]:
    logger.info(
        "Generating course via AI (phase 1: metadata + lectures)",
        extra={
            "topic": topic,
            "difficulty": difficulty.value,
            "model": settings.OPENAI_MODEL,
        },
    )

    exa_context = await _fetch_exa_context(ctx, topic)
    user_prompt = _build_user_prompt(topic, difficulty, course_type, additional_details, exa_context)

    # ── Phase 1: Generate metadata + subtopics + lectures ──
    logger.info("Phase 1 LLM call starting", extra={"model": settings.OPENAI_MODEL})
    t0 = _time.monotonic()
    try:
        completion = await ctx.openai.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _PHASE1_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            tools=[_PHASE1_TOOL],
            tool_choice={"type": "function", "function": {"name": "submit_course"}},
            temperature=0.7,
            max_completion_tokens=16384,
        )
    except Exception as exc:
        logger.exception("Phase 1 LLM API call failed", extra={"error": str(exc)})
        return CourseError.GENERATION_FAILED

    elapsed = round(_time.monotonic() - t0, 2)
    usage = completion.usage
    choice = completion.choices[0] if completion.choices else None
    logger.info(
        "Phase 1 LLM call completed",
        extra={
            "elapsed_s": elapsed,
            "finish_reason": choice.finish_reason if choice else "no_choice",
            "prompt_tokens": usage.prompt_tokens if usage else None,
            "completion_tokens": usage.completion_tokens if usage else None,
            "total_tokens": usage.total_tokens if usage else None,
        },
    )

    data = _extract_tool_args(completion)
    if data is None:
        logger.error(
            "Phase 1 LLM returned no tool call",
            extra={
                "finish_reason": choice.finish_reason if choice else "unknown",
                "message_content_preview": (
                    (choice.message.content or "")[:200] if choice else ""
                ),
            },
        )
        return CourseError.GENERATION_FAILED

    subtopics: list[str] = data.get("subtopics", [])
    missing_keys = [k for k in ("name", "description", "lecture") if not data.get(k)]
    logger.info(
        "Phase 1 parsed successfully",
        extra={
            "subtopic_count": len(subtopics),
            "subtopics": subtopics,
            "data_keys": list(data.keys()),
            "missing_required_keys": missing_keys,
        },
    )

    if missing_keys:
        logger.error(
            "Phase 1 response missing required fields",
            extra={"missing_keys": missing_keys, "data_keys": list(data.keys())},
        )
        return CourseError.INVALID_AI_RESPONSE

    # Create the course with status=GENERATING; Phase 2 will update it to READY/FAILED.
    course_topic = _map_topic(topic)
    colour = data.get("colour", "#6366f1")
    try:
        course = await ctx.courses.create(
            name=data["name"],
            description=data["description"],
            course_type=course_type,
            difficulty=difficulty,
            topic=course_topic,
            estimated_hours=int(data.get("estimated_hours", 3)),
            tags=data.get("tags", []),
            preview_url=None,
            basis_materials=[],
            publicity=CoursePublicity.PRIVATE,
            colour=colour,
            status=CourseGenerationStatus.GENERATING,
        )
    except Exception:
        logger.exception("Failed to create course in database")
        return CourseError.GENERATION_FAILED

    await ctx.course_assigns.create(
        course_id=course.id,
        user_id=ctx.user.id,
        relationship=CourseAssignRelationship.PERSONAL,
    )

    # Save lectures (synchronous — needed before returning so the page has content)
    lecture_mat = await _create_material_from_data(
        ctx, course.id, ctx.user.id, "lecture", data["lecture"],
    )
    if lecture_mat:
        logger.info("Lecture material saved", extra={"course_id": course.id})

    # ── Phase 2: Generate 10 material types in background ──
    asyncio.create_task(
        _generate_course_materials(ctx, course.id, topic, difficulty, subtopics),
        name=f"phase2:{course.id}",
    )

    total_elapsed = round(_time.monotonic() - t0, 2)
    logger.info(
        "Course phase 1 complete, materials generating in background",
        extra={
            "course_id": course.id,
            "course_name": course.name,
            "phase1_elapsed_s": total_elapsed,
        },
    )
    return course


async def _generate_course_materials(
    ctx: AbstractAuthContext,
    course_id: str,
    topic: str,
    difficulty: CourseDifficulty,
    subtopics: list[str],
) -> None:
    logger.info(
        "Phase 2 starting (10 material types in parallel)",
        extra={"course_id": course_id, "subtopics": subtopics},
    )
    material_types: list[CourseMaterialType] = [
        "flashcards", "quiz", "fill_in_the_blank", "multiple_choice",
        "matching", "ordering", "true_false", "case_study", "sorting", "spotlight",
    ]
    generation_tasks = [
        _generate_material_type(ctx, mt, topic, difficulty, subtopics, course_id=course_id)
        for mt in material_types
    ]
    t2 = _time.monotonic()
    try:
        results = await asyncio.gather(*generation_tasks, return_exceptions=True)
    except Exception:
        logger.exception("Phase 2 gather raised unexpectedly", extra={"course_id": course_id})
        await ctx.courses.update_status(course_id, CourseGenerationStatus.FAILED)
        return

    phase2_elapsed = round(_time.monotonic() - t2, 2)

    user_id = ctx.user.id
    save_tasks = []
    save_material_types = []
    llm_outcomes: dict[str, str] = {}

    for mt, result in zip(material_types, results):
        if isinstance(result, (Exception, BaseException)):
            logger.error(
                "Material generation raised exception",
                extra={"course_id": course_id, "material_type": mt},
                exc_info=result,
            )
            llm_outcomes[mt] = "exception"
            continue
        if result is None:
            llm_outcomes[mt] = "no_result"
            continue
        llm_outcomes[mt] = f"ok:{len(result.get('sections', []))}sections"
        save_tasks.append(_create_material_from_data(ctx, course_id, user_id, mt, result))
        save_material_types.append(mt)

    saved = await asyncio.gather(*save_tasks, return_exceptions=True)
    saved_count = 0
    save_outcomes: dict[str, str] = {}

    for mt, mat in zip(save_material_types, saved):
        if isinstance(mat, (Exception, BaseException)):
            logger.error(
                "Material DB save raised exception",
                extra={"course_id": course_id, "material_type": mt},
                exc_info=mat,
            )
            save_outcomes[mt] = "db_error"
            continue
        if mat:
            saved_count += 1
            save_outcomes[mt] = f"saved:{len(mat.data)}sections"
        else:
            save_outcomes[mt] = "dropped"

    await ctx.courses.update_status(course_id, CourseGenerationStatus.READY)
    logger.info(
        "Course generation complete",
        extra={
            "course_id": course_id,
            "phase2_elapsed_s": phase2_elapsed,
            "materials_saved": saved_count,
            "llm_outcomes": llm_outcomes,
            "save_outcomes": save_outcomes,
        },
    )


async def get_course(
    ctx: AbstractAuthContext,
    course_id: str,
) -> CourseError.OnSuccess[CourseModel]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND
    return course


async def get_course_materials(
    ctx: AbstractAuthContext,
    course_id: str,
) -> CourseError.OnSuccess[list[CourseMaterialModel]]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND
    return await ctx.course_materials.find_by_course_and_user(course_id, ctx.user.id)


async def get_user_courses(
    ctx: AbstractAuthContext,
) -> CourseError.OnSuccess[list[CourseModel]]:
    assigns = await ctx.course_assigns.find_by_user_id(ctx.user.id)
    courses: list[CourseModel] = []
    for assign in assigns:
        course = await ctx.courses.find_by_id(assign.course_id)
        if course is not None:
            courses.append(course)
    return courses


async def submit_quiz_score(
    ctx: AbstractAuthContext,
    course_id: str,
    material_id: str,
    section_index: int,
    answers: list[QuizAnswerRecordModel],
) -> CourseError.OnSuccess[dict]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND

    material = await ctx.course_materials.find_by_id(material_id)
    if material is None or material.course_id != course_id:
        return CourseError.NOT_FOUND

    score = sum(1 for a in answers if a.is_correct)
    total = len(answers)

    record = await ctx.quiz_scores.create(
        material_id=material_id,
        user_id=ctx.user.id,
        section_index=section_index,
        score=score,
        total=total,
        answers=answers,
    )

    # Mark section completed
    await ctx.course_materials.mark_section_completed(material_id, section_index)

    score_pct = score / total if total > 0 else 1.0
    if score_pct < _IMPROVEMENT_SCORE_THRESHOLD and section_index < len(material.data):
        subtopic_title = material.data[section_index].title
        asyncio.create_task(
            _auto_improve_content(ctx, course_id, ctx.user.id, subtopic_title)
        )

    return {"id": record.id, "score": score, "total": total}


async def get_quiz_scores(
    ctx: AbstractAuthContext,
    course_id: str,
    material_id: str,
) -> CourseError.OnSuccess[list]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND
    return await ctx.quiz_scores.find_by_material_and_user(material_id, ctx.user.id)


async def explain_wrong_answer(
    ctx: AbstractAuthContext,
    material_id: str,
    question: str,
    selected_answer: str,
    correct_answer: str,
) -> CourseError.OnSuccess[str]:
    user_prompt = (
        f"Question: {question}\n"
        f"Student's answer: {selected_answer}\n"
        f"Correct answer: {correct_answer}"
    )

    try:
        completion = await ctx.openai.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _EXPLANATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_completion_tokens=512,
        )
    except Exception:
        logger.exception("Explanation LLM call failed")
        return CourseError.EXPLANATION_FAILED

    raw = completion.choices[0].message.content
    if not raw:
        return CourseError.EXPLANATION_FAILED

    # Strip thinking tags
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
    return raw


async def extend_course(
    ctx: AbstractAuthContext,
    course_id: str,
    prompt: str,
) -> CourseError.OnSuccess[list[CourseMaterialModel]]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND

    existing_materials = await ctx.course_materials.find_by_course_and_user(
        course_id, ctx.user.id
    )
    if not existing_materials:
        return CourseError.NOT_FOUND

    updated_materials: list[CourseMaterialModel] = []

    for mat in existing_materials:
        if mat.type not in _SECTION_SCHEMAS:
            continue

        existing_titles = [s.title for s in mat.data]
        current_count = len(mat.data)

        ext_tool = _make_extension_tool(mat.type)
        tool_name = ext_tool["function"]["name"]
        user_msg = (
            f"Course topic: {course.name}\n"
            f"Material type: {mat.type}\n"
            f"Existing section titles: {json.dumps(existing_titles)}\n"
            f"User request: {prompt}\n\n"
            f"Generate 1-3 new sections that complement the existing content. Do NOT repeat any existing section titles."
        )

        try:
            completion = await ctx.openai.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": _EXTENSION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                tools=[ext_tool],
                tool_choice={"type": "function", "function": {"name": tool_name}},
                temperature=0.7,
                max_completion_tokens=4096,
            )
        except Exception:
            logger.exception(
                "Extension LLM call failed", extra={"material_type": mat.type}
            )
            continue

        args = _extract_tool_args(completion)
        if args is None:
            logger.warning(
                "Extension LLM returned no tool call",
                extra={"material_type": mat.type},
            )
            continue

        sections_data = args.get("sections", [])
        if not isinstance(sections_data, list):
            continue

        if mat.type == "fill_in_the_blank":
            sections_data = _parse_fill_in_blank_sections(sections_data)

        new_sections: list[MaterialSectionModel] = []
        for i, section_raw in enumerate(sections_data):
            material_data = _parse_section_material(mat.type, section_raw)
            if material_data is not None:
                new_sections.append(
                    MaterialSectionModel(
                        index=current_count + i,
                        title=section_raw.get(
                            "title", f"Section {current_count + i + 1}"
                        ),
                        material=material_data,
                        is_completed=False,
                    ),
                )

        if new_sections:
            await ctx.course_materials.append_sections(mat.id, new_sections)

        # Re-fetch the updated material
        updated = await ctx.course_materials.find_by_id(mat.id)
        if updated:
            updated_materials.append(updated)

    return updated_materials


# ---------------------------------------------------------------------------
# Journey service
# ---------------------------------------------------------------------------


def _build_interleaved_journey(
    materials: list[CourseMaterialModel],
) -> list[dict]:
    """Build an interleaved journey from materials using spaced-repetition-inspired ordering.

    For N subtopics, spaces out material types:
    - Lecture + Flashcards: introduced together immediately
    - Quiz: placed ~1 subtopic later
    - Fill-in-the-blank: placed ~2 subtopics later
    - Multiple-choice: placed ~3 subtopics later
    """
    # Build a map of material_type -> {subtopic_title -> (material_id, section_index, is_completed)}
    type_map: dict[str, dict[str, tuple[str, int, bool]]] = {}
    for mat in materials:
        if mat.type not in type_map:
            type_map[mat.type] = {}
        for section in mat.data:
            type_map[mat.type][section.title] = (
                mat.id,
                section.index,
                section.is_completed,
            )

    # Collect all unique subtopic titles in order (from lectures, or first available material)
    subtopic_titles: list[str] = []
    seen_titles: set[str] = set()
    # Prefer lecture order, then flashcards, then others
    for material_type in JOURNEY_STEP_ORDER:
        if material_type in type_map:
            for title in type_map[material_type]:
                if title not in seen_titles:
                    subtopic_titles.append(title)
                    seen_titles.add(title)

    steps: list[dict] = []
    step_index = 0

    # Spacing offsets for each material type (how many subtopics to delay)
    spacing = {
        "lecture": 0,
        "spotlight": 0,
        "flashcards": 1,
        "matching": 1,
        "true_false": 2,
        "ordering": 2,
        "case_study": 3,
        "sorting": 3,
        "quiz": 4,
        "fill_in_the_blank": 4,
        "multiple_choice": 5,
    }

    # For each "round" (subtopic index), emit items that are due
    n = len(subtopic_titles)
    max_rounds = n + max(spacing.values())

    for round_idx in range(max_rounds):
        for material_type in JOURNEY_STEP_ORDER:
            # Which subtopic is due for this material type at this round?
            subtopic_idx = round_idx - spacing.get(material_type, 0)
            if subtopic_idx < 0 or subtopic_idx >= n:
                continue
            title = subtopic_titles[subtopic_idx]
            if material_type not in type_map or title not in type_map[material_type]:
                continue
            mat_id, sec_idx, is_completed = type_map[material_type][title]
            steps.append(
                {
                    "step_index": step_index,
                    "material_type": material_type,
                    "material_id": mat_id,
                    "section_index": sec_idx,
                    "subtopic_title": title,
                    "is_completed": is_completed,
                }
            )
            step_index += 1

    return steps


async def get_journey(
    ctx: AbstractAuthContext,
    course_id: str,
) -> CourseError.OnSuccess[dict]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND

    materials = await ctx.course_materials.find_by_course_and_user(
        course_id, ctx.user.id
    )
    if not materials:
        return {
            "steps": [],
            "total_steps": 0,
            "completed_steps": 0,
            "recommended_step_index": None,
        }

    steps = _build_interleaved_journey(materials)
    total_steps = len(steps)
    completed_steps = sum(1 for s in steps if s["is_completed"])

    # Find recommended step (first incomplete step)
    recommended_step_index = None
    for s in steps:
        if not s["is_completed"]:
            recommended_step_index = s["step_index"]
            break

    # Trigger lazy generation check (fire and forget)
    asyncio.create_task(_check_and_generate_ahead(ctx, course_id, course, materials))

    return {
        "steps": steps,
        "total_steps": total_steps,
        "completed_steps": completed_steps,
        "recommended_step_index": recommended_step_index,
    }


async def complete_section(
    ctx: AbstractAuthContext,
    course_id: str,
    material_id: str,
    section_index: int,
) -> CourseError.OnSuccess[dict]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND

    material = await ctx.course_materials.find_by_id(material_id)
    if material is None or material.course_id != course_id:
        return CourseError.NOT_FOUND

    await ctx.course_materials.mark_section_completed(material_id, section_index)
    return {"success": True}


# ---------------------------------------------------------------------------
# Specialisation services
# ---------------------------------------------------------------------------


async def suggest_tracks(
    ctx: AbstractAuthContext,
    course_id: str,
) -> CourseError.OnSuccess[list[dict]]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND

    materials = await ctx.course_materials.find_by_course_and_user(
        course_id, ctx.user.id
    )
    if not materials:
        return CourseError.NOT_FOUND

    # Check completion >= 50%
    total = sum(len(m.data) for m in materials)
    completed = sum(1 for m in materials for s in m.data if s.is_completed)
    if total == 0 or (completed / total) < 0.5:
        return CourseError.INSUFFICIENT_PROGRESS

    # Gather quiz scores for context
    scores_info: list[str] = []
    for mat in materials:
        if mat.type in ("quiz", "multiple_choice"):
            mat_scores = await ctx.quiz_scores.find_by_material_and_user(
                mat.id, ctx.user.id
            )
            for sc in mat_scores:
                pct = round((sc.score / sc.total) * 100) if sc.total > 0 else 0
                section_title = (
                    mat.data[sc.section_index].title
                    if sc.section_index < len(mat.data)
                    else "Unknown"
                )
                scores_info.append(f"{section_title}: {pct}%")

    subtopics = list({s.title for m in materials for s in m.data})

    user_msg = (
        f"Course: {course.name}\n"
        f"Difficulty: {course.difficulty}\n"
        f"Subtopics covered: {json.dumps(subtopics)}\n"
        f"Quiz performance: {'; '.join(scores_info) if scores_info else 'No scores yet'}\n\n"
        f"Suggest 2-3 specialisation tracks."
    )

    try:
        completion = await ctx.openai.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _TRACK_SUGGESTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            tools=[_TRACK_SUGGESTION_TOOL],
            tool_choice={"type": "function", "function": {"name": "submit_tracks"}},
            temperature=0.7,
            max_completion_tokens=2048,
        )
    except Exception:
        logger.exception("Track suggestion LLM call failed")
        return CourseError.GENERATION_FAILED

    args = _extract_tool_args(completion)
    if args is None:
        return CourseError.GENERATION_FAILED

    tracks = args.get("tracks", [])
    if not isinstance(tracks, list):
        return CourseError.INVALID_AI_RESPONSE

    return tracks


async def generate_track_content(
    ctx: AbstractAuthContext,
    course_id: str,
    track_title: str,
    subtopics: list[str],
) -> CourseError.OnSuccess[list[CourseMaterialModel]]:
    prompt = f"Generate content for specialisation track '{track_title}' covering subtopics: {', '.join(subtopics)}"
    return await extend_course(ctx, course_id, prompt)


async def get_weak_areas(
    ctx: AbstractAuthContext,
    course_id: str,
) -> CourseError.OnSuccess[list[dict]]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND

    materials = await ctx.course_materials.find_by_course_and_user(
        course_id, ctx.user.id
    )
    if not materials:
        return CourseError.NOT_FOUND

    # Aggregate quiz scores by subtopic
    subtopic_scores: dict[str, list[float]] = {}
    for mat in materials:
        if mat.type not in ("quiz", "multiple_choice"):
            continue
        mat_scores = await ctx.quiz_scores.find_by_material_and_user(
            mat.id, ctx.user.id
        )
        for sc in mat_scores:
            if sc.section_index < len(mat.data):
                title = mat.data[sc.section_index].title
                pct = (sc.score / sc.total * 100) if sc.total > 0 else 0
                subtopic_scores.setdefault(title, []).append(pct)

    weak: list[dict] = []
    for title, pcts in subtopic_scores.items():
        avg = sum(pcts) / len(pcts)
        if avg < 60:
            weak.append({"subtopic_title": title, "average_score_pct": round(avg, 1)})

    weak.sort(key=lambda x: x["average_score_pct"])
    return weak


async def generate_weak_area_practice(
    ctx: AbstractAuthContext,
    course_id: str,
    subtopic_title: str,
) -> CourseError.OnSuccess[list[CourseMaterialModel]]:
    prompt = f"Generate additional practice content to strengthen understanding of '{subtopic_title}'. Focus on common misconceptions and provide extra exercises."
    return await extend_course(ctx, course_id, prompt)


async def get_improvement_status(
    ctx: AbstractAuthContext,
    course_id: str,
) -> dict:
    improvement_key = f"{course_id}:{ctx.user.id}"
    return {"is_improving": improvement_key in _improving}


async def track_activity(
    ctx: AbstractAuthContext,
    course_id: str,
    material_id: str,
    section_index: int,
    material_type: str,
    time_spent_seconds: int,
    *,
    was_completed: bool,
) -> dict:
    material = await ctx.course_materials.find_by_id(material_id)
    if material is None or section_index >= len(material.data):
        return {"tracked": False}

    subtopic_title = material.data[section_index].title

    hard_skip = not was_completed and time_spent_seconds < _MIN_ENGAGE_SECONDS
    low_engagement_complete = (
        material_type in _LOW_ENGAGEMENT_MATERIAL_TYPES
        and was_completed
        and time_spent_seconds < _MIN_LECTURE_READ_SECONDS
    )

    if hard_skip or low_engagement_complete:
        logger.info(
            "Low-engagement activity detected, triggering improvement",
            extra={
                "course_id": course_id,
                "material_type": material_type,
                "time_spent_seconds": time_spent_seconds,
                "was_completed": was_completed,
                "subtopic_title": subtopic_title,
            },
        )
        asyncio.create_task(
            _auto_improve_content(ctx, course_id, ctx.user.id, subtopic_title)
        )
        return {"tracked": True, "improvement_triggered": True}

    return {"tracked": True, "improvement_triggered": False}


# ---------------------------------------------------------------------------
# Lazy generation
# ---------------------------------------------------------------------------

_IMPROVEMENT_SCORE_THRESHOLD = 0.6
_MIN_ENGAGE_SECONDS = 10
_MIN_LECTURE_READ_SECONDS = 30
_LOW_ENGAGEMENT_MATERIAL_TYPES = {"lecture", "spotlight"}
_IMPROVEMENT_COOLDOWN_SECONDS = 300
_MAX_SUBTOPICS = 20  # Cap lazy generation; courses beyond this are already comprehensive

# Simple in-memory state to prevent duplicate/spammy generation requests.
# In production these would be Redis keys, but for the hackathon this suffices.
_generating_ahead: set[str] = set()
_improving: set[str] = set()
_last_improved: dict[str, float] = {}


async def _auto_improve_content(
    ctx: AbstractAuthContext,
    course_id: str,
    user_id: str,
    subtopic_title: str,
) -> None:
    improvement_key = f"{course_id}:{user_id}"
    if improvement_key in _improving:
        return
    last_run = _last_improved.get(improvement_key, 0.0)
    if _time.time() - last_run < _IMPROVEMENT_COOLDOWN_SECONDS:
        logger.debug(
            "Skipping improvement — cooldown active",
            extra={"course_id": course_id, "user_id": user_id},
        )
        return
    _improving.add(improvement_key)
    try:
        logger.info(
            "Auto-improving content for weak subtopic",
            extra={"course_id": course_id, "subtopic_title": subtopic_title},
        )
        await generate_weak_area_practice(ctx, course_id, subtopic_title)
        logger.info(
            "Auto-improvement completed",
            extra={"course_id": course_id, "subtopic_title": subtopic_title},
        )
    except Exception:
        logger.exception(
            "Auto-improvement failed",
            extra={"course_id": course_id, "subtopic_title": subtopic_title},
        )
    finally:
        _improving.discard(improvement_key)
        _last_improved[improvement_key] = _time.time()


async def _check_and_generate_ahead(
    ctx: AbstractAuthContext,
    course_id: str,
    course: CourseModel,
    materials: list[CourseMaterialModel],
) -> None:
    """Check if the user is near the end of generated content and lazily generate more."""
    if course_id in _generating_ahead:
        return

    # Count unique subtopics and how many are unstarted
    all_subtopics: set[str] = set()
    started_subtopics: set[str] = set()
    for mat in materials:
        for section in mat.data:
            all_subtopics.add(section.title)
            if section.is_completed:
                started_subtopics.add(section.title)

    total_subtopics = len(all_subtopics)
    if total_subtopics >= _MAX_SUBTOPICS:
        logger.debug(
            "Skipping lazy generation — subtopic cap reached",
            extra={"course_id": course_id, "total_subtopics": total_subtopics, "cap": _MAX_SUBTOPICS},
        )
        return

    unstarted = len(all_subtopics - started_subtopics)
    if unstarted > 2:
        return  # Plenty of content remaining

    _generating_ahead.add(course_id)
    try:
        existing_titles = list(all_subtopics)
        remaining_budget = _MAX_SUBTOPICS - total_subtopics
        suggest_count = min(5, max(1, remaining_budget))
        subtopics_user_msg = (
            f"Course topic: {course.name}\n"
            f"Difficulty: {course.difficulty}\n"
            f"Existing subtopics: {json.dumps(existing_titles)}\n\n"
            f"Suggest exactly {suggest_count} NEW subtopic(s) that continue this course."
        )

        try:
            subtopics_completion = await ctx.openai.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": _SUBTOPICS_SYSTEM_PROMPT},
                    {"role": "user", "content": subtopics_user_msg},
                ],
                tools=[_SUBTOPICS_TOOL],
                tool_choice={"type": "function", "function": {"name": "submit_subtopics"}},
                temperature=0.7,
                max_completion_tokens=512,
            )
        except Exception:
            logger.exception("Lazy generation subtopics call failed")
            return

        subtopics_args = _extract_tool_args(subtopics_completion)
        if not subtopics_args:
            logger.warning("Lazy generation: no subtopics tool call returned")
            return

        new_subtopics: list[str] = subtopics_args.get("subtopics", [])
        if not new_subtopics:
            return

        logger.info(
            "Lazy generation: new subtopics selected",
            extra={"course_id": course_id, "new_subtopics": new_subtopics},
        )

        # Generate each material type in parallel using the Phase 2 approach
        existing_types = [mat.type for mat in materials]
        generation_tasks = [
            _generate_material_type(ctx, mt, course.name, course.difficulty, new_subtopics, course_id=course_id)
            for mt in existing_types
        ]
        results = await asyncio.gather(*generation_tasks, return_exceptions=True)

        for mat, result in zip(materials, results):
            if isinstance(result, (Exception, BaseException)) or result is None:
                continue

            sections_raw: list[dict] = result.get("sections", [])
            if mat.type == "fill_in_the_blank":
                sections_raw = _parse_fill_in_blank_sections(sections_raw)

            current_count = len(mat.data)
            new_sections: list[MaterialSectionModel] = []
            for i, section_raw in enumerate(sections_raw):
                material_data = _parse_section_material(mat.type, section_raw)
                if material_data is not None:
                    new_sections.append(
                        MaterialSectionModel(
                            index=current_count + i,
                            title=section_raw.get(
                                "title", f"Section {current_count + i + 1}"
                            ),
                            material=material_data,
                            is_completed=False,
                        ),
                    )
            if new_sections:
                await ctx.course_materials.append_sections(mat.id, new_sections)

        logger.info("Lazy generation completed", extra={"course_id": course_id})
    except Exception:
        logger.exception("Lazy generation failed", extra={"course_id": course_id})
    finally:
        _generating_ahead.discard(course_id)


async def get_public_courses(
    ctx: AbstractAuthContext,
    *,
    limit: int = 40,
    offset: int = 0,
) -> CourseError.OnSuccess[list[CourseModel]]:
    all_public = await ctx.courses.find_public(limit=limit, offset=offset)
    user_assigns = await ctx.course_assigns.find_by_user_id(ctx.user.id)
    enrolled_ids = {a.course_id for a in user_assigns}
    return [c for c in all_public if c.id not in enrolled_ids]


async def enrol_in_course(
    ctx: AbstractAuthContext,
    course_id: str,
) -> CourseError.OnSuccess[CourseModel]:
    course = await ctx.courses.find_by_id(course_id)
    if course is None:
        return CourseError.NOT_FOUND
    if course.publicity is not CoursePublicity.PUBLIC:
        return CourseError.NOT_FOUND

    existing = await ctx.course_assigns.find_by_course_and_user(course_id, ctx.user.id)
    if existing is not None:
        return course

    owner_materials = await ctx.course_materials.find_by_course_id(course_id)
    seen_types: set[str] = set()
    source_materials: list[CourseMaterialModel] = []
    for mat in owner_materials:
        if mat.type not in seen_types:
            seen_types.add(mat.type)
            source_materials.append(mat)

    for mat in source_materials:
        fresh_sections = [
            MaterialSectionModel(
                index=s.index,
                title=s.title,
                material=s.material,
                is_completed=False,
            )
            for s in mat.data
        ]
        await ctx.course_materials.create(
            course_id=course_id,
            user_id=ctx.user.id,
            material_type=mat.type,
            data=fresh_sections,
            title=mat.title,
            description=mat.description,
            is_visible=mat.is_visible,
        )

    await ctx.course_assigns.create(
        course_id=course_id,
        user_id=ctx.user.id,
        relationship=CourseAssignRelationship.ASSIGNEE,
    )

    logger.info(
        "User enrolled in public course",
        extra={"course_id": course_id, "user_id": ctx.user.id},
    )
    return course
