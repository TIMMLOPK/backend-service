import { Library } from "lucide-react";
import { CourseCard } from "./course-card";
import type { Course } from "@/lib/types";

interface CourseGridProps {
  courses: Course[];
}

export function CourseGrid({ courses }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
          <Library className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          No courses found
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
