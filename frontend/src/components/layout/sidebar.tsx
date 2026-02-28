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
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  parentOnly?: boolean;
}

const navItems: NavItem[] = [
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  const filteredItems = navItems.filter(
    (item) => !item.parentOnly || user?.user_type === "parent",
  );

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col border-r border-gray-100 bg-white lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-foreground">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">Mentova</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
