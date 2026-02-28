"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { CheckCircle, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FillInTheBlankData } from "@/lib/types";

interface FillBlankSection {
  title: string;
  data: FillInTheBlankData;
}

interface FillBlankViewerProps {
  sections: FillBlankSection[];
  onComplete?: () => void;
}

interface BlankState {
  userAnswers: string[];
  checked: boolean;
  results: boolean[];
}

export function FillBlankViewer({ sections, onComplete }: FillBlankViewerProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [states, setStates] = useState<BlankState[]>(
    sections.map((s) => ({
      userAnswers: s.data.answers.map(() => ""),
      checked: false,
      results: s.data.answers.map(() => false),
    })),
  );

  if (sections.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No exercises available.
      </p>
    );
  }

  const handleInputChange = (
    sectionIdx: number,
    blankIdx: number,
    value: string,
  ) => {
    setStates((prev) => {
      const next = [...prev];
      const state = { ...next[sectionIdx] };
      state.userAnswers = [...state.userAnswers];
      state.userAnswers[blankIdx] = value;
      next[sectionIdx] = state;
      return next;
    });
  };

  const checkAnswers = (sectionIdx: number) => {
    const section = sections[sectionIdx];
    setStates((prev) => {
      const next = [...prev];
      const state = { ...next[sectionIdx] };
      state.checked = true;
      state.results = section.data.answers.map(
        (correctAnswer, i) =>
          state.userAnswers[i].trim().toLowerCase() ===
          correctAnswer.trim().toLowerCase(),
      );
      next[sectionIdx] = state;
      return next;
    });
    // Fire completion callback after checking answers
    onComplete?.();
  };

  const resetSection = (sectionIdx: number) => {
    setStates((prev) => {
      const next = [...prev];
      next[sectionIdx] = {
        userAnswers: sections[sectionIdx].data.answers.map(() => ""),
        checked: false,
        results: sections[sectionIdx].data.answers.map(() => false),
      };
      return next;
    });
  };

  const section = sections[activeSectionIndex];
  const state = states[activeSectionIndex];
  const parts = section.data.question.split("___");
  let blankIdx = 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Section pills */}
      {sections.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {sections.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSectionIndex(idx)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeSectionIndex === idx
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div
        className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
      >
        <div className="text-sm text-gray-400 font-medium">
          {section.title}
        </div>
        <div className="text-base leading-relaxed text-gray-900 flex flex-wrap items-center gap-1">
          {parts.map((part, partIdx) => {
            const currentBlank = blankIdx;
            const isLastPart = partIdx === parts.length - 1;
            if (!isLastPart) blankIdx++;

            return (
              <span key={partIdx} className="inline-flex items-center gap-1 flex-wrap">
                <span>{part}</span>
                {!isLastPart && (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={state.userAnswers[currentBlank]}
                      onChange={(e) =>
                        handleInputChange(
                          activeSectionIndex,
                          currentBlank,
                          e.target.value,
                        )
                      }
                      disabled={state.checked}
                      placeholder="..."
                      className={clsx(
                        "inline-block w-28 px-2 py-1 text-sm rounded-lg border-2 text-center font-medium outline-none transition-all",
                        state.checked
                          ? state.results[currentBlank]
                            ? "border-green-400 bg-green-50 text-green-700"
                            : "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                      )}
                    />
                    {state.checked &&
                      (state.results[currentBlank] ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-red-500 font-medium">
                          {section.data.answers[currentBlank]}
                        </span>
                      ))}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          {!state.checked ? (
            <Button
              size="sm"
              onClick={() => checkAnswers(activeSectionIndex)}
              disabled={state.userAnswers.some((a) => !a.trim())}
            >
              Check Answers
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => resetSection(activeSectionIndex)}
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>

      {/* Prev/Next navigation */}
      {sections.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveSectionIndex((prev) => prev - 1)}
            disabled={activeSectionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            {activeSectionIndex + 1} / {sections.length}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveSectionIndex((prev) => prev + 1)}
            disabled={activeSectionIndex === sections.length - 1}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
