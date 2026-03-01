"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconLayoutDashboard,
  IconBooks,
  IconSearch,
  IconUsers,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import type { Course } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: IconLayoutDashboard, parentOnly: false },
  { href: "/courses", label: "Courses", icon: IconBooks, parentOnly: false },
  { href: "/children", label: "Children", icon: IconUsers, parentOnly: true },
  { href: "/profile", label: "Profile", icon: null, parentOnly: false },
];

export function AppBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    setLoadingCourses(true);
    api<Course[]>("/api/v1/courses/")
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [searchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return courses
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [courses, query]);

  function openSearch() {
    setSearchOpen(true);
    setActiveIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 120);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function handleSearchSubmit(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(`/courses/${results[activeIndex].id}`);
        closeSearch();
      } else if (query.trim()) {
        router.push(`/courses?search=${encodeURIComponent(query.trim())}`);
        closeSearch();
      }
    }
    if (e.key === "Escape") {
      closeSearch();
    }
  }

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      <AnimatePresence>
        {searchOpen && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="w-72 bg-background/95 backdrop-blur-xl border border-border rounded-[16px] shadow-xl shadow-black/15 overflow-hidden"
          >
            {results.map((course, i) => (
              <button
                key={course.id}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => { router.push(`/courses/${course.id}`); closeSearch(); }}
                className={cn(
                  "w-full flex flex-col gap-0.5 px-4 py-2.5 text-left transition-colors",
                  i === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                  i > 0 && "border-t border-border/50",
                )}
              >
                <span className="text-xs font-semibold text-foreground line-clamp-1">{course.name}</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">{course.description}</span>
              </button>
            ))}
          </motion.div>
        )}
        {searchOpen && loadingCourses && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center w-48 py-3"
          >
            <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="flex items-center bg-background/90 backdrop-blur-xl border border-border rounded-[20px] shadow-xl shadow-black/15 px-1.5 py-1.5"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {searchOpen ? (
            <motion.div
              key="search"
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="flex items-center gap-2 px-3 py-2"
            >
              <IconSearch className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search courses..."
                className="w-52 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
              />
              <button
                onClick={closeSearch}
                className="size-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <IconX className="size-3" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="nav"
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="flex items-center gap-0.5"
            >
              {NAV_ITEMS.filter((item) => !item.parentOnly || user?.user_type === "parent").map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href));
                const isProfile = href === "/profile";
                return (
                  <Link key={href} href={href} className="outline-none">
                    <motion.div
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 rounded-[14px] px-3 py-2.5 overflow-hidden",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <motion.div
                        layout="position"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      >
                        {isProfile ? (
                          <div
                            className={cn(
                              "size-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all",
                              active
                                ? "bg-primary-foreground/20 text-primary-foreground ring-2 ring-primary-foreground/40"
                                : "bg-primary/15 text-primary ring-2 ring-primary/20",
                            )}
                          >
                            {initials}
                          </div>
                        ) : (
                          Icon && (
                            <Icon
                              className={cn(
                                "size-[18px] shrink-0",
                                active ? "stroke-[2.5]" : "stroke-[1.75]",
                              )}
                            />
                          )
                        )}
                      </motion.div>

                      <AnimatePresence mode="popLayout">
                        {active && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 32,
                            }}
                            className="text-[11px] font-semibold tracking-tight whitespace-nowrap overflow-hidden"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );
              })}

              <div className="w-px h-5 bg-border mx-1 shrink-0" />

              <button onClick={openSearch} className="outline-none">
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="flex items-center justify-center rounded-[14px] px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <IconSearch className="size-[18px] stroke-[1.75]" />
                </motion.div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
