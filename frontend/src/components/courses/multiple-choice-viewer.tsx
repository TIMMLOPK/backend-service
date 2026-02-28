"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { MultipleChoiceData, QuizAnswerRecord } from "@/lib/types";

interface MCQSection {
  title: string;
  data: MultipleChoiceData;
}

interface MCQViewerProps {
  sections: MCQSection[];
  courseId: string;
  materialId: string;
  onComplete?: () => void;
}

interface SectionScore {
  title: string;
  correct: number;
  total: number;
}

export function MultipleChoiceViewer({
  sections,
  courseId,
  materialId,
  onComplete,
}: MCQViewerProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Set<number>>(
    new Set(),
  );
  const [submitted, setSubmitted] = useState(false);
  const [sectionScore, setSectionScore] = useState(0);
  const [sectionFinished, setSectionFinished] = useState(false);
  const [allFinished, setAllFinished] = useState(false);
  const [sectionScores, setSectionScores] = useState<SectionScore[]>([]);
  const [sectionAnswers, setSectionAnswers] = useState<QuizAnswerRecord[]>([]);

  // Explanation state
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const allQuestions = sections.flatMap((s) => s.data.questions);
  if (allQuestions.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No multi-select questions available.
      </p>
    );
  }

  const activeSection = sections[activeSectionIndex];
  const questions = activeSection.data.questions;
  const question = questions[currentIndex];

  const correctSet = new Set(
    question.answers
      .map((a, i) => (a.is_correct ? i : -1))
      .filter((i) => i >= 0),
  );

  const toggleAnswer = (idx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (submitted || selectedAnswers.size === 0) return;
    setSubmitted(true);

    // Strict match: selected set === correct set
    const isCorrect =
      selectedAnswers.size === correctSet.size &&
      [...selectedAnswers].every((i) => correctSet.has(i));

    if (isCorrect) {
      setSectionScore((prev) => prev + 1);
    }

    setSectionAnswers((prev) => [
      ...prev,
      {
        question_index: currentIndex,
        selected_answer_indices: [...selectedAnswers],
        is_correct: isCorrect,
      },
    ]);
  };

  const isCurrentCorrect = () => {
    return (
      selectedAnswers.size === correctSet.size &&
      [...selectedAnswers].every((i) => correctSet.has(i))
    );
  };

  const fetchExplanation = async () => {
    setLoadingExplanation(true);
    try {
      const correctAnswers = question.answers
        .filter((a) => a.is_correct)
        .map((a) => a.answer)
        .join(", ");
      const selectedAnswerTexts = [...selectedAnswers]
        .map((i) => question.answers[i].answer)
        .join(", ");

      const result = await api<{ explanation: string }>(
        `/api/v1/courses/${courseId}/materials/${materialId}/explain`,
        {
          method: "POST",
          body: JSON.stringify({
            question: question.question,
            selected_answer: selectedAnswerTexts,
            correct_answer: correctAnswers,
          }),
        },
      );
      setExplanation(result.explanation);
    } catch {
      setExplanation("Could not generate explanation.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const goNext = () => {
    setExplanation(null);
    setLoadingExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswers(new Set());
      setSubmitted(false);
    } else {
      setSectionFinished(true);
      // Submit scores
      submitSectionScore();
    }
  };

  const submitSectionScore = async () => {
    try {
      await api(`/api/v1/courses/${courseId}/materials/${materialId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          section_index: activeSectionIndex,
          answers: sectionAnswers,
        }),
      });
      onComplete?.();
    } catch {
      // Silent fail
    }
  };

  const goToNextSection = () => {
    setSectionScores((prev) => [
      ...prev,
      {
        title: activeSection.title,
        correct: sectionScore,
        total: questions.length,
      },
    ]);

    if (activeSectionIndex < sections.length - 1) {
      setActiveSectionIndex((prev) => prev + 1);
      setCurrentIndex(0);
      setSelectedAnswers(new Set());
      setSubmitted(false);
      setSectionScore(0);
      setSectionFinished(false);
      setSectionAnswers([]);
      setExplanation(null);
    } else {
      setAllFinished(true);
    }
  };

  const restart = () => {
    setActiveSectionIndex(0);
    setCurrentIndex(0);
    setSelectedAnswers(new Set());
    setSubmitted(false);
    setSectionScore(0);
    setSectionFinished(false);
    setAllFinished(false);
    setSectionScores([]);
    setSectionAnswers([]);
    setExplanation(null);
  };

  // Overall summary screen
  if (allFinished) {
    const totalCorrect = sectionScores.reduce((sum, s) => sum + s.correct, 0);
    const totalQuestions = sectionScores.reduce((sum, s) => sum + s.total, 0);
    const percentage = Math.round((totalCorrect / totalQuestions) * 100);

    return (
      <div className="flex flex-col items-center space-y-6 py-8">
        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          Multi-Select Complete!
        </h3>
        <div className="text-center space-y-1">
          <p className="text-4xl font-bold text-primary">{percentage}%</p>
          <p className="text-sm text-gray-500">
            {totalCorrect} out of {totalQuestions} correct
          </p>
        </div>
        <div className="w-full max-w-xs h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-500",
              percentage >= 70
                ? "bg-green-500"
                : percentage >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {sectionScores.length > 1 && (
          <div className="w-full max-w-sm space-y-2">
            <p className="text-sm font-medium text-gray-700 text-center">
              Section Breakdown
            </p>
            {sectionScores.map((s, idx) => {
              const pct = Math.round((s.correct / s.total) * 100);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="text-gray-700 font-medium truncate mr-2">
                    {s.title}
                  </span>
                  <span
                    className={clsx(
                      "font-semibold whitespace-nowrap",
                      pct >= 70
                        ? "text-green-600"
                        : pct >= 40
                          ? "text-yellow-600"
                          : "text-red-600",
                    )}
                  >
                    {s.correct}/{s.total} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Button onClick={restart} variant="secondary">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Section score card
  if (sectionFinished) {
    const pct = Math.round((sectionScore / questions.length) * 100);
    const isLast = activeSectionIndex === sections.length - 1;

    return (
      <div className="flex flex-col items-center space-y-6 py-8">
        <h3 className="text-xl font-bold text-gray-900">
          {activeSection.title}
        </h3>
        <div className="text-center space-y-1">
          <p className="text-3xl font-bold text-primary">{pct}%</p>
          <p className="text-sm text-gray-500">
            {sectionScore} out of {questions.length} correct
          </p>
        </div>
        <div className="w-full max-w-xs h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-500",
              pct >= 70
                ? "bg-green-500"
                : pct >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <Button onClick={goToNextSection}>
          {isLast ? "See Results" : "Next Section"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Section title */}
      {sections.length > 1 && (
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
            {activeSection.title} ({activeSectionIndex + 1}/{sections.length})
          </span>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="font-medium text-primary">
          Score: {sectionScore}/{currentIndex + (submitted ? 1 : 0)}
        </span>
      </div>
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/80 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + (submitted ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-lg font-semibold text-gray-900 mb-2">
          {question.question}
        </p>
        <p className="text-xs text-gray-400 mb-4">Select all that apply</p>

        <div className="space-y-2">
          {question.answers.map((answer, idx) => {
            const isSelected = selectedAnswers.has(idx);
            const isCorrect = answer.is_correct;

            let buttonClass =
              "w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition-all flex items-center gap-3";

            if (!submitted) {
              buttonClass += isSelected
                ? " border-primary/80 bg-primary/10"
                : " border-gray-200 hover:border-primary/40 hover:bg-primary/10/50 cursor-pointer";
            } else if (isCorrect) {
              buttonClass += " border-green-500 bg-green-50 text-green-700";
            } else if (isSelected && !isCorrect) {
              buttonClass += " border-red-500 bg-red-50 text-red-700";
            } else {
              buttonClass += " border-gray-100 text-gray-400";
            }

            return (
              <button
                key={idx}
                className={buttonClass}
                onClick={() => toggleAnswer(idx)}
                disabled={submitted}
              >
                {/* Checkbox */}
                <div
                  className={clsx(
                    "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                    submitted && isCorrect
                      ? "border-green-500 bg-green-500"
                      : submitted && isSelected && !isCorrect
                        ? "border-red-500 bg-red-500"
                        : isSelected
                          ? "border-primary/80 bg-primary/80"
                          : "border-gray-300",
                  )}
                >
                  {(isSelected || (submitted && isCorrect)) && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span>{answer.answer}</span>
                {submitted && isCorrect && (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 ml-auto" />
                )}
                {submitted && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 ml-auto" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {!submitted ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={selectedAnswers.size === 0}
            >
              Submit Answer
            </Button>
          ) : (
            <>
              {!isCurrentCorrect() && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={fetchExplanation}
                  disabled={loadingExplanation || explanation !== null}
                >
                  {loadingExplanation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <HelpCircle className="h-4 w-4" />
                  )}
                  Why?
                </Button>
              )}
              <Button size="sm" onClick={goNext}>
                {currentIndex < questions.length - 1
                  ? "Next"
                  : "Finish Section"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Explanation box */}
        {explanation && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
            {explanation}
          </div>
        )}
      </div>
    </div>
  );
}
