"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconLayoutDashboard,
  IconBooks,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: IconLayoutDashboard },
  { href: "/courses", label: "Courses", icon: IconBooks },
  { href: "/profile", label: "Profile", icon: null },
];

export function AppBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 120);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function handleSearchSubmit(e: React.KeyboardEvent) {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/courses?search=${encodeURIComponent(query.trim())}`);
      closeSearch();
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
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
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
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
