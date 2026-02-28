"use client";

import Link from "next/link";
import { Library, Plus, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

const actions = [
  {
    label: "Browse Courses",
    description: "Explore AI-generated courses on any topic",
    href: ROUTES.COURSES,
    icon: <Library className="h-6 w-6" />,
    gradient: "from-primary to-primary-foreground",
  },
  {
    label: "Create with AI",
    description: "Generate a personalised course in minutes",
    href: ROUTES.COURSE_CREATE,
    icon: <Plus className="h-6 w-6" />,
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    label: "All Courses",
    description: "View and manage all your courses",
    href: ROUTES.COURSES,
    icon: <BarChart3 className="h-6 w-6" />,
    gradient: "from-emerald-500 to-teal-500",
  },
];

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card hover className="p-5 h-full">
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-3`}
              >
                {action.icon}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {action.label}
              </h4>
              <p className="text-sm text-gray-500">{action.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
