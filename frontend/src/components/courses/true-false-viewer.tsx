"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { Scale, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TrueFalseData } from "@/lib/types";

interface TrueFalseViewerProps {
  data: TrueFalseData;
  onComplete?: () => void;
}

export function TrueFalseViewer({ data, onComplete }: TrueFalseViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const statements = data.statements;
  const current = statements[currentIndex];
  const isCorrect = selectedAnswer === current?.is_true;
  const isLast = currentIndex === statements.length - 1;

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (answered) return;
      setSelectedAnswer(answer);
      setAnswered(true);
      if (answer === current.is_true) {
        setScore((s) => s + 1);
      }
    },
    [answered, current],
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      setFinished(true);
      if (onComplete) onComplete();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setAnswered(false);
    setSelectedAnswer(null);
  }, [isLast, onComplete]);

  // Auto-advance after 2s
  useEffect(() => {
    if (!answered || isLast) return;
    const timer = setTimeout(handleNext, 2000);
    return () => clearTimeout(timer);
  }, [answered, isLast, handleNext]);

  if (finished) {
    const pct = Math.round((score / statements.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 py-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-lg font-semibold text-gray-900">Complete!</p>
        <p className="text-gray-600">
          You scored <span className="font-bold text-primary">{score}/{statements.length}</span> ({pct}%)
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setFinished(false);
            setAnswered(false);
            setSelectedAnswer(null);
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Badge bg="bg-purple-100" text="text-purple-700">
          <Scale className="h-3 w-3 mr-1 inline" />
          True or False
        </Badge>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {statements.length}
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / statements.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-6">
        <p className="text-lg font-medium text-gray-900">{current.statement}</p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleAnswer(true)}
            disabled={answered}
            className={clsx(
              "px-8 py-3 rounded-xl text-lg font-semibold transition-all cursor-pointer",
              answered && current.is_true
                ? "bg-green-500 text-white ring-2 ring-green-300"
                : answered && selectedAnswer === true && !current.is_true
                  ? "bg-red-500 text-white ring-2 ring-red-300"
                  : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
            )}
          >
            True
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={answered}
            className={clsx(
              "px-8 py-3 rounded-xl text-lg font-semibold transition-all cursor-pointer",
              answered && !current.is_true
                ? "bg-green-500 text-white ring-2 ring-green-300"
                : answered && selectedAnswer === false && current.is_true
                  ? "bg-red-500 text-white ring-2 ring-red-300"
                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
            )}
          >
            False
          </button>
        </div>

        {answered && (
          <div
            className={clsx(
              "rounded-xl p-4 text-sm text-left transition-all",
              isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={clsx("font-medium", isCorrect ? "text-green-700" : "text-red-700")}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </span>
            </div>
            <p className="text-gray-600">{current.explanation}</p>
          </div>
        )}

        {answered && (
          <Button size="sm" onClick={handleNext}>
            {isLast ? "See Results" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
