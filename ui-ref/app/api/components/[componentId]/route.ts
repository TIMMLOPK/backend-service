import { NextRequest, NextResponse } from "next/server"
import { COMPONENTS } from "@/lib/mock-data"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  const { componentId } = await params

  const externalApiUrl = process.env.NEXT_PUBLIC_API_URL
  if (externalApiUrl) {
    const res = await fetch(`${externalApiUrl}/api/components/${componentId}`, {
      headers: { Authorization: `Bearer ${process.env.API_SECRET_KEY ?? ""}` },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: res.status }
      )
    }
    return new NextResponse(res.body, { status: res.status })
  }

  const component = COMPONENTS[componentId]
  if (!component) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 })
  }

  return NextResponse.json(component)
}
