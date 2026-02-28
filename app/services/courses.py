from __future__ import annotations

import json
import re
from typing import override

from fastapi import status

from app import settings
import asyncio

from app.resources.course import JOURNEY_STEP_ORDER
from app.resources.course import CaseStudyModel
from app.resources.course import CaseStudyQuestionModel
from app.resources.course import CourseAssignRelationship
from app.resources.course import CourseDifficulty
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


_PHASE1_SYSTEM_PROMPT = """You are a course content generator. You create educational course materials in structured JSON format.

You MUST respond with ONLY valid JSON, no markdown fences, no explanation text. Just the raw JSON object.

Generate the course metadata and detailed lecture content. Choose 5-8 subtopics for the course. These subtopics will be reused across all material types.

The JSON must follow this exact structure:
{
  "name": "Course Name",
  "description": "A 1-2 sentence course description",
  "colour": "#hex",
  "estimated_hours": 3,
  "tags": ["tag1", "tag2", "tag3"],
  "subtopics": ["Subtopic A", "Subtopic B", "Subtopic C", "Subtopic D", "Subtopic E"],
  "lecture": {
    "title": "Course Lectures",
    "description": "In-depth explanations and teaching material",
    "sections": [
      {
        "title": "Subtopic A",
        "content": "## Subtopic A\\n\\nDetailed markdown lecture content..."
      }
    ]
  }
}

Rules:
- Pick a visually appealing hex colour that represents the course topic (avoid purple/violet)
- Generate 5-8 subtopics — list them all in the "subtopics" array
- Create a lecture section for EACH subtopic
- Lectures should use rich markdown: headers, **bold**, *italics*, bullet lists, numbered lists, code blocks where appropriate
- Write detailed, thorough lectures — vary length naturally (short for simple concepts, long for complex ones)
- Each lecture should teach the subtopic fully with examples, analogies, and key takeaways
- Content should match the requested difficulty level
- estimated_hours should be reasonable (1-20)
- Tags should be relevant keywords (3-6 tags)"""


