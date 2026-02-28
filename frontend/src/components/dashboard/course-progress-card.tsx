"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/constants";
import type { Course } from "@/lib/types";

interface CourseProgressCardProps {
  course: Course;
  progress: number;
}

export function CourseProgressCard({ course, progress }: CourseProgressCardProps) {
  const difficultyColor = DIFFICULTY_COLORS[course.difficulty];

  return (
    <Link href={`/courses/${course.id}`}>
      <Card hover className="p-4 h-full">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded-lg"
            style={{ backgroundColor: course.colour }}
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {course.name}
            </h4>
            <div className="mt-1">
              <Badge
                bg={difficultyColor?.bg}
                text={difficultyColor?.text}
              >
                {DIFFICULTY_LABELS[course.difficulty]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-primary/80 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
