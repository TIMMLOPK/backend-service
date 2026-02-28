"use client";

import Link from "next/link";
import { PlayCircle, RotateCcw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Recommendation } from "@/lib/hooks/use-dashboard";

const RECOMMENDATION_CONFIG = {
  continue: {
    icon: PlayCircle,
    bg: "bg-primary/10",
    iconColor: "text-primary",
    label: "Continue",
  },
  review: {
    icon: RotateCcw,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    label: "Review",
  },
  try_new: {
    icon: Sparkles,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    label: "Try New",
  },
} as const;

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Recommended for You
      </h3>
      <div className="space-y-2">
        {recommendations.map((rec, i) => {
          const config = RECOMMENDATION_CONFIG[rec.type];
          const Icon = config.icon;

          return (
            <Link key={`${rec.courseId}-${rec.materialType}-${i}`} href={`/courses/${rec.courseId}`}>
              <Card hover className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {rec.courseName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {rec.message}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.iconColor}`}
                  >
                    {config.label}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
