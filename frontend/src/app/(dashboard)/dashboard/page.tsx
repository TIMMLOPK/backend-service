"use client";

import Link from "next/link";
import { IconPlus, IconClock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { cn } from "@/lib/utils";
import type { Course, CourseTopic } from "@/lib/types";
import { TOPIC_LABELS } from "@/lib/constants";

const TOPIC_CARD_COLORS: Record<CourseTopic | "default", string> = {
  math: "bg-purple-50 border-purple-200",
  science: "bg-green-50 border-green-200",
  history: "bg-orange-50 border-orange-200",
  art: "bg-pink-50 border-pink-200",
  music: "bg-rose-50 border-rose-200",
  other: "bg-blue-50 border-blue-200",
  default: "bg-blue-50 border-blue-200",
};

function CloudCard({
  course,
  progress,
  className,
}: {
  course: Course;
  progress?: number;
  className?: string;
}) {
  const colorClass =
    TOPIC_CARD_COLORS[course.topic as CourseTopic] ??
    TOPIC_CARD_COLORS.default;
  const topicLabel = TOPIC_LABELS[course.topic as CourseTopic] ?? "Course";

  return (
    <Link
      href={`/courses/${course.id}`}
      style={{ viewTransitionName: `course-card-${course.id}` }}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 w-32 sm:w-36 md:w-44 shrink-0",
        "transition-all duration-200 hover:scale-105 hover:shadow-lg hover:rotate-0 hover:z-10",
        colorClass,
        className,
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
      {progress !== undefined && progress > 0 && (
        <div className="h-1 w-full rounded-full bg-black/10 overflow-hidden mt-0.5">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { recentCourses, courseProgress, loading } = useDashboard();

  if (!user) return null;

  if (loading) return null;

  if (recentCourses.length === 0) {
    return (
      <div className="space-y-8 mt-8">
        <EmptyState />
      </div>
    );
  }

  const prog = (id: string) => courseProgress[id];
  const [c0, c1, c2, c3] = recentCourses;
  const count = recentCourses.length;

  const createButton = (
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
  );

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-8">
      <div className="mb-6 text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick up where you left off
        </p>
      </div>

      <div className="flex flex-col items-center">
        {count >= 2 && (
          /* Row 1 — two cards */
          <div className="flex items-start justify-center w-full gap-2">
            <CloudCard
              course={c0}
              progress={prog(c0.id)}
              className="-rotate-3 mt-3 mr-6 sm:mt-4 sm:mr-10 md:mt-6 md:mr-16"
            />
            <CloudCard
              course={c1}
              progress={prog(c1.id)}
              className="rotate-2 -mt-1 ml-8 sm:ml-12 md:ml-20"
            />
          </div>
        )}

        {/* Row 2 — optional card · button · optional card */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 -mt-2">
          {count === 1 ? (
            <>
              <CloudCard
                course={c0}
                progress={prog(c0.id)}
                className="-rotate-2 mt-2"
              />
              {createButton}
            </>
          ) : (
            <>
              {c2 && (
                <CloudCard
                  course={c2}
                  progress={prog(c2.id)}
                  className="rotate-1 mt-2 md:mt-4"
                />
              )}
              {createButton}
              {c3 && (
                <CloudCard
                  course={c3}
                  progress={prog(c3.id)}
                  className="-rotate-2 -mt-2 md:-mt-3"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
