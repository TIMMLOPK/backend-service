"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { IconSearch, IconX, IconClock, IconBook } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CreateCourseDialog } from "@/components/course/create-course-dialog"
import { COURSES, ENROLLMENTS, CURRENT_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { CourseCategory, CourseLevel } from "@/lib/types"

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

const CATEGORIES: { id: CourseCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "computer-science", label: "Computer Science" },
  { id: "mathematics", label: "Mathematics" },
  { id: "science", label: "Science" },
  { id: "language", label: "Language" },
  { id: "history", label: "History" },
  { id: "arts", label: "Arts" },
  { id: "business", label: "Business" },
  { id: "engineering", label: "Engineering" },
]

const LEVELS: { id: CourseLevel | "all"; label: string }[] = [
  { id: "all", label: "All Levels" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "expert", label: "Expert" },
]

function CourseCard({
  course,
  progress,
}: {
  course: (typeof COURSES)[number]
  progress?: number
}) {
  return (
    <Link
      href={`/courses/${course.id}`}
      style={{ viewTransitionName: `course-card-${course.id}` }}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 w-48 shrink-0",
        "transition-all duration-200 hover:scale-105 hover:shadow-lg hover:rotate-0 hover:z-10",
        CATEGORY_COLORS[course.category]
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
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <IconBook className="size-2.5 shrink-0" />
        <span>{course.totalLessons} lessons</span>
        <span className="mx-0.5">·</span>
        <span className="capitalize">{course.level}</span>
      </div>
      {progress !== undefined && (
        <div className="h-1 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mt-0.5">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </Link>
  )
}

export default function CoursesPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CourseCategory | "all">("all")
  const [level, setLevel] = useState<CourseLevel | "all">("all")

  const enrollments = ENROLLMENTS.filter((e) => e.userId === CURRENT_USER.id)

  const filtered = useMemo(() => {
    let list = [...COURSES]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (category !== "all") list = list.filter((c) => c.category === category)
    if (level !== "all") list = list.filter((c) => c.level === level)
    return list
  }, [query, category, level])

  const enrolled = filtered.filter((c) => enrollments.some((e) => e.courseId === c.id))
  const available = filtered.filter((c) => !enrollments.some((e) => e.courseId === c.id))

  const hasFilters = query || category !== "all" || level !== "all"

  function clearFilters() {
    setQuery("")
    setCategory("all")
    setLevel("all")
  }

  return (
    <div className="min-h-[80vh] flex flex-col p-6 md:p-10">

      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8 gap-3">
        <h1 className="text-3xl font-bold mb-1">Course Library</h1>
        <p className="text-sm text-muted-foreground">{COURSES.length} courses across all subjects</p>
        <CreateCourseDialog />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col items-center gap-3 mb-10 max-w-2xl mx-auto w-full">
        <div className="flex gap-2 w-full">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search courses, topics, tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
              title="Clear filters"
              className="rounded-full shrink-0"
            >
              <IconX className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as CourseCategory | "all")}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                category === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {LEVELS.map((lv) => (
            <button
              key={lv.id}
              onClick={() => setLevel(lv.id as CourseLevel | "all")}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                level === lv.id
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {lv.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Enrolled courses */}
      {enrolled.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-widest mb-6">
            My Courses <span className="font-normal">({enrolled.length})</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {enrolled.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                progress={enrollments.find((e) => e.courseId === course.id)?.progress}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available courses */}
      <section>
        <h2 className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-widest mb-6">
          {enrolled.length > 0 ? "Explore More" : "All Courses"}{" "}
          <span className="font-normal">({available.length})</span>
        </h2>
        {available.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {available.map((course, i) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
