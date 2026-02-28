import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type {
  LessonEngagementSession,
  SectionEngagement,
  ContentAdjustment,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// Struggle score computation  (deterministic, runs before LLM)
// ---------------------------------------------------------------------------

function computeStruggleScore(
  section: SectionEngagement,
  hintsTotal: number,
  totalSections: number
): number {
  let score = 0

  const dwellMin = section.timeVisibleMs / 60_000
  if (dwellMin > 4) score += 30
  else if (dwellMin > 2) score += 15

  const revisits = Math.max(0, section.revisitCount - 1)
  if (revisits >= 3) score += 30
  else if (revisits >= 2) score += 20
  else if (revisits >= 1) score += 10

  const failedComponents = section.componentInteractions.filter((i) => !i.success)
  const repeatedFailures = section.componentInteractions.filter(
    (i) => !i.success && i.attemptCount >= 3
  )
  score += failedComponents.length * 15
  score += repeatedFailures.length * 15

  const hintsPerSection = totalSections > 0 ? hintsTotal / totalSections : 0
  if (hintsPerSection >= 2) score += 20
  else if (hintsPerSection >= 1) score += 10

  return Math.min(100, Math.round(score))
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(
  session: LessonEngagementSession,
  struggling: Array<{ section: SectionEngagement; score: number }>
): string {
  const sessionDurationMin = (session.endedAt - session.startedAt) / 60_000

  const sectionLines = struggling.map(({ section, score }) => {
    const dwellMin = (section.timeVisibleMs / 60_000).toFixed(1)
    const revisits = Math.max(0, section.revisitCount - 1)
    const interactions = section.componentInteractions
      .map((ci) => {
        const status = ci.success ? "PASSED" : `FAILED (${ci.attemptCount} attempts)`
        return `    - ${ci.componentType} [${ci.componentId.slice(-8)}]: ${status}`
      })
      .join("\n")

    const signals: string[] = []
    if (parseFloat(dwellMin) > 3) signals.push("high dwell time")
    if (revisits >= 2) signals.push(`re-read ${revisits} times`)
    if (section.componentInteractions.some((i) => !i.success))
      signals.push("component failures")

    return [
      `SECTION: "${section.sectionTitle}" (struggle score: ${score}/100)`,
      `  Dwell time: ${dwellMin}m`,
      `  Re-reads: ${revisits}`,
      interactions ? `  Component interactions:\n${interactions}` : "  No components attempted",
      `  Key signals: ${signals.join(", ") || "moderate difficulty"}`,
    ].join("\n")
  })

  return [
    "Student engagement session:",
    `  Total duration: ${sessionDurationMin.toFixed(1)} minutes`,
    `  Scroll depth: ${session.scrollDepthPct.toFixed(0)}%`,
    `  AI hints requested: ${session.hintsRequested}`,
    `  Total sections: ${session.sections.length}`,
    "",
    `Sections where the student struggled (${struggling.length} of ${session.sections.length}):`,
    "",
    sectionLines.join("\n\n"),
  ].join("\n")
}

// ---------------------------------------------------------------------------
// LLM call with structured output
// ---------------------------------------------------------------------------

const LLM_SYSTEM_PROMPT = `You are Mentova AI, an adaptive learning assistant analyzing how a student interacted with a lesson.

Your task: given engagement signals for sections the student found difficult, generate personalized learning insights.

Rules:
- Suggestions must be specific, actionable, and encouraging (not generic)
- Reference the section's subject matter based on its title — be concrete
- For high-struggle sections (score >= 50), write a clear simplified explanation or analogy in additionalContent (markdown ok)
- Keep each suggestion to 1–2 sentences
- Return exactly the sections provided — do not add or remove any

Respond ONLY with valid JSON matching this schema (no markdown, no extra text):
{
  "adjustments": [
    {
      "sectionId": "<string>",
      "sectionTitle": "<string>",
      "struggleScore": <number 0-100>,
      "suggestions": ["<string>", "<string>"],
      "additionalContent": "<markdown string or null>"
    }
  ]
}`

interface LLMAdjustment {
  sectionId: string
  sectionTitle: string
  struggleScore: number
  suggestions: string[]
  additionalContent?: string | null
}

interface LLMResponse {
  adjustments: LLMAdjustment[]
}

async function enrichWithLLM(
  session: LessonEngagementSession,
  struggling: Array<{ section: SectionEngagement; score: number }>
): Promise<ContentAdjustment[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return []

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL, // optional — supports any OpenAI-compatible API
  })

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini"
  const userPrompt = buildPrompt(session, struggling)

  const response = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: LLM_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? ""
  const parsed = JSON.parse(raw) as LLMResponse

  return (parsed.adjustments ?? []).map((adj) => ({
    sectionId: adj.sectionId,
    sectionTitle: adj.sectionTitle,
    struggleScore: adj.struggleScore,
    suggestions: adj.suggestions ?? [],
    ...(adj.additionalContent ? { additionalContent: adj.additionalContent } : {}),
  }))
}

