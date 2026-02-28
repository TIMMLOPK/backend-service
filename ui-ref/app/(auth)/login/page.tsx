"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { IconBrandGithub, IconBrandGoogle, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulate auth — replace with real API call
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to continue your learning journey</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Sign in with</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
              <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <CardDescription>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up for free
            </Link>
          </CardDescription>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>
      </p>
    </div>
  )
}