_MATERIAL_GENERATION_PROMPTS: dict[str, str] = {
    "flashcards": """You are a flashcard generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate flashcards for the given subtopics. Create AS MANY flashcards as you can for each subtopic — the minimum is 15 per subtopic, but generate more if you can. Cover every important concept, term, fact, and relationship.

Output format:
{
  "title": "Key Concepts Flashcards",
  "description": "Essential terms and concepts to remember",
  "sections": [
    {
      "title": "Subtopic Name",
      "flashcards": [
        {"question": "What is X?", "answer": "X is..."},
        {"question": "Define Y", "answer": "Y means..."}
      ]
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- At least 15 flashcards per section — MORE IS BETTER. Generate as many as you can fit.
- Cover definitions, facts, comparisons, cause-effect relationships, examples
- Questions should be clear and concise; answers should be informative but brief
- Match the difficulty level specified""",
    "quiz": """You are a quiz question generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate quiz questions for the given subtopics. Create AS MANY questions as you can for each subtopic — the minimum is 15 per subtopic, but generate more if you can.

Output format:
{
  "title": "Knowledge Check Quiz",
  "description": "Test your understanding of the material",
  "sections": [
    {
      "title": "Subtopic Name",
      "questions": [
        {
          "question": "What is the correct answer?",
          "answers": [
            {"answer": "Wrong answer A", "is_correct": false},
            {"answer": "Correct answer", "is_correct": true},
            {"answer": "Wrong answer B", "is_correct": false},
            {"answer": "Wrong answer C", "is_correct": false}
          ]
        }
      ]
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- At least 15 questions per section — MORE IS BETTER. Generate as many as you can fit.
- Each question MUST have exactly 4 answers with exactly ONE correct
- Vary question types: recall, application, analysis, comparison
- Wrong answers should be plausible distractors
- Match the difficulty level specified""",
    "fill_in_the_blank": """You are a fill-in-the-blank exercise generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate fill-in-the-blank exercises for the given subtopics. Create AS MANY exercises as you can per subtopic — the minimum is 15 per subtopic, but generate more if you can.

Output format:
{
  "title": "Fill in the Blanks",
  "description": "Complete the sentences with the correct words",
  "sections": [
    {
      "title": "Subtopic Name",
      "exercises": [
        {
          "question": "The ___ is the powerhouse of the ___.",
          "answers": ["mitochondria", "cell"]
        }
      ]
    }
  ]
}

CRITICAL: The output uses an "exercises" array where each element has "question" and "answers" fields.

Rules:
- One section per subtopic, using the exact subtopic titles provided
- At least 15 exercises per section — MORE IS BETTER. Generate as many as you can fit.
- Each blank is represented by three underscores: ___
- The number of ___ in each question MUST match the number of answers
- Exercises should test key vocabulary, relationships, and concepts
- Match the difficulty level specified""",
    "multiple_choice": """You are a multiple-choice (multi-select) question generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate multi-select questions for the given subtopics. Create AS MANY questions as you can per subtopic — the minimum is 15 per subtopic, but generate more if you can.

Output format:
{
  "title": "Multi-Select Questions",
  "description": "Select all correct answers for each question",
  "sections": [
    {
      "title": "Subtopic Name",
      "questions": [
        {
          "question": "Select all that apply: Which of these are correct?",
          "answers": [
            {"answer": "Correct answer A", "is_correct": true},
            {"answer": "Wrong answer B", "is_correct": false},
            {"answer": "Correct answer C", "is_correct": true},
            {"answer": "Wrong answer D", "is_correct": false}
          ]
        }
      ]
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- At least 15 questions per section — MORE IS BETTER. Generate as many as you can fit.
- Each question should have 4-5 answers with at least 1 correct answer
- Label questions with "Select all that apply:"
- Test deeper understanding: combinations, relationships, classifications
- Match the difficulty level specified""",
    "matching": """You are a matching exercise generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate matching exercises for the given subtopics. Create 8-12 pairs per subtopic where students match items from two columns.

Output format:
{
  "title": "Matching Exercises",
  "description": "Match the related items together",
  "sections": [
    {
      "title": "Subtopic Name",
      "pairs": [
        {"left": "Term A", "right": "Definition of A"},
        {"left": "Cause X", "right": "Effect of X"}
      ],
      "instruction": "Match each term with its definition"
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- 8-12 pairs per section
- Pairs can be term↔definition, cause↔effect, concept↔example, date↔event, etc.
- Left and right items should be concise (1-2 sentences max)
- Include a clear instruction for each section
- Match the difficulty level specified""",
    "ordering": """You are an ordering exercise generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate ordering exercises for the given subtopics. Create 5-8 items per subtopic that must be arranged in the correct sequence.

Output format:
{
  "title": "Ordering Challenges",
  "description": "Arrange the items in the correct order",
  "sections": [
    {
      "title": "Subtopic Name",
      "items": ["First step", "Second step", "Third step", "Fourth step", "Fifth step"],
      "instruction": "Arrange these steps in chronological order"
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- 5-8 items per section, stored in the CORRECT order
- Items can be chronological steps, procedural stages, ranked importance, etc.
- Each item should be concise (1 sentence)
- Include a clear instruction for each section
- Match the difficulty level specified""",
    "true_false": """You are a true/false question generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate true/false statements for the given subtopics. Create 12-15 statements per subtopic.

Output format:
{
  "title": "True or False",
  "description": "Determine whether each statement is true or false",
  "sections": [
    {
      "title": "Subtopic Name",
      "statements": [
        {"statement": "The Earth revolves around the Sun.", "is_true": true, "explanation": "The Earth orbits the Sun once every 365.25 days."},
        {"statement": "Water boils at 50°C at sea level.", "is_true": false, "explanation": "Water boils at 100°C (212°F) at sea level."}
      ]
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- 12-15 statements per section
- Statements MUST be unambiguous — clearly true or clearly false
- Every statement needs a brief explanation (1-2 sentences)
- Aim for roughly 50/50 split between true and false
- Match the difficulty level specified""",
    "case_study": """You are a case study generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate case studies for the given subtopics. Create 1 scenario (200-400 words) with 3-4 discussion questions per subtopic.

Output format:
{
  "title": "Case Studies",
  "description": "Apply your knowledge to real-world scenarios",
  "sections": [
    {
      "title": "Subtopic Name",
      "scenario": "## The Scenario Title\\n\\nDetailed markdown scenario text describing a real-world situation...",
      "questions": [
        {"question": "What factors contributed to the outcome?", "sample_answer": "The key factors were..."},
        {"question": "How would you approach this differently?", "sample_answer": "An alternative approach would be..."}
      ]
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- Scenario should be 200-400 words in markdown format
- 3-4 discussion questions per scenario with sample answers
- Scenarios should feel realistic and relatable
- Questions should test higher-order thinking: analysis, evaluation, application
- Match the difficulty level specified""",
    "sorting": """You are a sorting/categorisation exercise generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate sorting exercises for the given subtopics. Create 2-4 categories with 3-6 items each per subtopic.

Output format:
{
  "title": "Sorting Exercises",
  "description": "Sort the items into the correct categories",
  "sections": [
    {
      "title": "Subtopic Name",
      "instruction": "Sort these items into the correct categories",
      "categories": [
        {"name": "Category A", "items": ["Item 1", "Item 2", "Item 3"]},
        {"name": "Category B", "items": ["Item 4", "Item 5", "Item 6"]}
      ]
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- 2-4 categories per section with 3-6 items each
- Categories should be meaningful classifications related to the subtopic
- Items should clearly belong to one category only
- Include a clear instruction for each section
- Match the difficulty level specified""",
    "spotlight": """You are a spotlight content generator for an educational course. You MUST respond with ONLY valid JSON, no markdown fences. Just the raw JSON object.

Generate spotlight highlights (fun facts, tips, mnemonics, and analogies) for the given subtopics. Create 4-6 highlights per subtopic.

Output format:
{
  "title": "Spotlight",
  "description": "Fun facts, tips, and memory aids",
  "sections": [
    {
      "title": "Subtopic Name",
      "highlights": [
        {"type": "fact", "content": "Did you know? An interesting fact about..."},
        {"type": "tip", "content": "Pro tip: A useful tip for..."},
        {"type": "mnemonic", "content": "Remember: A memory aid for..."},
        {"type": "analogy", "content": "Think of it like: An analogy for..."}
      ]
    }
  ]
}

Rules:
- One section per subtopic, using the exact subtopic titles provided
- 4-6 highlights per section
- Use a mix of types: "fact", "tip", "mnemonic", "analogy"
- Facts should be surprising or memorable
- Tips should be practical and actionable
- Mnemonics should be catchy and easy to remember
- Analogies should relate to everyday experiences
- Match the difficulty level specified""",
}


