"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Upload,
  Loader2,
  Brain,
  Layers,
  CreditCard,
  HelpCircle,
  PenTool,
  CheckCircle,
  Link2,
  ArrowUpDown,
  Scale,
  FileText,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { Card } from "@/components/ui/card";
import { api, ApiError, getErrorMessage } from "@/lib/api";
import type { GenerateCourseResponse, CourseDifficulty, CourseType } from "@/lib/types";

const STEPS = [
  { label: "Topic", description: "What do you want to learn?" },
  { label: "Details", description: "Customise your course" },
  { label: "Materials", description: "Add reference materials" },
  { label: "Generate", description: "Let AI create your course" },
];

const GENERATION_PHASES = [
  { icon: Brain, text: "Analysing your topic..." },
  { icon: Layers, text: "Designing course structure..." },
  { icon: BookOpen, text: "Writing lectures..." },
  { icon: Sparkles, text: "Adding fun facts and tips..." },
  { icon: CreditCard, text: "Generating flashcards..." },
  { icon: Link2, text: "Creating matching exercises..." },
  { icon: HelpCircle, text: "Creating quizzes..." },
  { icon: ArrowUpDown, text: "Building ordering challenges..." },
  { icon: Scale, text: "Writing true/false statements..." },
  { icon: FileText, text: "Crafting case studies..." },
  { icon: FolderTree, text: "Designing sorting activities..." },
  { icon: PenTool, text: "Building exercises..." },
  { icon: CheckCircle, text: "Finalising your course..." },
];

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const COURSE_TYPE_OPTIONS = [
  { value: "academic", label: "Academic" },
  { value: "hobby", label: "Hobby" },
  { value: "job", label: "Professional / Job" },
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
  "Physical Education",
];

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Form state
  const [topic, setTopic] = useState("");
  const [courseType, setCourseType] = useState<CourseType>("academic");
  const [difficulty, setDifficulty] = useState<CourseDifficulty>("beginner");
  const [description, setDescription] = useState("");

  // Cycle through generation phases every 4 seconds
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % GENERATION_PHASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [generating]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setPhaseIndex(0);

    try {
      const result = await api<GenerateCourseResponse>(
        "/api/v1/courses/generate",
        {
          method: "POST",
          body: JSON.stringify({
            topic,
            difficulty,
            course_type: courseType,
            additional_details: description || undefined,
          }),
        },
      );
      router.push(`/courses/${result.course.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(getErrorMessage(err.code));
      } else {
        setError("Something went wrong. Please try again.");
      }
      setGenerating(false);
    }
  };

  const currentPhase = GENERATION_PHASES[phaseIndex];
  const PhaseIcon = currentPhase.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-8">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary/20 text-primary-foreground ring-2 ring-primary/20"
                      : "bg-gray-100 text-gray-400",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={clsx(
                  "text-xs mt-1.5 hidden sm:block",
                  i <= step ? "text-muted-foreground font-medium" : "text-gray-400",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={clsx(
                  "h-0.5 w-8 sm:w-16 mx-2",
                  i < step ? "bg-primary" : "bg-gray-200",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              What would you like to learn?
            </h3>
            <p className="text-sm text-gray-500">
              Enter a topic or choose from our categories. AI will generate a
              complete course for you.
            </p>
            <Input
              label="Topic"
              placeholder="e.g. Introduction to Machine Learning"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Or pick a category
              </p>
              <div className="flex flex-wrap gap-2">
                {TOPIC_SUGGESTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={clsx(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      topic === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Customise your course
            </h3>
            <p className="text-sm text-gray-500">
              Fine-tune the AI to generate exactly what you need.
            </p>
            <Select
              label="Course Type"
              value={courseType}
              onChange={(e) => setCourseType(e.target.value as CourseType)}
              options={COURSE_TYPE_OPTIONS}
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
              options={DIFFICULTY_OPTIONS}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Additional Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Any specific areas you'd like covered..."
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Reference Materials
            </h3>
            <p className="text-sm text-gray-500">
              Optionally upload notes, textbooks, or slides to guide the AI.
            </p>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center transition-colors hover:border-primary/20 hover:bg-primary/20/30">
              <Upload className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">
                Drag & drop files here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOCX, or images — up to 10MB each
              </p>
              <Button variant="secondary" size="sm" className="mt-4">
                Browse Files
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              This is optional. The AI can generate a course without any
              materials.
            </p>
          </div>
        )}

        {step === 3 && !generating && (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ready to generate!
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Our AI will create a personalised course on{" "}
              <strong className="text-gray-900">{topic || "your topic"}</strong>{" "}
              with lectures, quizzes, flashcards, and interactive materials.
            </p>
            <div className="rounded-xl bg-gray-50 p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Topic</span>
                <span className="font-medium text-gray-900">
                  {topic || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-900 capitalize">
                  {courseType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Difficulty</span>
                <span className="font-medium text-gray-900 capitalize">{difficulty}</span>
              </div>
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {step === 3 && generating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-500">
                <PhaseIcon className="h-8 w-8 text-primary-foreground transition-all duration-500" />
              </div>
              <div className="absolute -inset-3 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Generating your course...
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Our AI agents are crafting lessons, quizzes, and flashcards
              tailored just for you. This usually takes 20–40 seconds.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-foreground transition-all duration-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="transition-all duration-500">{currentPhase.text}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={step === 0 || generating}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button onClick={next} disabled={step === 0 && !topic}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          !generating && (
            <Button onClick={handleGenerate}>
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
          )
        )}
      </div>
    </div>
  );
}
