import { NextRequest, NextResponse } from "next/server"
import { USER_PROGRESS, SUBJECT_MASTERY, ACTIVITY_DATA } from "@/lib/mock-data"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId") ?? "user-1"
  const type = searchParams.get("type") ?? "progress"

  const externalApiUrl = process.env.NEXT_PUBLIC_API_URL
  if (externalApiUrl) {
    const res = await fetch(`${externalApiUrl}/api/progress?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${process.env.API_SECRET_KEY ?? ""}` },
    })
    return new NextResponse(res.body, { status: res.status })
  }

  if (type === "mastery") return NextResponse.json(SUBJECT_MASTERY)
  if (type === "activity") return NextResponse.json(ACTIVITY_DATA)

  const progress = USER_PROGRESS.filter((p) => p.userId === userId)
  return NextResponse.json(progress)
}
