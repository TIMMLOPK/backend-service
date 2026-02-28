"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlashcardSetData } from "@/lib/types";

interface FlashcardSection {
  title: string;
  data: FlashcardSetData;
}

interface FlashcardViewerProps {
  sections: FlashcardSection[];
  onComplete?: () => void;
}

export function FlashcardViewer({ sections, onComplete }: FlashcardViewerProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const allEmpty = sections.every((s) => s.data.flashcards.length === 0);
  if (sections.length === 0 || allEmpty) {
    return (
      <p className="text-center text-gray-500 py-8">No flashcards available.</p>
    );
  }

  const activeSection = sections[activeSectionIndex];
  const cards = activeSection.data.flashcards;
  const card = cards[currentIndex];

  const switchSection = (idx: number) => {
    setActiveSectionIndex(idx);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Section pills */}
      {sections.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => switchSection(idx)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                activeSectionIndex === idx
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {section.title}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="text-sm text-gray-500">
        Card {currentIndex + 1} of {cards.length}
      </div>
      <div className="w-full max-w-md h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/80 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card with 3D flip */}
      <div
        className="w-full max-w-md cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={clsx(
            "relative w-full min-h-[240px] transition-transform duration-500",
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs uppercase tracking-wider text-primary/80 font-semibold mb-3">
              Question
            </p>
            <p className="text-lg font-medium text-gray-900">{card.question}</p>
            <p className="text-xs text-gray-400 mt-4">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 shadow-sm p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-xs uppercase tracking-wider text-primary/80 font-semibold mb-3">
              Answer
            </p>
            <p className="text-lg font-medium text-gray-900">{card.answer}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentIndex(0);
            setFlipped(false);
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </Button>
        {currentIndex === cards.length - 1 && flipped && onComplete ? (
          <Button size="sm" onClick={onComplete}>
            Complete
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
