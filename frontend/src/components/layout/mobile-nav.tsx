"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Plus,
  User,
  Users,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/constants";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Courses",
    href: ROUTES.COURSES,
    icon: <Library className="h-5 w-5" />,
  },
  {
    label: "Create Course",
    href: ROUTES.COURSE_CREATE,
    icon: <Plus className="h-5 w-5" />,
  },
  {
    label: "Profile",
    href: ROUTES.PROFILE,
    icon: <User className="h-5 w-5" />,
  },
  {
    label: "My Children",
    href: ROUTES.CHILDREN,
    icon: <Users className="h-5 w-5" />,
    parentOnly: true,
  },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
    onClose();
  };

  const filteredItems = navItems.filter(
    (item) => !item.parentOnly || user?.user_type === "parent",
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-foreground">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Mentova</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {filteredItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
