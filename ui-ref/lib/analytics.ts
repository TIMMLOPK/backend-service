import type { LessonEngagementSession, ContentAdjustment } from "./types"

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function sendEngagementSession(
  session: LessonEngagementSession
): Promise<ContentAdjustment[]> {
  try {
    const res = await fetch("/api/analytics/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
      keepalive: true,
    })
    if (!res.ok) return []
    const data = (await res.json()) as { adjustments?: ContentAdjustment[] }
    return data.adjustments ?? []
  } catch {
    return []
  }
}
