import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChildOverview } from "@/lib/types";

interface ChildCardProps {
  child: ChildOverview;
}

export function ChildCard({ child }: ChildCardProps) {
  const hasActivity = child.total_sections > 0;

  return (
    <Link href={`/children/${child.id}`}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start gap-4">
          <Avatar name={child.full_name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-gray-900 truncate">
                {child.full_name}
              </h4>
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 group-hover:text-gray-600 transition-colors" />
            </div>
            <div className="mt-1">
              <Badge>@{child.username}</Badge>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>
                    {child.course_count}{" "}
                    {child.course_count === 1 ? "course" : "courses"}
                  </span>
                </div>
                {hasActivity && (
                  <span className="font-medium text-gray-700">
                    {child.completion_pct}% complete
                  </span>
                )}
              </div>

              {hasActivity && (
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      child.completion_pct >= 80
                        ? "bg-green-500"
                        : child.completion_pct >= 40
                          ? "bg-primary"
                          : "bg-orange-400",
                    )}
                    style={{ width: `${child.completion_pct}%` }}
                  />
                </div>
              )}

              {!hasActivity && (
                <p className="text-xs text-gray-400 italic">
                  No activity yet
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
