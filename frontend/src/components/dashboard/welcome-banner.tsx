"use client";

import { Sparkles } from "lucide-react";

interface WelcomeBannerProps {
  name: string;
}

export function WelcomeBanner({ name }: WelcomeBannerProps) {
  const firstName = name.split(" ")[0];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-foreground to-primary p-6 lg:p-8 text-white">
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute top-4 right-32 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
          <span className="text-sm text-primary-foreground">Welcome back</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold mb-2">
          Hey, {firstName}!
        </h2>
        <p className="text-primary-foreground max-w-lg">
          Ready to continue learning? Pick up where you left off or explore
          something new.
        </p>
      </div>
    </div>
  );
}
