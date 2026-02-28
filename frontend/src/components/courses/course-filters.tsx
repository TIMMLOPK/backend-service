"use client";

import { clsx } from "clsx";
import { Search } from "lucide-react";
import { ALL_TOPICS, ALL_DIFFICULTIES } from "@/lib/mock-data";
import type { TopicCategory, Difficulty } from "@/lib/types";

interface CourseFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedTopic: TopicCategory | null;
  onTopicChange: (val: TopicCategory | null) => void;
  selectedDifficulty: Difficulty | null;
  onDifficultyChange: (val: Difficulty | null) => void;
}

export function CourseFilters({
  search,
  onSearchChange,
  selectedTopic,
  onTopicChange,
  selectedDifficulty,
  onDifficultyChange,
}: CourseFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
        />
      </div>

      {/* Topic pills */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Topic
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTopicChange(null)}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
              selectedTopic === null
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            All
          </button>
          {ALL_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() =>
                onTopicChange(selectedTopic === topic ? null : topic)
              }
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                selectedTopic === topic
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty pills */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Difficulty
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onDifficultyChange(null)}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
              selectedDifficulty === null
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            All
          </button>
          {ALL_DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() =>
                onDifficultyChange(
                  selectedDifficulty === diff ? null : diff,
                )
              }
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                selectedDifficulty === diff
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