_EXPLANATION_SYSTEM_PROMPT = """You are a friendly educational tutor. A student got a question wrong. Explain why the correct answer is right and why their choice was wrong. Keep it brief (2-4 sentences), encouraging, and educational. Do not repeat the question — jump straight into the explanation."""


_EXTENSION_SYSTEM_PROMPT = """You are a course content extender. Given the existing section titles of a course material and a user prompt, generate 1-3 NEW sections that complement the existing content.

You MUST respond with ONLY valid JSON, no markdown fences, no explanation text. Just the raw JSON array.

The JSON must be an array of section objects matching the format for the material type specified. Do NOT repeat existing section titles."""


def _build_user_prompt(
    topic: str,
    difficulty: CourseDifficulty,
    course_type: CourseType,
    additional_details: str | None,
) -> str:
    prompt = (
        f"Create a {difficulty.value} level {course_type.value} course about: {topic}"
    )
    if additional_details:
        prompt += f"\n\nAdditional details from the student: {additional_details}"
    return prompt


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences if the model wraps its JSON in them."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


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

# Featherless.ai limits concurrent requests to 4; use 3 to leave headroom
_LLM_SEMAPHORE = asyncio.Semaphore(3)


async def _generate_material_type(
    ctx: AbstractAuthContext,
    material_type: str,
    topic: str,
    difficulty: CourseDifficulty,
    subtopics: list[str],
) -> dict | None:
    """Generate a single material type using its own dedicated LLM call.

    Retries up to _MATERIAL_GENERATION_MAX_RETRIES times with exponential
    back-off to handle rate limits when multiple calls run in parallel.
    """
    system_prompt = _MATERIAL_GENERATION_PROMPTS.get(material_type)
    if not system_prompt:
        return None

    user_msg = (
        f"Course topic: {topic}\n"
        f"Difficulty: {difficulty.value}\n"
        f"Subtopics (generate one section for each): {json.dumps(subtopics)}\n\n"
        f"Generate as much content as possible for every subtopic."
    )

    import time as _time

    last_error: Exception | None = None
    for attempt in range(_MATERIAL_GENERATION_MAX_RETRIES):
        try:
            logger.info(
                "LLM call starting",
                extra={
                    "material_type": material_type,
                    "attempt": attempt + 1,
                    "model": settings.OPENAI_MODEL,
                    "subtopic_count": len(subtopics),
                },
            )
            t0 = _time.monotonic()
            async with _LLM_SEMAPHORE:
                logger.info(
                    "LLM semaphore acquired",
                    extra={"material_type": material_type, "wait_s": round(_time.monotonic() - t0, 2)},
                )
                t1 = _time.monotonic()
                completion = await ctx.openai.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                    temperature=0.7,
                    max_tokens=16384,
                )
            elapsed = round(_time.monotonic() - t1, 2)
            usage = completion.usage
            logger.info(
                "LLM call completed",
                extra={
                    "material_type": material_type,
                    "elapsed_s": elapsed,
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
                "Material generation attempt failed, retrying",
                extra={
                    "material_type": material_type,
                    "attempt": attempt + 1,
                    "max_retries": _MATERIAL_GENERATION_MAX_RETRIES,
                    "retry_delay": delay,
                },
            )
            await asyncio.sleep(delay)
    else:
        logger.error(
            "Material generation failed after all retries",
            extra={"material_type": material_type},
            exc_info=last_error,
        )
        return None

    raw = completion.choices[0].message.content
    if not raw:
        logger.warning(
            "LLM returned empty content",
            extra={"material_type": material_type},
        )
        return None

    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
    logger.info(
        "Parsing LLM response",
        extra={"material_type": material_type, "response_length": len(raw)},
    )
    try:
        cleaned = _strip_markdown_fences(raw)
        parsed = json.loads(cleaned)
        logger.info(
            "Material JSON parsed successfully",
            extra={"material_type": material_type, "keys": list(parsed.keys()) if isinstance(parsed, dict) else "array"},
        )
        return parsed
    except json.JSONDecodeError:
        logger.exception(
            "Failed to parse material JSON",
            extra={"material_type": material_type, "raw_preview": raw[:300]},
        )
        return None


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
    mat_data: dict,
) -> CourseMaterialModel | None:
    """Parse raw AI material data and create the material in the database."""
    sections_raw = mat_data.get("sections", [])

    if material_type == "fill_in_the_blank":
        sections_raw = _parse_fill_in_blank_sections(sections_raw)

    parsed_sections: list[MaterialSectionModel] = []
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

    if not parsed_sections:
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
) -> CourseError.OnSuccess[tuple[CourseModel, list[CourseMaterialModel]]]:
    user_prompt = _build_user_prompt(topic, difficulty, course_type, additional_details)

    logger.info(
        "Generating course via AI (phase 1: metadata + lectures)",
        extra={
            "topic": topic,
            "difficulty": difficulty.value,
            "model": settings.OPENAI_MODEL,
        },
    )

    # ── Phase 1: Generate metadata + subtopics + lectures ──
    import time as _time

    logger.info("Phase 1 LLM call starting", extra={"model": settings.OPENAI_MODEL})
    t0 = _time.monotonic()
    try:
        completion = await ctx.openai.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _PHASE1_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=16384,
        )
    except Exception:
        logger.exception("Phase 1 LLM API call failed")
        return CourseError.GENERATION_FAILED

    elapsed = round(_time.monotonic() - t0, 2)
    usage = completion.usage
    logger.info(
        "Phase 1 LLM call completed",
        extra={
            "elapsed_s": elapsed,
            "prompt_tokens": usage.prompt_tokens if usage else None,
            "completion_tokens": usage.completion_tokens if usage else None,
            "total_tokens": usage.total_tokens if usage else None,
        },
    )

    raw_content = completion.choices[0].message.content
    if not raw_content:
        logger.error("Phase 1 LLM returned empty content")
        return CourseError.GENERATION_FAILED

    raw_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL)
    logger.info(
        "Phase 1 response received",
        extra={"response_length": len(raw_content)},
    )

    try:
        cleaned = _strip_markdown_fences(raw_content)
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.exception(
            "Failed to parse phase 1 AI response", extra={"raw": raw_content[:500]}
        )
        return CourseError.INVALID_AI_RESPONSE

    required_keys = {"name", "description", "estimated_hours", "tags", "subtopics", "lecture"}
    if not required_keys.issubset(data.keys()):
        logger.error(
            "Phase 1 response missing keys", extra={"keys": list(data.keys())}
        )
        return CourseError.INVALID_AI_RESPONSE

    subtopics: list[str] = data["subtopics"]
    logger.info(
        "Phase 1 parsed successfully",
        extra={"subtopic_count": len(subtopics), "subtopics": subtopics},
    )

    # Create the course
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
        )
    except Exception:
        logger.exception("Failed to create course in database")
        return CourseError.GENERATION_FAILED

    await ctx.course_assigns.create(
        course_id=course.id,
        user_id=ctx.user.id,
        relationship=CourseAssignRelationship.PERSONAL,
    )

    # Save lectures
    materials: list[CourseMaterialModel] = []
    lecture_mat = await _create_material_from_data(
        ctx, course.id, ctx.user.id, "lecture", data["lecture"],
    )
    if lecture_mat:
        materials.append(lecture_mat)

    # ── Phase 2: Generate 10 material types in parallel ──
    logger.info(
        "Generating course via AI (phase 2: 10 material types in parallel)",
        extra={"course_id": course.id, "subtopics": subtopics},
    )

    material_types: list[CourseMaterialType] = [
        "flashcards", "quiz", "fill_in_the_blank", "multiple_choice",
        "matching", "ordering", "true_false", "case_study", "sorting", "spotlight",
    ]
    generation_tasks = [
        _generate_material_type(ctx, mt, topic, difficulty, subtopics)
        for mt in material_types
    ]
    t2 = _time.monotonic()
    results = await asyncio.gather(*generation_tasks, return_exceptions=True)
    phase2_elapsed = round(_time.monotonic() - t2, 2)
    logger.info(
        "Phase 2 all LLM calls finished",
        extra={"course_id": course.id, "elapsed_s": phase2_elapsed},
    )

    for mt, result in zip(material_types, results):
        if isinstance(result, (Exception, BaseException)):
            logger.error(
                "Material generation raised exception",
                extra={"material_type": mt},
                exc_info=result,
            )
            continue
        if result is None:
            logger.warning(
                "Material generation returned None",
                extra={"material_type": mt, "course_id": course.id},
            )
            continue
        mat = await _create_material_from_data(ctx, course.id, ctx.user.id, mt, result)
        if mat:
            logger.info(
                "Material saved to database",
                extra={"material_type": mt, "section_count": len(mat.data)},
            )
            materials.append(mat)

    total_elapsed = round(_time.monotonic() - t0, 2)
    logger.info(
        "Course generated successfully",
        extra={
            "course_id": course.id,
            "course_name": course.name,
            "total_elapsed_s": total_elapsed,
            "material_count": len(materials),
        },
    )
    return course, materials


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
            max_tokens=512,
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
        existing_titles = [s.title for s in mat.data]
        current_count = len(mat.data)

        # Build type-specific format hint
        match mat.type:
            case "lecture":
                format_hint = '{"title": "...", "content": "## markdown..."}'
            case "flashcards":
                format_hint = '{"title": "...", "flashcards": [{"question": "...", "answer": "..."}]}'
            case "quiz":
                format_hint = '{"title": "...", "questions": [{"question": "...", "answers": [{"answer": "...", "is_correct": true/false}]}]}'
            case "fill_in_the_blank":
                format_hint = '{"title": "...", "question": "The ___ is ...", "answers": ["word"]}'
            case "multiple_choice":
                format_hint = '{"title": "...", "questions": [{"question": "Select all that apply: ...", "answers": [{"answer": "...", "is_correct": true/false}]}]}'
            case "matching":
                format_hint = '{"title": "...", "pairs": [{"left": "...", "right": "..."}], "instruction": "..."}'
            case "ordering":
                format_hint = '{"title": "...", "items": ["step1", "step2", ...], "instruction": "..."}'
            case "true_false":
                format_hint = '{"title": "...", "statements": [{"statement": "...", "is_true": true/false, "explanation": "..."}]}'
            case "case_study":
                format_hint = '{"title": "...", "scenario": "## markdown...", "questions": [{"question": "...", "sample_answer": "..."}]}'
            case "sorting":
                format_hint = '{"title": "...", "instruction": "...", "categories": [{"name": "...", "items": ["...", "..."]}]}'
            case "spotlight":
                format_hint = '{"title": "...", "highlights": [{"type": "fact|tip|mnemonic|analogy", "content": "..."}]}'
            case _:
                continue

        user_msg = (
            f"Material type: {mat.type}\n"
            f"Existing section titles: {json.dumps(existing_titles)}\n"
            f"Course topic: {course.name}\n"
            f"User request: {prompt}\n\n"
            f"Generate 1-3 new sections as a JSON array. Each section format: {format_hint}"
        )

        try:
            completion = await ctx.openai.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": _EXTENSION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.7,
                max_tokens=4096,
            )
        except Exception:
            logger.exception(
                "Extension LLM call failed", extra={"material_type": mat.type}
            )
            continue

        raw = completion.choices[0].message.content
        if not raw:
            continue

        raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
        try:
            cleaned = _strip_markdown_fences(raw)
            sections_data = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.exception(
                "Failed to parse extension JSON", extra={"material_type": mat.type}
            )
            continue

        if not isinstance(sections_data, list):
            continue

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
# Track suggestion prompt
# ---------------------------------------------------------------------------

