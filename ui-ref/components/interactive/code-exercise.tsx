"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import {
  IconPlayerPlay,
  IconSend,
  IconCheck,
  IconX,
  IconRefresh,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { CodeExerciseProps } from "@/lib/types"
import { useEngagement } from "@/lib/engagement-context"

const LANGUAGE_LABEL: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  c: "C",
  sql: "SQL",
}

type TestResult = { input: string; expected: string; passed: boolean }

export function CodeExerciseComponent({
  props,
  componentId = "code-unknown",
}: {
  props: CodeExerciseProps
  componentId?: string
}) {
  const [code, setCode] = useState(props.starter_code)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [runOutput, setRunOutput] = useState<string | null>(null)
  const [submitCount, setSubmitCount] = useState(0)
  const { trackInteraction } = useEngagement()

  const allPassed = results?.every((r) => r.passed) ?? false

  const handleRun = () => {
    setRunOutput(
      code.trim() === props.solution.trim()
        ? "✓ Code looks correct! (simulated)"
        : "Ran successfully — check output in Submit."
    )
  }

  const handleSubmit = () => {
    const isSolved = code.trim() === props.solution.trim()
    const nextCount = submitCount + 1
    setSubmitCount(nextCount)
    setResults(
      props.test_cases.map((tc) => ({
        input: tc.input,
        expected: tc.expected_output,
        passed: isSolved,
      }))
    )
    setSubmitted(true)
    trackInteraction(componentId, "CodeExercise", isSolved, nextCount)
  }

  const handleReset = () => {
    setCode(props.starter_code)
    setResults(null)
    setSubmitted(false)
    setRunOutput(null)
  }

  return (
    <div className="my-6 rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Code Exercise
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {LANGUAGE_LABEL[props.language] ?? props.language}
          </span>
        </div>
        <button
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Reset code"
        >
          <IconRefresh className="size-4" />
        </button>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 border-b bg-muted/20 text-sm leading-relaxed [&_strong]:font-semibold [&_code]:bg-muted [&_code]:px-1.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
        <ReactMarkdown>{props.instructions}</ReactMarkdown>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className={cn(
            "w-full font-mono text-sm leading-relaxed resize-none bg-muted/30 p-4 outline-none focus:bg-muted/50 transition-colors",
            "min-h-[160px]"
          )}
          style={{ tabSize: 4 }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault()
              const start = e.currentTarget.selectionStart
              const end = e.currentTarget.selectionEnd
              setCode(code.substring(0, start) + "    " + code.substring(end))
              requestAnimationFrame(() => {
                e.currentTarget.selectionStart = start + 4
                e.currentTarget.selectionEnd = start + 4
              })
            }
          }}
        />
      </div>

      {/* Run output */}
      {runOutput && !submitted && (
        <div className="px-4 py-2 border-t bg-muted/20 text-xs font-mono text-muted-foreground">
          {runOutput}
        </div>
      )}

      {/* Test results */}
      {results && (
        <div className="border-t">
          <div className="px-4 py-2 bg-muted/30 flex items-center gap-2">
            <span className="text-xs font-semibold">Test Results</span>
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-semibold",
                allPassed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              )}
            >
              {results.filter((r) => r.passed).length}/{results.length} passed
            </span>
          </div>
          <div className="divide-y">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-xs">
                {r.passed ? (
                  <IconCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <IconX className="size-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 space-y-0.5">
                  <p className="font-mono text-muted-foreground">{r.input}</p>
                  {!r.passed && (
                    <p className="text-red-600 dark:text-red-400">
                      Expected: <span className="font-mono">{r.expected}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-t">
        <button
          onClick={handleRun}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted/60 transition-colors"
        >
          <IconPlayerPlay className="size-3.5" />
          Run
        </button>
        <button
          onClick={handleSubmit}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            allPassed && submitted
              ? "bg-emerald-500 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {allPassed && submitted ? (
            <>
              <IconCheck className="size-3.5" />
              Solved!
            </>
          ) : (
            <>
              <IconSend className="size-3.5" />
              Submit
            </>
          )}
        </button>
      </div>
    </div>
  )
}
