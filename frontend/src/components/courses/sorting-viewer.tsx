"use client";

import { useState, useMemo } from "react";
import { clsx } from "clsx";
import { FolderTree, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SortingData } from "@/lib/types";

interface SortingViewerProps {
  data: SortingData;
  onComplete?: () => void;
}

export function SortingViewer({ data, onComplete }: SortingViewerProps) {
  const allItems = useMemo(() => {
    const items: { item: string; category: string }[] = [];
    for (const cat of data.categories) {
      for (const item of cat.items) {
        items.push({ item, category: cat.name });
      }
    }
    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [data.categories]);

  const [placements, setPlacements] = useState<Map<string, string>>(new Map());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Map<string, boolean>>(new Map());

  const correctMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const cat of data.categories) {
      for (const item of cat.items) {
        m.set(item, cat.name);
      }
    }
    return m;
  }, [data.categories]);

  const unplacedItems = allItems.filter((i) => !placements.has(i.item));
  const totalItems = allItems.length;
  const placedCount = placements.size;

  const handleItemClick = (item: string) => {
    if (checked) return;
    setSelectedItem((prev) => (prev === item ? null : item));
  };

  const handleCategoryClick = (categoryName: string) => {
    if (checked || selectedItem === null) return;
    setPlacements((prev) => {
      const next = new Map(prev);
      next.set(selectedItem, categoryName);
      return next;
    });
    setSelectedItem(null);
  };

  const removeFromCategory = (item: string) => {
    if (checked) return;
    setPlacements((prev) => {
      const next = new Map(prev);
      next.delete(item);
      return next;
    });
  };

  const checkAnswers = () => {
    const res = new Map<string, boolean>();
    for (const [item, category] of placements) {
      res.set(item, correctMap.get(item) === category);
    }
    setResults(res);
    setChecked(true);

    const allCorrect = [...res.values()].every(Boolean) && res.size === totalItems;
    if (allCorrect && onComplete) {
      setTimeout(onComplete, 600);
    }
  };

  const reset = () => {
    setPlacements(new Map());
    setSelectedItem(null);
    setChecked(false);
    setResults(new Map());
  };

  const allCorrect = checked && results.size === totalItems && [...results.values()].every(Boolean);

  const categoryColors = [
    { bg: "bg-primary/20", border: "border-primary/20", header: "bg-primary text-primary-foreground" },
    { bg: "bg-sky-50", border: "border-sky-200", header: "bg-sky-100 text-sky-800" },
    { bg: "bg-amber-50", border: "border-amber-200", header: "bg-amber-100 text-amber-800" },
    { bg: "bg-emerald-50", border: "border-emerald-200", header: "bg-emerald-100 text-emerald-800" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Badge>
          <FolderTree className="h-3 w-3 mr-1 inline" />
          Sorting
        </Badge>
        <span className="text-sm text-gray-500">{data.instruction}</span>
      </div>

      <div className="text-sm text-gray-500 text-center">
        {placedCount}/{totalItems} items placed
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${(placedCount / totalItems) * 100}%` }}
        />
      </div>

      {allCorrect ? (
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900">All sorted correctly!</p>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Unsorted items pool */}
          {unplacedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items to sort
              </p>
              <div className="flex flex-wrap gap-2">
                {unplacedItems.map(({ item }) => (
                  <button
                    key={item}
                    onClick={() => handleItemClick(item)}
                    className={clsx(
                      "px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer",
                      selectedItem === item
                        ? "bg-primary/20 border-primary/20 text-primary-foreground ring-2 ring-primary/20"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category buckets */}
          <div className={clsx(
            "grid gap-4",
            data.categories.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3",
          )}>
            {data.categories.map((cat, catIdx) => {
              const colors = categoryColors[catIdx % categoryColors.length];
              const itemsInCategory = [...placements.entries()]
                .filter(([, c]) => c === cat.name)
                .map(([item]) => item);

              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  disabled={checked || selectedItem === null}
                  className={clsx(
                    "rounded-xl border-2 border-dashed p-4 text-left transition-all min-h-[120px] cursor-pointer",
                    selectedItem && !checked
                      ? `${colors.bg} ${colors.border} hover:border-solid`
                      : `${colors.bg} ${colors.border}`,
                  )}
                >
                  <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", colors.header)}>
                    {cat.name}
                  </span>
                  <div className="mt-3 space-y-1.5">
                    {itemsInCategory.map((item) => (
                      <div
                        key={item}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCategory(item);
                        }}
                        className={clsx(
                          "px-2.5 py-1.5 rounded-lg text-xs transition-all",
                          checked
                            ? results.get(item)
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer",
                        )}
                      >
                        {item}
                        {checked && !results.get(item) && (
                          <span className="ml-1 text-red-500">
                            → {correctMap.get(item)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center gap-3">
            {checked ? (
              <Button variant="secondary" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            ) : (
              <Button onClick={checkAnswers} disabled={placedCount < totalItems}>
                Check Answers
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
