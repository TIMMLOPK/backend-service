"use client"

import { createContext, useContext } from "react"
import type { EngagementTracker } from "@/hooks/use-engagement-tracker"

const noop = () => {}
const noopAsync = async () => []
const noopSnapshot = () => ({
  sessionId: "",
  sessionAgeMs: 0,
  scrollDepthPct: 0,
  hintsRequested: 0,
  activeSectionIndex: -1,
  activeSectionTitle: null,
  sections: [],
})

const EngagementContext = createContext<EngagementTracker>({
  trackInteraction: noop,
  trackHint: noop,
  sendSession: noopAsync,
  getSnapshot: noopSnapshot,
})

export const EngagementProvider = EngagementContext.Provider

export function useEngagement(): EngagementTracker {
  return useContext(EngagementContext)
}