_TRACK_SUGGESTION_PROMPT = """You are a learning advisor. Given a student's course data and quiz performance, suggest 2-3 specialisation tracks they could pursue to deepen their knowledge.

You MUST respond with ONLY valid JSON, no markdown fences, no explanation text. Just the raw JSON array.

Each track should be:
[
  {
    "title": "Track Title",
    "description": "A 1-2 sentence description of what this track covers",
    "subtopics": ["Subtopic A", "Subtopic B", "Subtopic C"]
  }
]

Make tracks diverse — one could go deeper into strong areas, one could strengthen weak areas, and one could explore related topics."""


_CONTINUATION_PROMPT = """You are a course content extender. Given an existing course's topic, difficulty, and current subtopic titles, generate NEW subtopics that naturally continue the learning path.

You MUST respond with ONLY valid JSON, no markdown fences, no explanation text. Just the raw JSON object.

Generate content for 3-5 NEW subtopics. Each subtopic needs ALL ELEVEN material types. Use this exact structure:
{
  "materials": {
    "lecture": {"sections": [{"title": "New Subtopic", "content": "## markdown..."}]},
    "flashcards": {"sections": [{"title": "New Subtopic", "flashcards": [{"question": "...", "answer": "..."}]}]},
    "quiz": {"sections": [{"title": "New Subtopic", "questions": [{"question": "...", "answers": [{"answer": "...", "is_correct": true/false}]}]}]},
    "fill_in_the_blank": {"sections": [{"title": "New Subtopic", "question": "The ___ is ...", "answers": ["word"]}]},
    "multiple_choice": {"sections": [{"title": "New Subtopic", "questions": [{"question": "Select all that apply: ...", "answers": [{"answer": "...", "is_correct": true/false}]}]}]},
    "matching": {"sections": [{"title": "New Subtopic", "pairs": [{"left": "...", "right": "..."}], "instruction": "..."}]},
    "ordering": {"sections": [{"title": "New Subtopic", "items": ["step1", "step2"], "instruction": "..."}]},
    "true_false": {"sections": [{"title": "New Subtopic", "statements": [{"statement": "...", "is_true": true, "explanation": "..."}]}]},
    "case_study": {"sections": [{"title": "New Subtopic", "scenario": "## markdown...", "questions": [{"question": "...", "sample_answer": "..."}]}]},
    "sorting": {"sections": [{"title": "New Subtopic", "instruction": "...", "categories": [{"name": "...", "items": ["...", "..."]}]}]},
    "spotlight": {"sections": [{"title": "New Subtopic", "highlights": [{"type": "fact", "content": "..."}]}]}
  }
}

Rules:
- Do NOT repeat any existing subtopic titles
- Build on what was already covered — go deeper or explore adjacent concepts
- Keep the same difficulty level
- Generate at least 4 flashcards, 3 quiz questions, 2 fill-in-blank, 3 multiple-choice questions, 6 matching pairs, 5 ordering items, 8 true/false statements, 1 case study with 3 questions, 2 sorting categories, and 4 spotlight highlights per subtopic"""


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
        return CourseError.NOT_FOUND

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
                {"role": "system", "content": _TRACK_SUGGESTION_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.7,
            max_tokens=2048,
        )
    except Exception:
        logger.exception("Track suggestion LLM call failed")
        return CourseError.GENERATION_FAILED

    raw = completion.choices[0].message.content
    if not raw:
        return CourseError.GENERATION_FAILED

    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
    try:
        cleaned = _strip_markdown_fences(raw)
        tracks = json.loads(cleaned)
    except json.JSONDecodeError:
        return CourseError.INVALID_AI_RESPONSE

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


