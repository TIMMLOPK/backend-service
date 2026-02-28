"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError, getErrorMessage } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(getErrorMessage(err.code));
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to continue your learning journey
        </p>
      </div>

      <Card className="p-0">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-base">Sign in with</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-0 space-y-3">
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
              <span className="bg-card px-2 text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="px-6 py-4 justify-center">
          <CardDescription>
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.REGISTER}
              className="text-primary font-medium hover:underline"
            >
              Sign up for free
            </Link>
          </CardDescription>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
