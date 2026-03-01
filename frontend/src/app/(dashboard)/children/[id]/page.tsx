"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Trophy,
  TrendingUp,
  Clock,
  BarChart2,
} from "lucide-react";
import { IconLoader2 } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { TOPIC_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ChildSummary, ChildCourse, CourseTopic, CourseDifficulty } from "@/lib/types";

const TOPIC_COLORS: Record<string, string> = {
  math: "bg-purple-50 border-purple-200",
  science: "bg-green-50 border-green-200",
  history: "bg-orange-50 border-orange-200",
  art: "bg-pink-50 border-pink-200",
  music: "bg-rose-50 border-rose-200",
  other: "bg-blue-50 border-blue-200",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", color)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function CourseProgressCard({ course }: { course: ChildCourse }) {
  const colorClass = TOPIC_COLORS[course.topic] ?? "bg-blue-50 border-blue-200";
  const topicLabel = TOPIC_LABELS[course.topic as CourseTopic] ?? "Course";
  const diffLabel = DIFFICULTY_LABELS[course.difficulty as CourseDifficulty] ?? course.difficulty;

  return (
    <Card className={cn("p-4 border", colorClass)}>
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {course.name}
          </h4>
          <span className="text-xs font-bold text-gray-700 shrink-0 mt-0.5">
            {course.completion_pct}%
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {topicLabel}
          </Badge>
          <Badge variant="outline" className="text-[10px] capitalize">
            {diffLabel}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{course.estimated_hours}h</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="w-full bg-white/60 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                course.completion_pct >= 80
                  ? "bg-green-500"
                  : course.completion_pct >= 40
                    ? "bg-primary"
                    : "bg-orange-400",
              )}
              style={{ width: `${course.completion_pct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500">
            {course.completed_sections} / {course.total_sections} sections
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [summary, setSummary] = useState<ChildSummary | null>(null);
  const [courses, setCourses] = useState<ChildCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.user_type !== "parent") {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const [summaryData, coursesData] = await Promise.all([
          api<ChildSummary>(`/api/v1/parent/children/${id}/summary`),
          api<ChildCourse[]>(`/api/v1/parent/children/${id}/courses`),
        ]);
        setSummary(summaryData);
        setCourses(coursesData);
      } catch {
        setError("Failed to load child details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link
          href="/children"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Children
        </Link>
        <Card className="p-8 text-center">
          <p className="text-gray-500">{error ?? "Child not found."}</p>
        </Card>
      </div>
    );
  }

  const completionPct =
    summary.total_sections > 0
      ? Math.round((summary.completed_sections / summary.total_sections) * 100)
      : 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/children"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Children
      </Link>

      {/* Child header */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar name={summary.child.full_name} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {summary.child.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge>@{summary.child.username}</Badge>
              <span className="text-sm text-gray-500">{summary.child.email}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={courses.length}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Sections Done"
          value={summary.completed_sections}
          sub={`of ${summary.total_sections} total`}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Overall Progress"
          value={`${completionPct}%`}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={Trophy}
          label="Best Quiz"
          value={
            summary.best_quiz_percentage != null
              ? `${summary.best_quiz_percentage}%`
              : "—"
          }
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Courses */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Courses &amp; Progress
          </h3>
        </div>

        {courses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-gray-500">
              {summary.child.full_name} hasn&apos;t started any courses yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.map((course) => (
              <CourseProgressCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
