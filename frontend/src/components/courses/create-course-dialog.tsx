"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconBrain,
  IconLoader2,
  IconSparkles,
  IconSchool,
  IconBriefcase,
  IconStar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api, ApiError, getErrorMessage } from "@/lib/api";
import type { CourseDifficulty, CourseType, GenerateCourseResponse } from "@/lib/types";

const COURSE_TYPES: {
  id: CourseType;
  label: string;
  description: string;
  icon: ReactNode;
  colorClass: string;
}[] = [
  {
    id: "academic",
    label: "Academic",
    description: "Structured learning",
    icon: <IconSchool className="size-5" />,
    colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  },
  {
    id: "hobby",
    label: "Hobby",
    description: "For fun & interest",
    icon: <IconStar className="size-5" />,
    colorClass: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  },
  {
    id: "job",
    label: "Professional",
    description: "Career focused",
    icon: <IconBriefcase className="size-5" />,
    colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-950",
  },
];

const LEVELS: { id: CourseDifficulty; label: string; description: string }[] =
  [
    { id: "beginner", label: "Beginner", description: "No prior knowledge" },
    {
      id: "intermediate",
      label: "Intermediate",
      description: "Some experience",
    },
    { id: "advanced", label: "Advanced", description: "Strong foundation" },
    { id: "expert", label: "Expert", description: "Mastery level" },
  ];

const TOPIC_SUGGESTIONS = [
  "Mathematics",
  "Science",
  "History",
  "Art",
  "Music",
  "Computer Science",
  "Languages",
  "Geography",
  "English",
];

const GENERATION_PHASES = [
  "Analysing your topic...",
  "Designing course structure...",
  "Writing lectures...",
  "Generating flashcards...",
  "Creating quizzes...",
  "Building exercises...",
  "Finalising your course...",
];

const STEPS = [
  {
    label: "Topic",
    title: "What do you want to learn?",
    subtitle: "Enter a topic or choose from suggestions. AI will build your course.",
  },
  {
    label: "Details",
    title: "Customise your course",
    subtitle: "Choose a course type and difficulty level to tailor the content.",
  },
  {
    label: "Generate",
    title: "Ready to create",
    subtitle: "Review your choices and let AI generate a personalised course.",
  },
];

interface FormState {
  topic: string;
  additionalDetails: string;
  courseType: CourseType;
  difficulty: CourseDifficulty;
}

type StepErrors = Partial<Record<keyof FormState, string>>;

interface StepProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: StepErrors;
}

