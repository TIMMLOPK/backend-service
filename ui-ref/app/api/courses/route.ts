import { NextRequest, NextResponse } from "next/server"
import { COURSES } from "@/lib/mock-data"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const level = searchParams.get("level")
  const query = searchParams.get("q")?.toLowerCase()

  const externalApiUrl = process.env.NEXT_PUBLIC_API_URL
  if (externalApiUrl) {
    const res = await fetch(`${externalApiUrl}/api/courses?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${process.env.API_SECRET_KEY ?? ""}` },
    })
    return new NextResponse(res.body, { status: res.status })
  }

  let courses = [...COURSES]
  if (category) courses = courses.filter((c) => c.category === category)
  if (level) courses = courses.filter((c) => c.level === level)
  if (query) {
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some((t) => t.toLowerCase().includes(query))
    )
  }

  return NextResponse.json(courses)
}