// ---------------------------------------------------------------------------
// Fallback: rule-based suggestions (no LLM)
// ---------------------------------------------------------------------------

function ruleBasedAdjustments(
  session: LessonEngagementSession,
  struggling: Array<{ section: SectionEngagement; score: number }>
): ContentAdjustment[] {
  return struggling.map(({ section, score }) => {
    const suggestions: string[] = []
    const dwellMin = section.timeVisibleMs / 60_000
    const revisits = Math.max(0, section.revisitCount - 1)
    const failed = section.componentInteractions.filter((i) => !i.success)

    if (dwellMin > 3)
      suggestions.push(
        "You spent extra time here — try re-reading with focus on the key terms first, then the examples."
      )
    if (revisits >= 2)
      suggestions.push(
        "You revisited this section several times. Try summarising the main idea in your own words."
      )
    if (failed.some((i) => i.componentType === "Quiz"))
      suggestions.push(
        "Review the paragraph right before the quiz — the answer is grounded in a specific concept there."
      )
    if (failed.some((i) => i.componentType === "CodeExercise"))
      suggestions.push(
        "Break the problem into smaller steps: pseudocode first, then translate step by step."
      )
    if (section.componentInteractions.some((i) => i.attemptCount >= 3))
      suggestions.push(
        "Multiple attempts detected — check prerequisite sections or ask the AI tutor for a targeted hint."
      )
    if (session.hintsRequested > 0 && suggestions.length === 0)
      suggestions.push(
        "You used the AI tutor — try to articulate why the hint pointed you in that direction."
      )
    if (suggestions.length === 0)
      suggestions.push(
        "This section seemed challenging. A short break before re-reading often helps with retention."
      )

    const adjustment: ContentAdjustment = { sectionId: section.sectionId, sectionTitle: section.sectionTitle, struggleScore: score, suggestions }
    if (score >= 50) {
      adjustment.additionalContent = [
        `**Simplified recap — "${section.sectionTitle}"**`,
        "",
        "When a concept feels difficult, zoom out and ask: *what problem is this trying to solve?* Once you see the motivation, the details tend to fall into place.",
        "",
        "Try explaining the core idea as if teaching someone with no background. If you can do that, you've understood it. If you can't, you've found the exact gap to close.",
      ].join("\n")
    }
    return adjustment
  })
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const session = (await req.json()) as LessonEngagementSession

    // Proxy to dedicated external backend when configured
    const externalApiUrl = process.env.NEXT_PUBLIC_API_URL
    if (externalApiUrl) {
      const res = await fetch(`${externalApiUrl}/api/analytics/engagement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_SECRET_KEY ?? ""}`,
        },
        body: JSON.stringify(session),
      })
      if (res.ok) {
        return NextResponse.json(await res.json())
      }
    }

    // Compute deterministic struggle scores
    const struggling = session.sections
      .map((section) => ({
        section,
        score: computeStruggleScore(section, session.hintsRequested, session.sections.length),
      }))
      .filter(({ score }) => score >= 20)
      .sort((a, b) => b.score - a.score)

    if (struggling.length === 0) {
      return NextResponse.json({ received: true, adjustments: [] })
    }

    // Try LLM enrichment, fall back to rule-based on failure
    let adjustments: ContentAdjustment[]
    try {
      const llmResult = await enrichWithLLM(session, struggling)
      adjustments = llmResult.length > 0 ? llmResult : ruleBasedAdjustments(session, struggling)
    } catch (llmError) {
      console.error("[engagement] LLM enrichment failed, using rule-based fallback:", llmError)
      adjustments = ruleBasedAdjustments(session, struggling)
    }

    return NextResponse.json({ received: true, adjustments })
  } catch {
    return NextResponse.json(
      { error: "Failed to process engagement data" },
      { status: 500 }
    )
  }
}