const EMPTY_FORM: FormState = {
  topic: "",
  additionalDetails: "",
  courseType: "academic",
  difficulty: "beginner",
};

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-start pr-8">
      {STEPS.map((s, idx) => (
        <div key={s.label} className="flex items-start flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                idx < currentStep
                  ? "bg-primary text-primary-foreground"
                  : idx === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {idx < currentStep ? (
                <IconCheck className="size-4" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium leading-none",
                idx <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px mt-4 mx-2 transition-colors duration-300",
                idx < currentStep ? "bg-primary" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepTopic({ form, setForm, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <Field data-invalid={!!errors.topic}>
        <FieldLabel htmlFor="cc-topic">Topic</FieldLabel>
        <Input
          id="cc-topic"
          placeholder="e.g. Introduction to Machine Learning"
          value={form.topic}
          onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          aria-invalid={!!errors.topic}
          autoFocus
        />
        <FieldError errors={[{ message: errors.topic }]} />
      </Field>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Or pick a suggestion</p>
        <div className="flex flex-wrap gap-2">
          {TOPIC_SUGGESTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, topic: t }))}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border",
                form.topic === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Field>
        <FieldLabel htmlFor="cc-details">
          Additional Details{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </FieldLabel>
        <Textarea
          id="cc-details"
          placeholder="Any specific areas you'd like covered, learning goals, or context..."
          value={form.additionalDetails}
          onChange={(e) =>
            setForm((f) => ({ ...f, additionalDetails: e.target.value }))
          }
          className="min-h-20 resize-none"
        />
      </Field>
    </div>
  );
}

function StepDetails({ form, setForm }: StepProps) {
  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>Course Type</FieldLabel>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {COURSE_TYPES.map((ct) => {
            const selected = form.courseType === ct.id;
            return (
              <button
                key={ct.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, courseType: ct.id }))}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-150 hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border text-muted-foreground",
                )}
              >
                <div className={cn("p-2 rounded-lg", ct.colorClass)}>
                  {ct.icon}
                </div>
                <div className="text-center">
                  <p className="font-medium">{ct.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ct.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>Difficulty Level</FieldLabel>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {LEVELS.map((lvl) => {
            const selected = form.difficulty === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, difficulty: lvl.id }))}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border p-3 transition-all duration-150 hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-primary" : "text-foreground",
                  )}
                >
                  {lvl.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {lvl.description}
                </span>
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function StepGenerate({
  form,
  generating,
  phaseIndex,
  error,
}: {
  form: FormState;
  generating: boolean;
  phaseIndex: number;
  error: string | null;
}) {
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <IconBrain className="size-9 text-primary" />
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
        <h3 className="text-base font-semibold">Generating your course...</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          AI agents are crafting lessons, quizzes, and flashcards tailored just
          for you. This usually takes 20–40 seconds.
        </p>
        <div className="flex items-center gap-2 text-sm text-primary">
          <IconLoader2 className="size-4 animate-spin shrink-0" />
          <span className="transition-all duration-500">
            {GENERATION_PHASES[phaseIndex]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-4 space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <IconSparkles className="size-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          Our AI will create a personalised course on{" "}
          <strong className="text-foreground">{form.topic || "your topic"}</strong>{" "}
          with lectures, quizzes, flashcards, and interactive materials.
        </p>
      </div>

      <div className="rounded-xl border divide-y overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-muted-foreground">Topic</span>
          <span className="font-medium">{form.topic || "—"}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-muted-foreground">Type</span>
          <span className="font-medium capitalize">{form.courseType}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-muted-foreground">Difficulty</span>
          <span className="font-medium capitalize">{form.difficulty}</span>
        </div>
        {form.additionalDetails && (
          <div className="flex justify-between items-start px-4 py-3 text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Details</span>
            <span className="font-medium text-right line-clamp-2">
              {form.additionalDetails}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

interface CreateCourseDialogProps {
  trigger?: ReactNode;
  onGenerationStart?: (topic: string) => void;
  onGenerationComplete?: (courseId: string) => void;
  onGenerationError?: () => void;
}

export function CreateCourseDialog({
  trigger,
  onGenerationStart,
  onGenerationComplete,
  onGenerationError,
}: CreateCourseDialogProps) {
  const router = useRouter();
  const mountedRef = useRef(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<StepErrors>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % GENERATION_PHASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [generating]);

  function validateStep(s: number): boolean {
    const next: StepErrors = {};
    if (s === 0) {
      if (!form.topic.trim()) next.topic = "Please enter a topic";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setErrors({});
    setStep((s) => s + 1);
  }

  function handleBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setPhaseIndex(0);
    onGenerationStart?.(form.topic);

    try {
      const result = await api<GenerateCourseResponse>(
        "/api/v1/courses/generate",
        {
          method: "POST",
          body: JSON.stringify({
            topic: form.topic,
            difficulty: form.difficulty,
            course_type: form.courseType,
            additional_details: form.additionalDetails || undefined,
          }),
        },
      );
      if (mountedRef.current) {
        handleOpenChange(false);
        router.push(`/courses/${result.course.id}`);
      } else {
        onGenerationComplete?.(result.course.id);
      }
    } catch (err) {
      if (mountedRef.current) {
        if (err instanceof ApiError) {
          setError(getErrorMessage(err.code));
        } else {
          setError("Something went wrong. Please try again.");
        }
        setGenerating(false);
      } else {
        onGenerationError?.();
      }
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStep(0);
      setForm(EMPTY_FORM);
      setErrors({});
      setError(null);
      setGenerating(false);
    }
  }

  const stepProps: StepProps = { form, setForm, errors };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="rounded-full gap-1.5">
            <IconPlus className="size-3.5" />
            Create with AI
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <StepIndicator currentStep={step} />

        <DialogHeader>
          <DialogTitle>{STEPS[step].title}</DialogTitle>
          <DialogDescription>{STEPS[step].subtitle}</DialogDescription>
        </DialogHeader>

        <div className="min-h-[260px]">
          {step === 0 && <StepTopic {...stepProps} />}
          {step === 1 && <StepDetails {...stepProps} />}
          {step === 2 && (
            <StepGenerate
              form={form}
              generating={generating}
              phaseIndex={phaseIndex}
              error={error}
            />
          )}
        </div>

        {generating ? (
          <div className="flex justify-end pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} className="text-muted-foreground text-xs">
              Continue in background
            </Button>
          </div>
        ) : (
          <div className="flex justify-between pt-2 border-t">
            {step > 0 ? (
              <Button variant="outline" onClick={handleBack}>
                <IconArrowLeft className="size-4" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <IconArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={handleGenerate}>
                <IconSparkles className="size-4" />
                Generate with AI
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
