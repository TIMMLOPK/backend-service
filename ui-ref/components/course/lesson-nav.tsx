"use client"

import Link from "next/link"
import {
  IconCheck,
  IconBook,
  IconPlayerPlay,
  IconHelp,
  IconCode,
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import type { Lesson, LessonType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const TYPE_ICONS: Record<LessonType, React.ReactNode> = {
  reading: <IconBook className="size-3" />,
  video: <IconPlayerPlay className="size-3" />,
  quiz: <IconHelp className="size-3" />,
  coding: <IconCode className="size-3" />,
  interactive: <IconBolt className="size-3" />,
}

interface LessonNavProps {
  courseId: string
  lessons: Lesson[]
  currentLessonId: string
  completedIds: Set<string>
}

export function LessonNav({ courseId, lessons, currentLessonId, completedIds }: LessonNavProps) {
  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId)
  const prev = lessons[currentIndex - 1]
  const next = lessons[currentIndex + 1]

  return (
    <div className="flex flex-col h-full">
      {/* Prev/Next nav */}
      <div className="flex gap-2 p-3 border-b">
        <Button variant="outline" size="sm" className="flex-1" disabled={!prev} asChild={!!prev}>
          {prev ? (
            <Link href={`/courses/${courseId}/lessons/${prev.id}`}>
              <IconChevronLeft className="size-3.5" />
              Prev
            </Link>
          ) : (
            <>
              <IconChevronLeft className="size-3.5" />
              Prev
            </>
          )}
        </Button>
        <Button size="sm" className="flex-1" disabled={!next} asChild={!!next}>
          {next ? (
            <Link href={`/courses/${courseId}/lessons/${next.id}`}>
              Next
              <IconChevronRight className="size-3.5" />
            </Link>
          ) : (
            <>
              Finish
              <IconCheck className="size-3.5" />
            </>
          )}
        </Button>
      </div>

      {/* Lesson list */}
      <div className="flex-1 overflow-y-auto py-2">
        {lessons.map((lesson, idx) => {
          const isActive = lesson.id === currentLessonId
          const isCompleted = completedIds.has(lesson.id)

          return (
            <Link
              key={lesson.id}
              href={`/courses/${courseId}/lessons/${lesson.id}`}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-xs transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border-r-2 border-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary/20 text-primary ring-1 ring-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <IconCheck className="size-2.5" /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("truncate", isActive && "font-medium")}>{lesson.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                  {TYPE_ICONS[lesson.type]}
                  <span>{lesson.estimatedMinutes}m</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
