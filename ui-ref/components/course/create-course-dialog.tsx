"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import {
  IconPlus,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCode,
  IconCalculator,
  IconAtom,
  IconLanguage,
  IconBook,
  IconPalette,
  IconBriefcase,
  IconTool,
  IconClock,
  IconTag,
  IconWorld,
  IconLock,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { CourseCategory, CourseLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

// ─── Static data ────────────────────────────────────────────────────────────

const CATEGORIES: {
  id: CourseCategory
  label: string
  icon: ReactNode
  colorClass: string
}[] = [
  {
    id: "computer-science",
    label: "CS",
    icon: <IconCode className="size-5" />,
    colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  },
  {
    id: "mathematics",
    label: "Math",
    icon: <IconCalculator className="size-5" />,
    colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-950",
  },
  {
    id: "science",
    label: "Science",
    icon: <IconAtom className="size-5" />,
    colorClass: "text-green-500 bg-green-50 dark:bg-green-950",
  },
  {
    id: "language",
    label: "Language",
    icon: <IconLanguage className="size-5" />,
    colorClass: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  },
  {
    id: "history",
    label: "History",
    icon: <IconBook className="size-5" />,
    colorClass: "text-orange-500 bg-orange-50 dark:bg-orange-950",
  },
  {
    id: "arts",
    label: "Arts",
    icon: <IconPalette className="size-5" />,
    colorClass: "text-pink-500 bg-pink-50 dark:bg-pink-950",
  },
  {
    id: "business",
    label: "Business",
    icon: <IconBriefcase className="size-5" />,
    colorClass: "text-teal-500 bg-teal-50 dark:bg-teal-950",
  },
  {
    id: "engineering",
    label: "Engineering",
    icon: <IconTool className="size-5" />,
    colorClass: "text-red-500 bg-red-50 dark:bg-red-950",
  },
]

const LEVELS: { id: CourseLevel; label: string; description: string }[] = [
  { id: "beginner", label: "Beginner", description: "No prior knowledge" },
  { id: "intermediate", label: "Intermediate", description: "Some experience" },
  { id: "advanced", label: "Advanced", description: "Strong foundation" },
  { id: "expert", label: "Expert", description: "Mastery level" },
]

const STEPS = [
  { label: "Basics", title: "Course Basics", subtitle: "Give your course a name and describe what students will learn." },
  { label: "Category", title: "Category & Level", subtitle: "Help learners find your course by choosing a subject and difficulty level." },
  { label: "Details", title: "Finishing Touches", subtitle: "Set time estimates, add optional tags, and choose visibility." },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  title: string
  description: string
  category: CourseCategory | ""
  level: CourseLevel | ""
  estimatedHours: string
  tags: string
  isPublic: boolean
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "",
  level: "",
  estimatedHours: "",
  tags: "",
  isPublic: true,
}

type StepErrors = Partial<Record<keyof FormState, string>>

interface StepProps {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  errors: StepErrors
}

// ─── Step indicator ──────────────────────────────────────────────────────────

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
                  : "bg-muted text-muted-foreground"
              )}
            >
              {idx < currentStep ? <IconCheck className="size-4" /> : idx + 1}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium leading-none",
                idx <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px mt-4 mx-2 transition-colors duration-300",
                idx < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Basics ──────────────────────────────────────────────────────────

function StepBasics({ form, setForm, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="cc-title">Course Title</FieldLabel>
        <Input
          id="cc-title"
          placeholder="e.g. Introduction to Calculus"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          aria-invalid={!!errors.title}
          autoFocus
        />
        <FieldError errors={[{ message: errors.title }]} />
      </Field>

      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor="cc-description">Description</FieldLabel>
        <Textarea
          id="cc-description"
          placeholder="What will students learn in this course?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          aria-invalid={!!errors.description}
          className="min-h-28 resize-none"
        />
        <FieldError errors={[{ message: errors.description }]} />
      </Field>
    </div>
  )
}

// ─── Step 2: Category & Level ────────────────────────────────────────────────

