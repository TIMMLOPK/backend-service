"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { IconRotate } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { FlashcardProps } from "@/lib/types"

export function FlashcardComponent({ props }: { props: FlashcardProps }) {
  const [flipped, setFlipped] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const handleFlip = () => {
    setFlipped((f) => !f)
    setRevealed(true)
  }

  return (
    <div className="my-6">
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
        role="button"
        aria-label={flipped ? "Show front" : "Reveal answer"}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleFlip()}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "160px",
          }}
        >
          {/* Front */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl border-2 bg-card p-6 flex flex-col",
              !flipped ? "border-primary/30" : "border-border"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Flashcard — click to reveal
            </span>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-base font-medium text-center leading-relaxed [&_strong]:font-bold [&_code]:bg-muted [&_code]:px-1.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono">
                <ReactMarkdown>{props.front}</ReactMarkdown>
              </div>
            </div>
            {props.hint && !revealed && (
              <p className="text-xs text-muted-foreground text-center mt-3 italic">
                Hint: {props.hint}
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <IconRotate className="size-3.5" />
              Tap to flip
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/70 mb-3">
              Answer
            </span>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-base text-center leading-relaxed [&_strong]:font-semibold [&_code]:bg-primary/10 [&_code]:px-1.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono">
                <ReactMarkdown>{props.back}</ReactMarkdown>
              </div>
            </div>
            {props.tags && props.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {props.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <IconRotate className="size-3.5" />
              Tap to flip back
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
