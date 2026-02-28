import {
  IconUser,
  IconFlame,
  IconStarFilled,
  IconTrophy,
  IconSchool,
  IconShield,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { CURRENT_USER, BADGES, ENROLLMENTS } from "@/lib/mock-data"

export default function ProfilePage() {
  const user = CURRENT_USER
  const earnedBadges = BADGES.filter((b) => b.earnedAt)
  const lockedBadges = BADGES.filter((b) => !b.earnedAt)
  const enrollments = ENROLLMENTS.filter((e) => e.userId === user.id)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="grid md:grid-cols-1 gap-6">
        {/* Profile card */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mx-auto">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-lg">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-xl text-primary">{user.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl">{user.level}</p>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-orange-500">{user.streak}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center">
                <Badge variant="secondary" className="text-xs gap-1">
                  <IconFlame className="size-3 text-orange-500" />
                  {user.streak} Day Streak
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1">
                  <IconStarFilled className="size-3 text-yellow-500" />
                  Level {user.level} Expert
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1">
                  <IconSchool className="size-3" />
                  {enrollments.length} Courses
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconUser className="size-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input id="name" defaultValue={user.name} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" defaultValue={user.email} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="bio">Bio</FieldLabel>
                  <Input id="bio" placeholder="Tell us about yourself..." />
                </Field>
                <Button type="button">Save Changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Learning Preferences</CardTitle>
              <CardDescription className="text-xs">
                Customize how Mentova AI adapts to your learning style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="daily-goal">Daily Study Goal (minutes)</FieldLabel>
                  <Input id="daily-goal" type="number" defaultValue={30} min={5} max={480} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="difficulty">Preferred Difficulty</FieldLabel>
                  <Input id="difficulty" defaultValue="Adaptive (recommended)" readOnly />
                </Field>
              </div>
              <Button variant="outline" type="button">Save Preferences</Button>
            </CardContent>
          </Card>

          {user.linkedChildIds && user.linkedChildIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Parental Controls</CardTitle>
                <CardDescription className="text-xs">
                  Manage linked children accounts and visibility settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You have {user.linkedChildIds.length} linked child account(s). Visit{" "}
                  <a href="/children" className="text-primary hover:underline">
                    My Children
                  </a>{" "}
                  to view their progress.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
