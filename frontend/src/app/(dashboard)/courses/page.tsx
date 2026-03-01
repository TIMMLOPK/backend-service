"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconSearch,
  IconX,
  IconClock,
  IconLoader2,
  IconCheck,
  IconAlertCircle,
  IconSparkles,
  IconCompass,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { api } from "@/lib/api";
import { TOPIC_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Course, CourseTopic, CourseDifficulty } from "@/lib/types";

type GenerationJob =
  | { status: "generating"; topic: string }
  | { status: "ready"; topic: string; courseId: string }
  | { status: "error"; topic: string };

const TOPICS: { id: CourseTopic | "all"; label: string }[] = [
  { id: "all", label: "All Topics" },
  { id: "math", label: "Mathematics" },
  { id: "science", label: "Science" },
  { id: "history", label: "History" },
  { id: "art", label: "Art" },
  { id: "music", label: "Music" },
  { id: "other", label: "Other" },
];

const DIFFICULTIES: { id: CourseDifficulty | "all"; label: string }[] = [
  { id: "all", label: "All Levels" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "expert", label: "Expert" },
];

const TOPIC_CARD_COLORS: Record<string, string> = {
  math: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800",
  science: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800",
  history: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800",
  art: "bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-800",
  music: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
  other: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
};

function CourseCard({ course }: { course: Course }) {
  const colorClass =
    TOPIC_CARD_COLORS[course.topic] ?? "bg-muted border-border";
  const topicLabel = TOPIC_LABELS[course.topic as CourseTopic] ?? "Course";
  const diffLabel =
    DIFFICULTY_LABELS[course.difficulty as CourseDifficulty] ??
    course.difficulty;
  const isGenerating = course.status === "generating";

  return (
    <Link
      href={`/courses/${course.id}`}
      style={{ viewTransitionName: `course-card-${course.id}` }}
      className={cn(
        "relative flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 w-48 shrink-0",
        "transition-all duration-200 hover:scale-105 hover:shadow-lg hover:z-10",
        isGenerating ? "bg-muted/60 border-primary/30 border-dashed" : colorClass,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={cn(
          "text-xs font-semibold leading-snug line-clamp-2",
          isGenerating ? "text-muted-foreground" : "text-foreground",
        )}>
          {course.name}
        </span>
        {isGenerating && (
          <IconSparkles className="size-3 text-primary shrink-0 mt-0.5 animate-pulse" />
        )}
      </div>
      {isGenerating ? (
        <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
          <IconLoader2 className="size-2.5 shrink-0 animate-spin" />
          <span>Generating…</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <IconClock className="size-2.5 shrink-0" />
          <span>{course.estimated_hours}h</span>
          <span className="mx-0.5">·</span>
          <span>{topicLabel}</span>
        </div>
      )}
      <div className={cn(
        "text-[10px] capitalize",
        isGenerating ? "text-muted-foreground/60" : "text-muted-foreground",
      )}>
        {diffLabel}
      </div>
    </Link>
  );
}

function PublicCourseCard({
  course,
  onEnrol,
  enrolling,
}: {
  course: Course;
  onEnrol: (id: string) => void;
  enrolling: boolean;
}) {
  const colorClass = TOPIC_CARD_COLORS[course.topic] ?? "bg-muted border-border";
  const topicLabel = TOPIC_LABELS[course.topic as CourseTopic] ?? "Course";
  const diffLabel = DIFFICULTY_LABELS[course.difficulty as CourseDifficulty] ?? course.difficulty;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 w-48 shrink-0",
        colorClass,
      )}
    >
      <span className="text-xs font-semibold leading-snug line-clamp-2 text-foreground">
        {course.name}
      </span>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <IconClock className="size-2.5 shrink-0" />
        <span>{course.estimated_hours}h</span>
        <span className="mx-0.5">·</span>
        <span>{topicLabel}</span>
      </div>
      <div className="text-[10px] capitalize text-muted-foreground">{diffLabel}</div>
      <button
        onClick={() => onEnrol(course.id)}
        disabled={enrolling}
        className={cn(
          "mt-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors",
          "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {enrolling ? (
          <IconLoader2 className="size-2.5 animate-spin" />
        ) : (
          <IconUsers className="size-2.5" />
        )}
        {enrolling ? "Enrolling…" : "Enroll"}
      </button>
    </div>
  );
}

