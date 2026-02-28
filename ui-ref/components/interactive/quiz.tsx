"use client"

import { useState } from "react"
import { IconCheck, IconX, IconCircle } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { QuizProps } from "@/lib/types"
import { useEngagement } from "@/lib/engagement-context"

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
  medium: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
  hard: "text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400",
}

export function QuizComponent({
  props,
  componentId = "quiz-unknown",
}: {
  props: QuizProps
  componentId?: string
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const { trackInteraction } = useEngagement()

  const isCorrect = selected === props.correct_index

  const handleSubmit = () => {
    if (selected === null) return
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    setSubmitted(true)
    trackInteraction(componentId, "Quiz", selected === props.correct_index, nextAttempts)
  }

  const handleReset = () => {
    setSelected(null)
    setSubmitted(false)
  }

  return (
    <div className="my-6 rounded-2xl border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Knowledge Check
        </span>
        {props.difficulty && (
          <span
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0",
              DIFFICULTY_CLASS[props.difficulty]
            )}
          >
            {DIFFICULTY_LABEL[props.difficulty]}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-sm font-medium leading-relaxed mb-4">{props.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {props.options.map((option, i) => {
          const isSelected = selected === i
          const isRight = submitted && i === props.correct_index
          const isWrong = submitted && isSelected && !isCorrect

          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => !submitted && setSelected(i)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-left transition-colors border",
                !submitted && isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : !submitted
                  ? "border-border bg-background hover:bg-muted/60 text-foreground"
                  : isRight
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                  : isWrong
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200"
                  : "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              <span className="shrink-0">
                {isRight ? (
                  <IconCheck className="size-4 text-emerald-500" />
                ) : isWrong ? (
                  <IconX className="size-4 text-red-500" />
                ) : (
                  <IconCircle className={cn("size-4", isSelected ? "text-primary" : "text-muted-foreground/40")} />
                )}
              </span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {submitted && props.explanation && (
        <div
          className={cn(
            "mt-4 rounded-xl p-4 text-sm leading-relaxed border",
            isCorrect
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
          )}
        >
          <span className="font-semibold">{isCorrect ? "Correct! " : "Not quite. "}</span>
          {props.explanation}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {!submitted ? (
          <button
            disabled={selected === null}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted/60 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
