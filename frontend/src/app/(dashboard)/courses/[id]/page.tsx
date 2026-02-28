"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconClock,
  IconPlus,
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
  IconChevronDown,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/ui/spinner";
import { JourneyTimeline } from "@/components/courses/journey-timeline";
import { StepContent } from "@/components/courses/step-content";
import { SpecialisationPanel } from "@/components/courses/specialisation-panel";
import { useJourney } from "@/lib/hooks/use-journey";
import { TOPIC_GRADIENTS, TOPIC_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, MATERIAL_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function CourseViewPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [extendOpen, setExtendOpen] = useState(false);

  const {
    course,
    materials,
    journey,
    activeStepIndex,
    loading,
    showSpecialisation,
    goNext,
    goPrev,
    goToStep,
    handleComplete,
    refreshJourney,
    currentStep,
    extensionPrompt,
    setExtensionPrompt,
    extending,
    handleExtend,
  } = useJourney(courseId);

  if (loading) return <FullPageSpinner />;
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <h3 className="text-lg font-semibold">Course not found</h3>
        <p className="text-sm text-muted-foreground">
          This course may have been deleted or you don&apos;t have access.
        </p>
        <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  const gradient = course.colour
    ? [course.colour, course.colour]
    : TOPIC_GRADIENTS[course.topic] || TOPIC_GRADIENTS.other;
  const topicLabel = TOPIC_LABELS[course.topic] || "Other";
  const diffLabel = DIFFICULTY_LABELS[course.difficulty] || course.difficulty;
  const diffColor = DIFFICULTY_COLORS[course.difficulty] || {
    bg: "bg-secondary",
    text: "text-secondary-foreground",
  };

  const pct =
    journey && journey.total_steps > 0
      ? Math.round((journey.completed_steps / journey.total_steps) * 100)
      : 0;

  const hasPrev = activeStepIndex > 0;
  const hasNext = journey ? activeStepIndex < journey.steps.length - 1 : false;

  const prevStep = journey && hasPrev ? journey.steps[activeStepIndex - 1] : null;
  const nextStep = journey && hasNext ? journey.steps[activeStepIndex + 1] : null;

  return (
    <div className="max-w-5xl py-4 space-y-6">
      {/* ── Compact top row: back + progress ── */}
      <div className="flex items-center gap-4">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <IconArrowLeft className="size-4" />
          <span className="hidden sm:inline">Courses</span>
        </Link>

        {journey && (
          <div className="flex items-center gap-2.5 ml-auto text-xs text-muted-foreground">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-semibold text-primary tabular-nums">{pct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Hero strip ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          viewTransitionName: `course-card-${courseId}`,
        }}
      >
        <div className="relative p-5 sm:p-6">
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
          <div className="relative space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-white/90 px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                {topicLabel}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full",
                  diffColor.bg,
                  diffColor.text,
                )}
              >
                {diffLabel}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-white/70 ml-auto">
                <IconClock className="size-3" />
                ~{course.estimated_hours}h
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {course.name}
            </h1>

            {course.description && (
              <p className="text-xs text-white/70 leading-relaxed line-clamp-2 max-w-2xl">
                {course.description}
              </p>
            )}

            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/15 text-white/80"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Journey layout ── */}
      {journey && journey.steps.length > 0 ? (
        <div className="flex gap-5 lg:gap-6">
          {/* Sidebar timeline — desktop only */}
          <div className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <JourneyTimeline
                steps={journey.steps}
                activeStepIndex={activeStepIndex}
                recommendedStepIndex={journey.recommended_step_index}
                onStepClick={goToStep}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 min-w-0 lg:border-l lg:border-border/40 lg:pl-6">
            {currentStep ? (
              <StepContent
                step={currentStep}
                materials={materials}
                courseId={courseId}
                onComplete={() =>
                  handleComplete(currentStep.material_id, currentStep.section_index)
                }
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Select a step from the timeline to begin.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No materials available for this course yet.
        </p>
      )}

      {/* ── Floating step nav — sits above AppBottomNav ── */}
      {journey && journey.steps.length > 0 && currentStep && (
        <div className="fixed bottom-18 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center bg-background/90 backdrop-blur-xl border border-border rounded-[20px] shadow-xl shadow-black/10 px-1.5 py-1.5 gap-0.5">
            {/* Previous */}
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-xs font-medium transition-colors max-w-[130px]",
                hasPrev
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                  : "text-muted-foreground/30 cursor-not-allowed",
              )}
            >
              <IconChevronLeft className="size-3.5 shrink-0" />
              <span className="truncate hidden sm:block">
                {prevStep ? MATERIAL_TYPE_LABELS[prevStep.material_type] : "Start"}
              </span>
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-0.5 shrink-0" />

            {/* Step counter */}
            <span className="px-3 py-2 text-xs text-muted-foreground tabular-nums font-medium">
              {activeStepIndex + 1} / {journey.steps.length}
            </span>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-0.5 shrink-0" />

            {/* Next */}
            <button
              onClick={goNext}
              disabled={!hasNext}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-xs font-medium transition-colors max-w-[130px]",
                hasNext
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                  : "text-muted-foreground/30 cursor-not-allowed",
              )}
            >
              <span className="truncate hidden sm:block">
                {nextStep ? MATERIAL_TYPE_LABELS[nextStep.material_type] : "Done"}
              </span>
              <IconChevronRight className="size-3.5 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ── Specialisation ── */}
      {showSpecialisation && (
        <div className="pt-6 border-t border-border/40">
          <SpecialisationPanel courseId={courseId} onContentGenerated={refreshJourney} />
        </div>
      )}

      {/* ── Extend course — collapsible ── */}
      <div className="pt-6 border-t border-border/40">
        <button
          onClick={() => setExtendOpen((v) => !v)}
          className="flex items-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconSparkles className="size-4 text-primary shrink-0" />
          <span className="font-medium">Extend this course</span>
          <IconChevronDown
            className={cn("size-4 ml-auto transition-transform duration-200", extendOpen && "rotate-180")}
          />
        </button>

        {extendOpen && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Add new sections to all material types with a custom prompt.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={extensionPrompt}
                onChange={(e) => setExtensionPrompt(e.target.value)}
                placeholder="e.g. Add a section about advanced techniques..."
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm bg-transparent outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-[color,box-shadow]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExtend();
                }}
              />
              <Button onClick={handleExtend} disabled={!extensionPrompt.trim() || extending}>
                {extending ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconPlus className="size-4" />
                )}
                {extending ? "Extending..." : "Extend"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
