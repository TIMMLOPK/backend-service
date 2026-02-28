"use client"

import { use, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  IconCheck,
  IconClock,
  IconStarFilled,
  IconMenu2,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconList,
  IconBrain,
  IconChevronDown,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LessonContent } from "@/components/course/lesson-content"
import { LessonNav } from "@/components/course/lesson-nav"
import { COURSES, LESSONS, USER_PROGRESS, CURRENT_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useEngagementTracker } from "@/hooks/use-engagement-tracker"
import { EngagementProvider } from "@/lib/engagement-context"
import { EngagementDebugPanel } from "@/components/debug/engagement-debug-panel"
import type { ContentAdjustment } from "@/lib/types"

function extractHeadings(content: string) {
  return content
    .split("\n")
    .reduce<{ level: number; text: string; id: string }[]>((acc, line) => {
      const match = line.match(/^(#{1,3})\s+(.+)/)
      if (match) {
        const text = match[2].trim()
        acc.push({
          level: match[1].length,
          text,
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        })
      }
      return acc
    }, [])
}

export default function LessonViewerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = use(params)
  const course = COURSES.find((c) => c.id === courseId)
  if (!course) notFound()

  const lessons = LESSONS[course.id] ?? []
  const lesson = lessons.find((l) => l.id === lessonId)
  if (!lesson) notFound()

  const progress = USER_PROGRESS.find(
    (p) => p.userId === CURRENT_USER.id && p.courseId === course.id
  )
  const completedIds = new Set(progress?.lessonsCompleted ?? [])
  const isCompleted = completedIds.has(lesson.id)

  const [navOpen, setNavOpen] = useState(false)
  const [marked, setMarked] = useState(isCompleted)
  const [readProgress, setReadProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [adjustments, setAdjustments] = useState<ContentAdjustment[]>([])
  const [expandedAdjustment, setExpandedAdjustment] = useState<string | null>(null)

  const contentRef = useRef<HTMLElement>(null)
  const tracker = useEngagementTracker(
    lesson.id,
    course.id,
    CURRENT_USER.id,
    contentRef
  )

  const currentIndex = lessons.findIndex((l) => l.id === lesson.id)
  const prevLesson = lessons[currentIndex - 1]
  const nextLesson = lessons[currentIndex + 1]

  const headings = extractHeadings(lesson.content)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setReadProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
      setScrolled(scrollTop > 140)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  async function handleMarkDone() {
    setMarked(true)
    const result = await tracker.sendSession(true)
    if (result.length > 0) setAdjustments(result)
  }

  return (
    <EngagementProvider value={tracker}>
      {/* Floating mini-header (fades in on scroll) */}
      <div
        className={cn(
          "fixed top-16 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-b transition-all duration-200",
          scrolled ? "opacity-100 translate-y-0.5" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-2.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="xl:hidden"
              onClick={() => setNavOpen(true)}
            >
              <IconMenu2 className="size-4" />
            </Button>
            <p className="flex-1 text-sm font-semibold truncate">{lesson.title}</p>
            <Button
              size="sm"
              variant={marked ? "outline" : "default"}
              onClick={marked ? undefined : handleMarkDone}
              className={cn("gap-1.5 h-7 text-xs shrink-0", marked && "text-primary border-primary")}
            >
              <IconCheck className="size-3.5" />
              {marked ? "Done" : "Mark Done"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setNavOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">{course.title}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setNavOpen(false)}>
                <IconX className="size-4" />
              </Button>
            </div>
            <LessonNav
              courseId={course.id}
              lessons={lessons}
              currentLessonId={lesson.id}
              completedIds={completedIds}
            />
          </div>
        </div>
      )}

      {/* Page layout */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <article ref={contentRef as React.RefObject<HTMLElement>}>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-10">
              <Button
                variant="ghost"
                size="icon-sm"
                className="xl:hidden -ml-1 mr-0.5"
                onClick={() => setNavOpen(true)}
              >
                <IconMenu2 className="size-3.5" />
              </Button>
              <Link href="/courses" className="hover:text-foreground transition-colors">
                Courses
              </Link>
              <span>/</span>
              <Link
                href={`/courses/${course.id}`}
                className="hover:text-foreground transition-colors truncate max-w-[160px]"
              >
                {course.title}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate">{lesson.title}</span>
            </nav>

            {/* Article header */}
            <header className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold capitalize">
                  {lesson.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  Lesson {currentIndex + 1} of {lessons.length}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-6">
                {lesson.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4 border-y text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <IconClock className="size-4" />
                  {lesson.estimatedMinutes} min read
                </span>
                <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500 font-medium">
                  <IconStarFilled className="size-4 text-yellow-500" />
                  +{lesson.xpReward} XP
                </span>
                <span>{course.instructorName}</span>

                <Button
                  size="sm"
                  variant={marked ? "outline" : "ghost"}
                  onClick={marked ? undefined : handleMarkDone}
                  className={cn(
                    "gap-1.5 h-8 ml-auto",
                    marked ? "text-primary border-primary" : "text-muted-foreground"
                  )}
                >
                  <IconCheck className="size-3.5" />
                  {marked ? "Completed" : "Mark done"}
                </Button>
              </div>
            </header>

            {/* Lesson content */}
            <LessonContent content={lesson.content} />

            {/* Article footer */}
            <footer className="mt-16 mb-8">
              {/* Completion card */}
              <div
                className={cn(
                  "rounded-2xl border p-6 transition-all duration-300",
                  marked ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "size-11 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      marked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {marked ? (
                      <IconCheck className="size-5" />
                    ) : (
                      <IconStarFilled className="size-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {marked
                        ? "You've completed this lesson!"
                        : "Ready to mark this lesson done?"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {marked
                        ? `Great work! You earned +${lesson.xpReward} XP.`
                        : `Earn +${lesson.xpReward} XP when you finish.`}
                    </p>
                    {!marked && (
                      <Button className="mt-4 gap-1.5" onClick={handleMarkDone}>
                        <IconCheck className="size-4" />
                        Mark as Done
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </footer>

            {/* AI Learning Insights — shown after session analysis */}
            {adjustments.length > 0 && (
              <section className="mt-6 mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="size-8 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                    <IconBrain className="size-4.5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Learning Insights</p>
                    <p className="text-xs text-muted-foreground">
                      AI identified {adjustments.length} section{adjustments.length > 1 ? "s" : ""} where you may benefit from extra review
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {adjustments.map((adj) => (
                    <div
                      key={adj.sectionId}
                      className="rounded-2xl border bg-card overflow-hidden"
                    >
                      {/* Section header */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          setExpandedAdjustment(
                            expandedAdjustment === adj.sectionId ? null : adj.sectionId
                          )
                        }
                      >
                        <IconAlertTriangle
                          className={cn(
                            "size-4 shrink-0",
                            adj.struggleScore >= 60
                              ? "text-red-500"
                              : adj.struggleScore >= 35
                              ? "text-amber-500"
                              : "text-yellow-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{adj.sectionTitle}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  adj.struggleScore >= 60
                                    ? "bg-red-500"
                                    : adj.struggleScore >= 35
                                    ? "bg-amber-500"
                                    : "bg-yellow-500"
                                )}
                                style={{ width: `${adj.struggleScore}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {adj.struggleScore >= 60
                                ? "High difficulty"
                                : adj.struggleScore >= 35
                                ? "Some difficulty"
                                : "Minor difficulty"}
                            </span>
                          </div>
                        </div>
                        <IconChevronDown
                          className={cn(
                            "size-4 text-muted-foreground shrink-0 transition-transform",
                            expandedAdjustment === adj.sectionId && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Expanded content */}
                      {expandedAdjustment === adj.sectionId && (
                        <div className="px-4 pb-4 border-t bg-muted/20">
                          {adj.suggestions.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {adj.suggestions.map((s, i) => (
                                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                  <span className="text-purple-500 mt-[3px] shrink-0 text-xs">●</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {adj.additionalContent && (
                            <div className="mt-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/20 p-4 text-sm leading-relaxed prose-article">
                              {adj.additionalContent
                                .split("\n")
                                .map((line, i) =>
                                  line.startsWith("**") && line.endsWith("**") ? (
                                    <p key={i} className="font-semibold mb-2 text-purple-900 dark:text-purple-200">
                                      {line.replace(/\*\*/g, "")}
                                    </p>
                                  ) : line === "" ? (
                                    <br key={i} />
                                  ) : (
                                    <p key={i} className="mb-1 text-foreground/80">
                                      {line}
                                    </p>
                                  )
                                )}
                            </div>
                          )}

                          <a
                            href={`#${adj.sectionId}`}
                            className="inline-flex items-center gap-1.5 mt-3 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                          >
                            Jump back to this section →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
      </div>

      {/* Lesson bottom nav — sits above AppBottomNav */}
      <div className="fixed bottom-21 left-1/2 -translate-x-1/2 z-40">
        {/* Progress ring wrapper — conic-gradient sweeps clockwise from the left */}
        <div
          className="rounded-[22px] p-[1.5px]"
          style={{
            background: `conic-gradient(from 270deg at 50% 50%, hsl(var(--primary)) ${readProgress * 3.6}deg, hsl(var(--border)) 0deg)`,
          }}
        >
          <div className="flex items-center bg-background/90 backdrop-blur-xl rounded-[20px] px-1.5 py-1.5 gap-0.5 shadow-lg shadow-black/10">
            {/* Previous */}
              <Link
                href={`/courses/${course.id}/lessons/${prevLesson?.id}`}
               target={prevLesson ? "_blank" : undefined}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors max-w-[140px]", !prevLesson && "cursor-not-allowed text-muted-foreground/50 pointer-events-none")}
              >
                <IconChevronLeft className="size-3.5 shrink-0" />
                <span className="text-xs font-medium truncate">{prevLesson ? prevLesson.title : "Start"} </span>
              </Link>
            

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-0.5 shrink-0" />

            {/* Contents — Popover ToC */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[14px] transition-colors text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted data-[state=open]:bg-primary data-[state=open]:text-primary-foreground"
                >
                  <IconList className="size-3.5 shrink-0" />
                  <span className="hidden sm:inline">Contents</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                sideOffset={12}
                className="w-64 p-0 rounded-2xl overflow-hidden"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 pt-3">
                  On this page
                </p>
                <nav className="pb-2 max-h-60 overflow-y-auto">
                  {headings.map((h) => (
                    <a
                      key={`${h.id}-${h.level}`}
                      href={`#${h.id}`}
                      className={cn(
                        "flex items-center px-4 py-1.5 text-xs hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground",
                        h.level === 1 && "font-medium text-foreground/80",
                        h.level === 2 && "pl-7",
                        h.level === 3 && "pl-10 text-[11px]"
                      )}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </PopoverContent>
            </Popover>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-0.5 shrink-0" />

            {/* Next */}
            {nextLesson ? (
              <Link
                href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors max-w-[140px]"
              >
                <span className="text-xs font-medium truncate">{nextLesson.title}</span>
                <IconChevronRight className="size-3.5 shrink-0" />
              </Link>
            ) : (
              <Link
                href={`/courses/${course.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span className="text-xs font-medium">Back to course</span>
                <IconChevronRight className="size-3.5 shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </div>
      {process.env.NODE_ENV === "development" && (
        <EngagementDebugPanel tracker={tracker} />
      )}
    </EngagementProvider>
  )
}
