"use client";

import { useState, useMemo, useCallback } from "react";
import { clsx } from "clsx";
import { Link2, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MatchingData } from "@/lib/types";

interface MatchingViewerProps {
  data: MatchingData;
  onComplete?: () => void;
}

export function MatchingViewer({ data, onComplete }: MatchingViewerProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Map<number, number>>(new Map());
  const [wrongPair, setWrongPair] = useState<number | null>(null);

  const shuffledRightIndices = useMemo(() => {
    const indices = data.pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [data.pairs]);

  const completed = matches.size === data.pairs.length;

  const matchedRightIndices = useMemo(
    () => new Set(matches.values()),
    [matches],
  );

  const handleLeftClick = useCallback(
    (idx: number) => {
      if (matches.has(idx)) return;
      setSelectedLeft((prev) => (prev === idx ? null : idx));
    },
    [matches],
  );

  const handleRightClick = useCallback(
    (rightIdx: number) => {
      if (selectedLeft === null || matchedRightIndices.has(rightIdx)) return;

      if (selectedLeft === rightIdx) {
        setMatches((prev) => {
          const next = new Map(prev);
          next.set(selectedLeft, rightIdx);
          return next;
        });
        setSelectedLeft(null);

        if (matches.size + 1 === data.pairs.length && onComplete) {
          setTimeout(onComplete, 600);
        }
      } else {
        setWrongPair(rightIdx);
        setTimeout(() => setWrongPair(null), 500);
      }
    },
    [selectedLeft, matchedRightIndices, matches.size, data.pairs.length, onComplete],
  );

  const reset = () => {
    setMatches(new Map());
    setSelectedLeft(null);
    setWrongPair(null);
  };

  const pairColors = [
    "bg-emerald-100 border-emerald-300 text-emerald-800",
    "bg-sky-100 border-sky-300 text-sky-800",
    "bg-amber-100 border-amber-300 text-amber-800",
    "bg-pink-100 border-pink-300 text-pink-800",
    "bg-primary  border-primary text-primary-foreground",
    "bg-teal-100 border-teal-300 text-teal-800",
    "bg-orange-100 border-orange-300 text-orange-800",
    "bg-purple-100 border-purple-300 text-purple-800",
    "bg-cyan-100 border-cyan-300 text-cyan-800",
    "bg-rose-100 border-rose-300 text-rose-800",
    "bg-lime-100 border-lime-300 text-lime-800",
    "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
  ];

  const getMatchColor = (leftIdx: number) =>
    pairColors[leftIdx % pairColors.length];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Badge bg="bg-blue-100" text="text-blue-700">
          <Link2 className="h-3 w-3 mr-1 inline" />
          Matching
        </Badge>
        <span className="text-sm text-gray-500">{data.instruction}</span>
      </div>

      <div className="text-sm text-gray-500 text-center">
        {matches.size}/{data.pairs.length} pairs matched
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${(matches.size / data.pairs.length) * 100}%` }}
        />
      </div>

      {completed ? (
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">All pairs matched!</p>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-2">
            {data.pairs.map((pair, idx) => {
              const isMatched = matches.has(idx);
              return (
                <button
                  key={`left-${idx}`}
                  onClick={() => handleLeftClick(idx)}
                  disabled={isMatched}
                  className={clsx(
                    "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer",
                    isMatched
                      ? getMatchColor(idx)
                      : selectedLeft === idx
                        ? "bg-primary/10 border-primary/60 text-primary ring-2 ring-primary/30"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  {pair.left}
                </button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-2">
            {shuffledRightIndices.map((rightIdx) => {
              const isMatched = matchedRightIndices.has(rightIdx);
              const matchingLeftIdx = isMatched
                ? [...matches.entries()].find(([, v]) => v === rightIdx)?.[0]
                : undefined;
              const isWrong = wrongPair === rightIdx;
              return (
                <button
                  key={`right-${rightIdx}`}
                  onClick={() => handleRightClick(rightIdx)}
                  disabled={isMatched || selectedLeft === null}
                  className={clsx(
                    "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer",
                    isMatched && matchingLeftIdx !== undefined
                      ? getMatchColor(matchingLeftIdx)
                      : isWrong
                        ? "bg-red-50 border-red-400 text-red-700 animate-[shake_0.3s_ease-in-out]"
                        : selectedLeft !== null && !isMatched
                          ? "bg-white border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-primary/10"
                          : "bg-white border-gray-200 text-gray-700",
                  )}
                >
                  {data.pairs[rightIdx].right}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
