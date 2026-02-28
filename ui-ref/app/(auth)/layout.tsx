import type { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Mentova</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>
      <footer className="p-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Mentova. All rights reserved.
      </footer>
    </div>
  )
}