export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isParent = user?.user_type === "parent";
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [selectedTopic, setSelectedTopic] = useState<CourseTopic | "all">(
    "all",
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    CourseDifficulty | "all"
  >("all");
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null);

  const [publicCourses, setPublicCourses] = useState<Course[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await api<Course[]>("/api/v1/courses/");
      setCourses(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const fetchPublicCourses = useCallback(async () => {
    try {
      const data = await api<Course[]>("/api/v1/courses/explore");
      setPublicCourses(data);
    } catch {
      // silently ignore
    } finally {
      setPublicLoading(false);
    }
  }, []);

  const handleEnrol = useCallback(async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await api<Course>(`/api/v1/courses/${courseId}/enrol`, { method: "POST" });
      await Promise.all([fetchCourses(), fetchPublicCourses()]);
      router.push(`/courses/${courseId}`);
    } catch {
      // silently ignore — could add a toast here
    } finally {
      setEnrollingId(null);
    }
  }, [fetchCourses, fetchPublicCourses, router]);

  useEffect(() => {
    fetchCourses().finally(() => setLoading(false));
    if (!isParent) fetchPublicCourses();
  }, [fetchCourses, fetchPublicCourses]);

  // Poll every 5s when any course is still generating.
  useEffect(() => {
    const hasGenerating = courses.some((c) => c.status === "generating");
    if (!hasGenerating) return;

    const interval = setInterval(async () => {
      const updated = await fetchCourses();
      if (updated && !updated.some((c) => c.status === "generating")) {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [courses, fetchCourses]);

  const handleGenerationStart = useCallback((topic: string) => {
    setGenerationJob({ status: "generating", topic });
  }, []);

  const handleGenerationComplete = useCallback((courseId: string) => {
    setGenerationJob((prev) =>
      prev ? { status: "ready", topic: prev.topic, courseId } : null,
    );
    fetchCourses();
  }, [fetchCourses]);

  const handleGenerationError = useCallback(() => {
    setGenerationJob((prev) =>
      prev ? { status: "error", topic: prev.topic } : null,
    );
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchesTopic =
        selectedTopic === "all" || c.topic === selectedTopic;
      const matchesDiff =
        selectedDifficulty === "all" || c.difficulty === selectedDifficulty;
      return matchesSearch && matchesTopic && matchesDiff;
    });
  }, [courses, search, selectedTopic, selectedDifficulty]);

  const hasFilters =
    search !== "" || selectedTopic !== "all" || selectedDifficulty !== "all";

  function clearFilters() {
    setSearch("");
    setSelectedTopic("all");
    setSelectedDifficulty("all");
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Course Library</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${courses.length} courses across all subjects`}
        </p>
        <CreateCourseDialog
          onGenerationStart={handleGenerationStart}
          onGenerationComplete={handleGenerationComplete}
          onGenerationError={handleGenerationError}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col items-center gap-3 max-w-2xl mx-auto w-full">
        <div className="flex gap-2 w-full">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search courses, topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        {/* Topic pills */}
        <div className="flex gap-2 flex-wrap justify-center">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors cursor-pointer",
                selectedTopic === t.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Difficulty pills */}
        <div className="flex gap-2 flex-wrap justify-center">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDifficulty(d.id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors cursor-pointer",
                selectedDifficulty === d.id
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Your Courses */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <IconLoader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <p className="text-lg font-semibold">
            {courses.length === 0 ? "No courses yet" : "No courses found"}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {courses.length === 0
              ? "Create your first AI-generated course to get started."
              : "Try adjusting your search or filters."}
          </p>
          {hasFilters && (
            <>
              {courses.length === 0 ? (
              <CreateCourseDialog
                trigger={<Button size="sm">Create your first course</Button>}
                onGenerationStart={handleGenerationStart}
                onGenerationComplete={handleGenerationComplete}
                onGenerationError={handleGenerationError}
              />
              ) : (
              <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-full">
                Clear all filters
              </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6 text-center">
            Your Courses{" "}
            <span className="font-normal">({filtered.length})</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Explore public courses — hidden for parents */}
      {!isParent && !publicLoading && publicCourses.length > 0 && (
        <section className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-center gap-2 mb-6">
            <IconCompass className="size-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Explore Public Courses{" "}
              <span className="font-normal">({publicCourses.length})</span>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {publicCourses.map((course) => (
              <PublicCourseCard
                key={course.id}
                course={course}
                onEnrol={handleEnrol}
                enrolling={enrollingId === course.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Background generation pill */}
      {generationJob && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className={cn(
              "flex items-center gap-3 rounded-full px-4 py-2.5 shadow-lg text-sm font-medium pointer-events-auto",
              "border backdrop-blur-sm transition-all duration-300",
              generationJob.status === "generating" &&
              "bg-background/95 border-border text-foreground",
              generationJob.status === "ready" &&
              "bg-primary text-primary-foreground border-primary/20",
              generationJob.status === "error" &&
              "bg-destructive/10 border-destructive/20 text-destructive",
            )}
          >
            {generationJob.status === "generating" && (
              <>
                <IconLoader2 className="size-4 animate-spin shrink-0 text-primary" />
                <span>
                  Generating{" "}
                  <span className="font-semibold">{generationJob.topic}</span>
                  …
                </span>
              </>
            )}
            {generationJob.status === "ready" && (
              <>
                <IconCheck className="size-4 shrink-0" />
                <span>
                  <span className="font-semibold">{generationJob.topic}</span>{" "}
                  is ready!
                </span>
                <button
                  onClick={() => {
                    router.push(`/courses/${generationJob.courseId}`);
                    setGenerationJob(null);
                  }}
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Open
                </button>
                <button
                  onClick={() => setGenerationJob(null)}
                  className="opacity-70 hover:opacity-100 transition-opacity ml-1"
                  aria-label="Dismiss"
                >
                  <IconX className="size-3.5" />
                </button>
              </>
            )}
            {generationJob.status === "error" && (
              <>
                <IconAlertCircle className="size-4 shrink-0" />
                <span>Failed to generate course. Please try again.</span>
                <button
                  onClick={() => setGenerationJob(null)}
                  className="opacity-70 hover:opacity-100 transition-opacity ml-1"
                  aria-label="Dismiss"
                >
                  <IconX className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
