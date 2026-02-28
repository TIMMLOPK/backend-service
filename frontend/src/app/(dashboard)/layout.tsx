"use client";

import { useEffect } from "react";
// @ts-expect-error — ViewTransition is available in React 19 canary
import { ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AppTopNav } from "@/components/layout/app-top-nav";
import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { ROUTES } from "@/lib/constants";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppTopNav />
      <main className="pt-16 pb-28 px-4 max-w-5xl mx-auto vt-main">
        <ViewTransition>{children}</ViewTransition>
      </main>
      <AppBottomNav />
    </div>
  );
}