function StepCategory({ form, setForm, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <Field data-invalid={!!errors.category}>
        <FieldLabel>Subject Category</FieldLabel>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {CATEGORIES.map((cat) => {
            const selected = form.category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-150 hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border text-muted-foreground"
                )}
              >
                <div className={cn("p-2 rounded-lg", cat.colorClass)}>
                  {cat.icon}
                </div>
                {cat.label}
              </button>
            )
          })}
        </div>
        <FieldError errors={[{ message: errors.category }]} />
      </Field>

      <Field data-invalid={!!errors.level}>
        <FieldLabel>Difficulty Level</FieldLabel>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {LEVELS.map((lvl) => {
            const selected = form.level === lvl.id
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, level: lvl.id }))}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border p-3 transition-all duration-150 hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-primary" : "text-foreground"
                  )}
                >
                  {lvl.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{lvl.description}</span>
              </button>
            )
          })}
        </div>
        <FieldError errors={[{ message: errors.level }]} />
      </Field>
    </div>
  )
}

// ─── Step 3: Details ─────────────────────────────────────────────────────────

function StepDetails({ form, setForm, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <Field data-invalid={!!errors.estimatedHours}>
        <FieldLabel htmlFor="cc-hours" className="flex items-center gap-1.5">
          <IconClock className="size-3.5" />
          Estimated Hours
        </FieldLabel>
        <Input
          id="cc-hours"
          type="number"
          min={0.5}
          step={0.5}
          placeholder="e.g. 10"
          value={form.estimatedHours}
          onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
          aria-invalid={!!errors.estimatedHours}
          className="w-40"
        />
        <FieldError errors={[{ message: errors.estimatedHours }]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="cc-tags" className="flex items-center gap-1.5">
          <IconTag className="size-3.5" />
          Tags
          <span className="text-muted-foreground font-normal">(optional, comma-separated)</span>
        </FieldLabel>
        <Input
          id="cc-tags"
          placeholder="e.g. algebra, calculus, math"
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
        />
      </Field>

      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium mb-3">Visibility</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isPublic: true }))}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border p-3 text-sm transition-all duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              form.isPublic
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            <IconWorld className="size-4 shrink-0" />
            <div className="text-left">
              <p className="font-medium text-xs leading-none mb-0.5">Public</p>
              <p className="text-[10px] text-muted-foreground">Anyone can find it</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isPublic: false }))}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border p-3 text-sm transition-all duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !form.isPublic
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            <IconLock className="size-4 shrink-0" />
            <div className="text-left">
              <p className="font-medium text-xs leading-none mb-0.5">Private</p>
              <p className="text-[10px] text-muted-foreground">Only visible to you</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export function CreateCourseDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<StepErrors>({})

  function validateStep(s: number): boolean {
    const next: StepErrors = {}
    if (s === 0) {
      if (!form.title.trim()) next.title = "Title is required"
      if (!form.description.trim()) next.description = "Description is required"
    }
    if (s === 1) {
      if (!form.category) next.category = "Please select a category"
      if (!form.level) next.level = "Please select a level"
    }
    if (s === 2) {
      if (
        !form.estimatedHours ||
        isNaN(Number(form.estimatedHours)) ||
        Number(form.estimatedHours) <= 0
      )
        next.estimatedHours = "Enter a valid number of hours"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleNext() {
    if (!validateStep(step)) return
    setErrors({})
    setStep((s) => s + 1)
  }

  function handleBack() {
    setErrors({})
    setStep((s) => s - 1)
  }

  function handleSubmit() {
    if (!validateStep(2)) return
    // TODO: wire up to real API
    console.log("Create course:", {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      estimatedHours: Number(form.estimatedHours),
    })
    handleOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setStep(0)
      setForm(EMPTY_FORM)
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="rounded-full gap-1.5">
            <IconPlus className="size-3.5" />
            Create Course
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
          {step === 0 && (
            <StepBasics form={form} setForm={setForm} errors={errors} />
          )}
          {step === 1 && (
            <StepCategory form={form} setForm={setForm} errors={errors} />
          )}
          {step === 2 && (
            <StepDetails form={form} setForm={setForm} errors={errors} />
          )}
        </div>

        <div className="flex justify-between pt-2 border-t">
          {step > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              <IconArrowLeft className="size-4 mr-1.5" />
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
              <IconArrowRight className="size-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <IconCheck className="size-4 mr-1.5" />
              Create Course
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
