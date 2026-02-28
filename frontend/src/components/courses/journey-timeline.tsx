"use client";

import { clsx } from "clsx";
import {
  BookOpen,
  CreditCard,
  HelpCircle,
  PenTool,
  ListChecks,
  CheckCircle,
  Circle,
  Link2,
  ArrowUpDown,
  Scale,
  FileText,
  FolderTree,
  Sparkles,
} from "lucide-react";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";
import type { JourneyStep, CourseMaterialType } from "@/lib/types";

const MATERIAL_ICONS: Record<CourseMaterialType, typeof BookOpen> = {
  lecture: BookOpen,
  flashcards: CreditCard,
  quiz: HelpCircle,
  fill_in_the_blank: PenTool,
  multiple_choice: ListChecks,
  matching: Link2,
  ordering: ArrowUpDown,
  true_false: Scale,
  case_study: FileText,
  sorting: FolderTree,
  spotlight: Sparkles,
};

interface JourneyTimelineProps {
  steps: JourneyStep[];
  activeStepIndex: number;
  recommendedStepIndex: number | null;
  onStepClick: (index: number) => void;
}

export function JourneyTimeline({
  steps,
  activeStepIndex,
  recommendedStepIndex,
  onStepClick,
}: JourneyTimelineProps) {
  return (
    <div className="space-y-0.5">
      {steps.map((step, idx) => {
        const Icon = MATERIAL_ICONS[step.material_type] || BookOpen;
        const isActive = idx === activeStepIndex;
        const isRecommended = idx === recommendedStepIndex;
        const isCompleted = step.is_completed;

        const prevStep = idx > 0 ? steps[idx - 1] : null;
        const isNewSubtopic = prevStep && prevStep.subtopic_title !== step.subtopic_title;

        return (
          <div key={`${step.material_id}-${step.section_index}-${step.material_type}`}>
            {isNewSubtopic && <div className="my-2 border-t border-border/50" />}
            <button
              onClick={() => onStepClick(idx)}
              className={clsx(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : isCompleted
                    ? "text-muted-foreground hover:bg-muted/60"
                    : "text-foreground/70 hover:bg-muted/60",
              )}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : isActive || isRecommended ? (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-primary/80 bg-primary/20 animate-pulse" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </div>

              <Icon
                className={clsx(
                  "h-3 w-3 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground/60",
                )}
              />

              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium leading-tight">
                  {MATERIAL_TYPE_LABELS[step.material_type]}
                </div>
                <div
                  className={clsx(
                    "truncate text-[10px] leading-tight mt-0.5",
                    isActive ? "text-primary/80" : "text-muted-foreground/70",
                  )}
                >
                  {step.subtopic_title}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface JourneyProgressBarProps {
  totalSteps: number;
  completedSteps: number;
  steps: JourneyStep[];
  activeStepIndex: number;
  onStepClick: (index: number) => void;
}

export function JourneyProgressBar({
  totalSteps,
  completedSteps,
  steps,
  activeStepIndex,
  onStepClick,
}: JourneyProgressBarProps) {
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {completedSteps}/{totalSteps} steps
        </span>
        <span className="font-medium text-primary">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/80 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Mobile: compact step pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={`${step.material_id}-${step.section_index}-${step.material_type}`}
              onClick={() => onStepClick(idx)}
              className={clsx(
                "shrink-0 h-1.5 rounded-full transition-all cursor-pointer",
                isActive
                  ? "w-6 bg-primary/80"
                  : step.is_completed
                    ? "w-2 bg-green-400"
                    : "w-2 bg-gray-200",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
