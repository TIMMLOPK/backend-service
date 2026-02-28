import { NextRequest, NextResponse } from "next/server"
import type { HintMessage } from "@/lib/types"

interface HintRequestBody {
  message: string
  courseId: string
  lessonId: string
  history: HintMessage[]
}

const SYSTEM_PROMPT = `You are Mentova AI, a knowledgeable and encouraging learning assistant.
Your role is to help students understand course material through Socratic questioning and
clear explanations. You adapt your language to the student's level.

Guidelines:
- Give hints rather than direct answers when possible
- Encourage the student and acknowledge their progress
- Reference the specific lesson content when relevant
- Keep responses concise (2-4 sentences for hints, more for explanations)
- Use examples that relate to real-world applications
- Never provide harmful, off-topic, or inappropriate content`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HintRequestBody
    const { message, courseId, lessonId, history } = body

    const externalApiUrl = process.env.NEXT_PUBLIC_API_URL
    if (externalApiUrl) {
      const res = await fetch(`${externalApiUrl}/api/ai/hint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_SECRET_KEY ?? ""}`,
        },
        body: JSON.stringify({ message, courseId, lessonId, history, systemPrompt: SYSTEM_PROMPT }),
      })
      return new NextResponse(res.body, {
        status: res.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    // Mock streaming response when no external API is configured
    const mockResponses: Record<string, string> = {
      default: `Great question! Let me help you think through this. Consider what you already know about this concept — what do you think happens when we apply it step by step? Try working through the first part and let me know what you get.`,
      hint: `Here's a hint: think about the core principle we covered earlier in this lesson. The key insight is that every step should follow logically from the previous one. Does that help you see the path forward?`,
      explain: `Let me break this down clearly. The main idea here is that we're building on foundational concepts to solve more complex problems. Start with what you know, then extend your reasoning step by step.`,
    }

    const lowerMsg = message.toLowerCase()
    let responseText = mockResponses.default
    if (lowerMsg.includes("hint") || lowerMsg.includes("help")) responseText = mockResponses.hint
    if (lowerMsg.includes("explain") || lowerMsg.includes("understand")) responseText = mockResponses.explain

    void courseId
    void lessonId
    void history

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const words = responseText.split(" ")
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "))
          await new Promise((r) => setTimeout(r, 40))
        }
        controller.close()
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch {
    return NextResponse.json({ error: "Failed to process hint request" }, { status: 500 })
  }
}
