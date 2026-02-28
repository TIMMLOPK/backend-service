"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export function EmptyState() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 mb-4">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Start your learning journey
        </h3>
        <p className="text-gray-500 mb-6 max-w-md">
          Create your first AI-generated course and begin learning at your own
          pace with personalised materials.
        </p>
        <div className="flex gap-3">
          <Link href={ROUTES.COURSE_CREATE}>
            <Button>Create your first course</Button>
          </Link>
          <Link href={ROUTES.COURSES}>
            <Button variant="secondary">Browse courses</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
