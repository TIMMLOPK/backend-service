import Link from "next/link"
import { notFound } from "next/navigation"
import {
  IconArrowLeft,
  IconClock,
  IconBook,
  IconStarFilled,
  IconCheck,
  IconLock,
  IconPlayerPlay,
  IconCode,
  IconHelp,
  IconBolt,
  IconUsers,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { COURSES, LESSONS, ENROLLMENTS, USER_PROGRESS, CURRENT_USER } from "@/lib/mock-data"
import type { LessonType } from "@/lib/types"
import { cn } from "@/lib/utils"

const LESSON_TYPE_ICONS: Record<LessonType, React.ReactNode> = {
  reading: <IconBook className="size-4" />,
  video: <IconPlayerPlay className="size-4" />,
  quiz: <IconHelp className="size-4" />,
  coding: <IconCode className="size-4" />,
  interactive: <IconBolt className="size-4" />,
}

const LESSON_TYPE_COLORS: Record<LessonType, string> = {
  reading: "text-blue-500 bg-blue-500/10",
  video: "text-red-500 bg-red-500/10",
  quiz: "text-yellow-500 bg-yellow-500/10",
  coding: "text-green-500 bg-green-500/10",
  interactive: "text-purple-500 bg-purple-500/10",
}

const LEVEL_LABELS: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  university: "University",
  professional: "Professional",
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = COURSES.find((c) => c.id === courseId)
  if (!course) notFound()

  const lessons = LESSONS[course.id] ?? []
  const enrollment = ENROLLMENTS.find(
    (e) => e.userId === CURRENT_USER.id && e.courseId === course.id
  )
  const progress = USER_PROGRESS.find(
    (p) => p.userId === CURRENT_USER.id && p.courseId === course.id
  )
  const completedIds = new Set(progress?.lessonsCompleted ?? [])
  const isEnrolled = !!enrollment

  const firstIncomplete = lessons.find((l) => !completedIds.has(l.id))
  const continueLessonId = progress?.lastLessonId ?? firstIncomplete?.id ?? lessons[0]?.id

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="size-4" />
        Back to courses
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border overflow-hidden">
        <div className="relative h-48 bg-muted">
          {course.thumbnailUrl && (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="size-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {course.category.replace("-", " ")}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {course.level}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">{course.title}</h1>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <IconBook className="size-4" />
              {course.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <IconClock className="size-4" />
              ~{course.estimatedHours} hours
            </span>
            <span className="flex items-center gap-1.5">
              <IconUsers className="size-4" />
              {course.instructorName}
            </span>
            <span className="flex items-center gap-1.5">
              <IconStarFilled className="size-4 text-yellow-500" />
              4.8
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {course.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>

          {isEnrolled && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedIds.size} of {lessons.length} lessons completed</span>
                <span className="font-semibold text-primary">{enrollment.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${enrollment.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {isEnrolled ? (
              <Button asChild>
                <Link href={`/courses/${course.id}/lessons/${continueLessonId}`}>
                  <IconPlayerPlay className="size-4" />
                  {completedIds.size > 0 ? "Continue Learning" : "Start Course"}
                </Link>
              </Button>
            ) : (
              <Button>
                <IconBolt className="size-4" />
                Enroll for Free
              </Button>
            )}
            <Button variant="outline">Add to Wishlist</Button>
          </div>
        </div>
      </div>

      {/* Lesson list */}
      <section>
        <h2 className="font-semibold text-lg mb-4">
          Course Content{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({lessons.length} lessons)
          </span>
        </h2>

        {lessons.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-muted-foreground">
            <p>Lessons coming soon.</p>
          </div>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {lessons.map((lesson, idx) => {
              const isCompleted = completedIds.has(lesson.id)
              const isLocked = !isEnrolled && idx > 0
              const isCurrent = lesson.id === progress?.lastLessonId

              return (
                <div
                  key={lesson.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 bg-card transition-colors",
                    !isLocked && "hover:bg-muted/50",
                    isCurrent && "bg-primary/5"
                  )}
                >
                  {/* Order / completion */}
                  <div
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isLocked
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {isCompleted ? <IconCheck className="size-3.5" /> : isLocked ? <IconLock className="size-3" /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-medium truncate", isLocked && "text-muted-foreground")}>
                        {lesson.title}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded", LESSON_TYPE_COLORS[lesson.type])}>
                        {LESSON_TYPE_ICONS[lesson.type]}
                        {lesson.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {lesson.estimatedMinutes} min
                      </span>
                      <span className="text-[10px] text-primary font-medium">+{lesson.xpReward} XP</span>
                    </div>
                  </div>

                  {!isLocked && (
                    <Button size="sm" variant={isCompleted ? "outline" : "ghost"} asChild>
                      <Link href={`/courses/${course.id}/lessons/${lesson.id}`}>
                        {isCompleted ? "Review" : "Start"}
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
