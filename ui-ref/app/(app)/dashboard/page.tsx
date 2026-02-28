"use client"

import Link from "next/link"
import { IconPlus, IconClock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { CreateCourseDialog } from "@/components/course/create-course-dialog"
import { COURSES, ENROLLMENTS, CURRENT_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const CATEGORY_COLORS: Record<string, string> = {
  "computer-science": "bg-blue-50   border-blue-200   dark:bg-blue-950/40   dark:border-blue-800",
  mathematics:        "bg-purple-50  border-purple-200  dark:bg-purple-950/40  dark:border-purple-800",
  science:            "bg-green-50   border-green-200   dark:bg-green-950/40   dark:border-green-800",
  language:           "bg-yellow-50  border-yellow-200  dark:bg-yellow-950/40  dark:border-yellow-800",
  history:            "bg-orange-50  border-orange-200  dark:bg-orange-950/40  dark:border-orange-800",
  arts:               "bg-pink-50    border-pink-200    dark:bg-pink-950/40    dark:border-pink-800",
  business:           "bg-cyan-50    border-cyan-200    dark:bg-cyan-950/40    dark:border-cyan-800",
  engineering:        "bg-red-50     border-red-200     dark:bg-red-950/40     dark:border-red-800",
}

function CloudCard({
  course,
  progress,
  className,
}: {
  course: (typeof COURSES)[number]
  progress?: number
  className?: string
}) {
  return (
    <Link
      href={`/courses/${course.id}`}
      style={{ viewTransitionName: `course-card-${course.id}` }}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 w-32 sm:w-36 md:w-44 shrink-0",
        "transition-all duration-200 hover:scale-105 hover:shadow-lg hover:rotate-0 hover:z-10",
        CATEGORY_COLORS[course.category],
        className,
      )}
    >
      <span className="text-xs font-semibold leading-snug line-clamp-2 text-foreground">
        {course.title}
      </span>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <IconClock className="size-2.5 shrink-0" />
        <span>{course.estimatedHours}h</span>
        <span className="mx-0.5">·</span>
        <span className="capitalize">{course.category.replace("-", " ")}</span>
      </div>
      {progress !== undefined && (
        <div className="h-1 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mt-0.5">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </Link>
  )
}

export default function DashboardPage() {
  const enrollments = ENROLLMENTS.filter((e) => e.userId === CURRENT_USER.id)
  const prog = (id: string) => enrollments.find((e) => e.courseId === id)?.progress

  const [c0, c1, c2, c3, c4, c5] = COURSES

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center">

        {/* Row 1 — two cards, wide apart, different heights */}
        <div className="flex items-start justify-center w-full gap-2">
          <CloudCard course={c0} progress={prog(c0.id)} className="-rotate-3 mt-3 mr-6 sm:mt-4 sm:mr-10 md:mt-6 md:mr-16" />
          <CloudCard course={c1} progress={prog(c1.id)} className="rotate-2 -mt-1 ml-8 sm:ml-12 md:ml-20" />
        </div>

        {/* Row 2 — card · button · card */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 -mt-2">
          <CloudCard course={c2} progress={prog(c2.id)} className="rotate-1 mt-2 md:mt-4" />

          <CreateCourseDialog
            trigger={
              <Button
                size="lg"
                className="rounded-full px-3 sm:px-4 gap-2 shadow-2xl text-sm sm:text-base shrink-0 mx-1 sm:mx-2"
              >
                <IconPlus className="size-4 shrink-0" />
                <span className="hidden sm:inline">Learn something new</span>
              </Button>
            }
          />

          <CloudCard course={c3} progress={prog(c3.id)} className="-rotate-2 -mt-2 md:-mt-3" />
        </div>

        {/* Row 3 — two cards, wide apart, different heights */}
        <div className="flex items-end justify-center w-full gap-2 -mt-1">
          <CloudCard course={c4} progress={prog(c4.id)} className="rotate-2 mb-2 mr-5 sm:mb-3 sm:mr-9 md:mb-4 md:mr-14" />
          <CloudCard course={c5} progress={prog(c5.id)} className="-rotate-1 -mb-1 ml-6 sm:ml-10 md:ml-16" />
        </div>

      </div>
    </div>
  )
}
