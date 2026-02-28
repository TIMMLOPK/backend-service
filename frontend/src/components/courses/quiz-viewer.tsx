"use client";

import { useState, useEffect } from "react";
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
import type { QuizData, QuizAnswerRecord } from "@/lib/types";

interface QuizSection {
  title: string;
  data: QuizData;
}

interface QuizViewerProps {
  sections: QuizSection[];
  courseId: string;
  materialId: string;
  onComplete?: () => void;
}

interface SectionScore {
  title: string;
  correct: number;
  total: number;
}

export function QuizViewer({ sections, courseId, materialId, onComplete }: QuizViewerProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sectionScore, setSectionScore] = useState(0);
  const [answered, setAnswered] = useState(false);
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
        No quiz questions available.
      </p>
    );
  }

  const activeSection = sections[activeSectionIndex];
  const questions = activeSection.data.questions;
  const question = questions[currentIndex];

  const handleSelect = (answerIndex: number) => {
    if (answered) return;
    setSelectedAnswer(answerIndex);
    setAnswered(true);

    const isCorrect = question.answers[answerIndex]?.is_correct ?? false;
    if (isCorrect) {
      setSectionScore((prev) => prev + 1);
    }

    setSectionAnswers((prev) => [
      ...prev,
      {
        question_index: currentIndex,
        selected_answer_indices: [answerIndex],
        is_correct: isCorrect,
      },
    ]);
  };

  const isCurrentCorrect =
    selectedAnswer !== null && question.answers[selectedAnswer]?.is_correct;

  // Auto-advance after 1.5s ONLY if correct
  useEffect(() => {
    if (!answered || !isCurrentCorrect) return;
    const timer = setTimeout(() => {
      advanceQuestion();
    }, 1500);
    return () => clearTimeout(timer);
  }, [answered, isCurrentCorrect]);

  const advanceQuestion = () => {
    setExplanation(null);
    setLoadingExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setSectionFinished(true);
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

  const fetchExplanation = async () => {
    if (selectedAnswer === null) return;
    setLoadingExplanation(true);
    try {
      const correctAnswer = question.answers.find((a) => a.is_correct);
      const result = await api<{ explanation: string }>(
        `/api/v1/courses/${courseId}/materials/${materialId}/explain`,
        {
          method: "POST",
          body: JSON.stringify({
            question: question.question,
            selected_answer: question.answers[selectedAnswer].answer,
            correct_answer: correctAnswer?.answer ?? "",
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
      setSelectedAnswer(null);
      setAnswered(false);
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
    setSelectedAnswer(null);
    setAnswered(false);
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
    const totalQuestions = sectionScores.reduce(
      (sum, s) => sum + s.total,
      0,
    );
    const percentage = Math.round((totalCorrect / totalQuestions) * 100);

    return (
      <div className="flex flex-col items-center space-y-6 py-8">
        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Quiz Complete!</h3>
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

        {/* Per-section breakdown */}
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
          Score: {sectionScore}/{currentIndex + (answered ? 1 : 0)}
        </span>
      </div>
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/80 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-lg font-semibold text-gray-900 mb-6">
          {question.question}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.answers.map((answer, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = answer.is_correct;

            let buttonClass =
              "w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition-all";

            if (!answered) {
              buttonClass +=
                " border-gray-200 hover:border-primary/60 hover:bg-primary/10 cursor-pointer";
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
                onClick={() => handleSelect(idx)}
                disabled={answered}
              >
                <div className="flex items-start gap-2">
                  {answered && isCorrect && (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  )}
                  {answered && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span>{answer.answer}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Wrong answer controls */}
        {answered && !isCurrentCorrect && (
          <div className="flex flex-wrap gap-2 mt-4">
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
            <Button size="sm" onClick={advanceQuestion}>
              {currentIndex < questions.length - 1
                ? "Next"
                : "Finish Section"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

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
