"use client";

import { IconUser, IconMail, IconAt, IconShield, IconUsers, IconBook, IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { USER_TYPE_LABELS } from "@/lib/constants";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { stats } = useDashboard();

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6 py-4 mx-auto">
      {/* Profile card */}
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Large avatar */}
          <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
            {user.full_name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-1">
              {USER_TYPE_LABELS[user.user_type]}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-8 pt-2 w-full border-t border-border">
            <div className="text-center pt-3">
              <p className="text-xl font-bold text-primary">
                {stats.sectionsCompleted}
              </p>
              <p className="text-xs text-muted-foreground">Sections Done</p>
            </div>
            <div className="text-center pt-3">
              <p className="text-xl font-bold">{stats.coursesEnrolled}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
            <div className="text-center pt-3">
              <p className="text-xl font-bold text-primary">
                {stats.bestQuizScore !== null ? `${stats.bestQuizScore}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Best Quiz</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Account details */}
      <Card className="p-6 space-y-5">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <IconUser className="size-4 text-muted-foreground" />
          Personal Information
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
              <IconAt className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
              <IconMail className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
              <IconShield className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Type</p>
              <p className="font-medium">{USER_TYPE_LABELS[user.user_type]}</p>
            </div>
          </div>
        </div>

        <form className="space-y-4 pt-2 border-t border-border">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue={user.full_name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email} />
            </div>
          </div>
          <Button type="button" size="sm">
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Learning Preferences */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <IconBook className="size-4 text-muted-foreground" />
            Learning Preferences
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customise how Mentova AI adapts to your learning style
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dailyGoal">Daily Study Goal (minutes)</Label>
            <Input id="dailyGoal" type="number" defaultValue={30} min={5} max={480} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Preferred Difficulty</Label>
            <Input id="difficulty" defaultValue="Adaptive (recommended)" readOnly />
          </div>
        </div>
        <Button variant="outline" type="button" size="sm">
          Save Preferences
        </Button>
      </Card>

      {/* Supervisor info */}
      {user.supervisor && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-semibold">Supervised By</h3>
          <div className="flex items-center gap-3">
            <Avatar name={user.supervisor.full_name} size="sm" />
            <div>
              <p className="font-medium text-sm">{user.supervisor.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {user.supervisor.email}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Dependants for parents */}
      {user.user_type === "parent" &&
        user.dependants &&
        user.dependants.length > 0 && (
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <IconUsers className="size-4 text-muted-foreground" />
              My Children ({user.dependants.length})
            </h3>
            <div className="space-y-3">
              {user.dependants.map((child) => (
                <div key={child.id} className="flex items-center gap-3">
                  <Avatar name={child.full_name} size="sm" />
                  <div>
                    <p className="font-medium text-sm">{child.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {child.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/children">
              <Button variant="outline" size="sm">
                Manage Children
              </Button>
            </Link>
          </Card>
        )}
    </div>
  );
}
