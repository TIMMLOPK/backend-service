import type { ReactNode } from "react"
// @ts-expect-error — ViewTransition is available in React 19 canary (experimental)
import { ViewTransition } from "react"
import { AppTopNav } from "@/components/layout/app-top-nav"
import { AppBottomNav } from "@/components/layout/app-bottom-nav"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppTopNav />
      <main className="pt-16 pb-28">
        <ViewTransition>{children}</ViewTransition>
      </main>
      <AppBottomNav />
    </div>
  )
}
