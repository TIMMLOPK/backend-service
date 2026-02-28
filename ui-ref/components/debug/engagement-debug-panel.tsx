"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { EngagementTracker, EngagementSnapshot } from "@/hooks/use-engagement-tracker"
import type { ContentAdjustment } from "@/lib/types"

interface Props {
  tracker: EngagementTracker
}

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m > 0) return `${m}m ${rem.toString().padStart(2, "0")}s`
  return `${rem}s`
}

function fmtAge(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${(m % 60).toString().padStart(2, "0")}m`
  if (m > 0) return `${m}m ${(s % 60).toString().padStart(2, "0")}s`
  return `${s}s`
}

function StruggleBar({ score }: { score: number }) {
  const color =
    score >= 60 ? "bg-red-500" : score >= 35 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] opacity-60">{score}</span>
    </div>
  )
}

export function EngagementDebugPanel({ tracker }: Props) {
  const [open, setOpen] = useState(false)
  const [snap, setSnap] = useState<EngagementSnapshot | null>(null)
  const [sending, setSending] = useState(false)
  const [adjustments, setAdjustments] = useState<ContentAdjustment[] | null>(null)
  const [tab, setTab] = useState<"live" | "adjustments">("live")

  // Poll snapshot every second when panel is open
  useEffect(() => {
    if (!open) return
    const refresh = () => setSnap(tracker.getSnapshot())
    refresh()
    const id = setInterval(refresh, 1000)
    return () => clearInterval(id)
  }, [open, tracker])

  const handleTestSend = useCallback(async () => {
    setSending(true)
    setAdjustments(null)
    try {
      const result = await tracker.sendSession(false)
      setAdjustments(result)
      setTab("adjustments")
    } finally {
      setSending(false)
    }
  }, [tracker])

  return (
    <div className="fixed bottom-4 right-4 z-9999 font-mono text-xs">
      {/* Collapsed pill */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors shadow-lg"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wide">ENG</span>
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="w-80 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-white tracking-wider uppercase">
                Engagement Tracker
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors text-base leading-none px-1"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            {(["live", "adjustments"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-1.5 text-[11px] font-semibold capitalize transition-colors",
                  tab === t
                    ? "text-white bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {t === "adjustments"
                  ? `Adjustments${adjustments ? ` (${adjustments.length})` : ""}`
                  : "Live Data"}
              </button>
            ))}
          </div>

          {/* Live data tab */}
          {tab === "live" && snap && (
            <div className="overflow-y-auto flex-1">
              {/* Session meta */}
              <div className="px-3 py-2.5 border-b border-zinc-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Session</span>
                  <span className="text-zinc-300 text-[10px]">
                    {snap.sessionId.slice(-12)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Age</span>
                  <span className="text-emerald-400">{fmtAge(snap.sessionAgeMs)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Scroll depth</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-16 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${snap.scrollDepthPct}%` }}
                      />
                    </div>
                    <span className="text-blue-400">
                      {snap.scrollDepthPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Hints</span>
                  <span className={snap.hintsRequested > 0 ? "text-yellow-400" : "text-zinc-400"}>
                    {snap.hintsRequested}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Active section</span>
                  <span className="text-purple-400 text-right max-w-[140px] truncate">
                    {snap.activeSectionTitle ?? "—"}
                  </span>
                </div>
              </div>

              {/* Sections table */}
              {snap.sections.length > 0 ? (
                <div className="divide-y divide-zinc-800/50">
                  {snap.sections.map((s) => {
                    const isActive = s.sectionIndex === snap.activeSectionIndex
                    return (
                      <div
                        key={s.sectionId}
                        className={cn(
                          "px-3 py-2 transition-colors",
                          isActive && "bg-purple-950/30 border-l-2 border-purple-500"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span
                            className={cn(
                              "text-[11px] leading-tight flex-1 truncate",
                              isActive ? "text-white font-semibold" : "text-zinc-300"
                            )}
                          >
                            {s.sectionTitle}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 shrink-0">
                              active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span>
                            ⏱{" "}
                            <span className={isActive ? "text-emerald-400" : "text-zinc-400"}>
                              {fmtMs(s.timeVisibleMs)}
                            </span>
                          </span>
                          <span>
                            🔁{" "}
                            <span className={s.revisitCount > 1 ? "text-amber-400" : "text-zinc-400"}>
                              {s.revisitCount}x
                            </span>
                          </span>
                          {s.interactions.length > 0 && (
                            <span>
                              🎯{" "}
                              {s.interactions.map((ci, i) => (
                                <span
                                  key={i}
                                  className={ci.success ? "text-emerald-400" : "text-red-400"}
                                  title={`${ci.componentType} (${ci.attemptCount} attempt${ci.attemptCount > 1 ? "s" : ""})`}
                                >
                                  {ci.componentType[0]}
                                  {ci.success ? "✓" : `✗×${ci.attemptCount}`}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="px-3 py-4 text-zinc-600 text-center text-[11px]">
                  No sections detected yet — scroll down to start tracking
                </p>
              )}

              {/* Test send */}
              <div className="px-3 py-2.5 border-t border-zinc-800 bg-zinc-900/40">
                <button
                  onClick={handleTestSend}
                  disabled={sending}
                  className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-semibold transition-colors"
                >
                  {sending ? "Sending session…" : "Test: Send session to API →"}
                </button>
              </div>
            </div>
          )}

          {/* Adjustments tab */}
          {tab === "adjustments" && (
            <div className="overflow-y-auto flex-1">
              {adjustments === null ? (
                <p className="px-3 py-4 text-zinc-600 text-center text-[11px]">
                  Send the session to see AI adjustments
                </p>
              ) : adjustments.length === 0 ? (
                <p className="px-3 py-4 text-emerald-500 text-center text-[11px]">
                  ✓ No struggle points detected
                </p>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {adjustments.map((adj) => (
                    <div key={adj.sectionId} className="px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white text-[11px] font-medium truncate flex-1">
                          {adj.sectionTitle}
                        </span>
                        <StruggleBar score={adj.struggleScore} />
                      </div>
                      {adj.suggestions.map((s, i) => (
                        <p key={i} className="text-zinc-400 text-[10px] leading-relaxed pl-1 border-l border-zinc-700">
                          {s}
                        </p>
                      ))}
                      {adj.additionalContent && (
                        <p className="text-purple-400 text-[10px] italic mt-1">
                          + additional content generated
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
