"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconLoader2,
  IconSchool,
  IconUsers,
  IconChalkboard,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/types"

const ROLES: { id: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "student",
    label: "Student",
    description: "I want to learn",
    icon: <IconSchool className="size-5" />,
  },
  {
    id: "parent",
    label: "Parent",
    description: "Monitor my child",
    icon: <IconUsers className="size-5" />,
  },
  {
    id: "instructor",
    label: "Instructor",
    description: "Create & teach courses",
    icon: <IconChalkboard className="size-5" />,
  },
]

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<UserRole>("student")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">Start your personalized learning journey today</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">I am a...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all hover:border-primary/50",
                  role === r.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {r.icon}
                <span className="text-xs font-medium">{r.label}</span>
                <span className="text-[10px] leading-tight">{r.description}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="w-full">
              <IconBrandGoogle className="size-4" />
              Google
            </Button>
            <Button variant="outline" type="button" className="w-full">
              <IconBrandGithub className="size-4" />
              GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" placeholder="Alex Chen" required autoComplete="name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="you@example.com" required autoComplete="email" />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <CardDescription>
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </CardDescription>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>
      </p>
    </div>
  )
}
