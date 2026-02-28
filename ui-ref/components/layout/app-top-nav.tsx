"use client"

import Link from "next/link"
import {
  IconFlame,
  IconStarFilled,
  IconBell,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { CURRENT_USER } from "@/lib/mock-data"

export function AppTopNav() {
  const user = CURRENT_USER

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-md">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center relative">
        <Link href="/dashboard" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">Mentova</span>
        </Link>
      </div>
    </header>
  )
}