# ---------------------------------------------------------------------------
# Lazy generation
# ---------------------------------------------------------------------------

# Simple in-memory set to prevent duplicate generation requests.
# In production this would be a Redis key, but for the hackathon this suffices.
_generating_ahead: set[str] = set()


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

    unstarted = len(all_subtopics - started_subtopics)
    if unstarted > 2:
        return  # Plenty of content remaining

    _generating_ahead.add(course_id)
    try:
        existing_titles = list(all_subtopics)
        user_msg = (
            f"Course topic: {course.name}\n"
            f"Difficulty: {course.difficulty}\n"
            f"Existing subtopics: {json.dumps(existing_titles)}\n\n"
            f"Generate 3-5 NEW subtopics that continue this course."
        )

        try:
            completion = await ctx.openai.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": _CONTINUATION_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.7,
                max_tokens=8192,
            )
        except Exception:
            logger.exception("Lazy generation LLM call failed")
            return

        raw = completion.choices[0].message.content
        if not raw:
            return

        raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
        try:
            cleaned = _strip_markdown_fences(raw)
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.exception("Failed to parse lazy generation JSON")
            return

        new_materials = data.get("materials", {})

        for mat in materials:
            if mat.type not in new_materials:
                continue
            new_sections_raw = new_materials[mat.type].get("sections", [])
            current_count = len(mat.data)
            new_sections: list[MaterialSectionModel] = []
            for i, section_raw in enumerate(new_sections_raw):
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
