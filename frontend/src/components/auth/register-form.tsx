"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconSchool,
  IconUsers,
} from "@tabler/icons-react";
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError, getErrorMessage } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

type AccountType = "student" | "parent";

const ROLES: {
  id: AccountType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
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
];

export function RegisterForm() {
  const router = useRouter();
  const { register, loading } = useAuthStore();
  const [userType, setUserType] = useState<AccountType>("student");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await register({
        username,
        full_name: fullName,
        email,
        password,
        user_type: userType,
      });
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
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">
          Start your personalised learning journey today
        </p>
      </div>

      <Card className="p-0">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-base">I am a...</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setUserType(r.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all hover:border-primary/50 cursor-pointer",
                  userType === r.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {r.icon}
                <span className="text-xs font-medium">{r.label}</span>
                <span className="text-[10px] leading-tight">{r.description}</span>
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3 pb-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Alex Chen"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="alexchen"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="px-6 py-4 justify-center">
          <CardDescription>
            Already have an account?{" "}
            <Link
              href={ROUTES.LOGIN}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </CardDescription>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
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
