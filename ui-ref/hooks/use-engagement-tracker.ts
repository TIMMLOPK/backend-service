"use client"

import { useRef, useEffect, useCallback } from "react"
import type {
  SectionEngagement,
  ComponentInteraction,
  LessonEngagementSession,
  ContentAdjustment,
} from "@/lib/types"
import { generateSessionId, sendEngagementSession } from "@/lib/analytics"

export interface EngagementSnapshot {
  sessionId: string
  sessionAgeMs: number
  scrollDepthPct: number
  hintsRequested: number
  activeSectionIndex: number
  activeSectionTitle: string | null
  sections: Array<{
    sectionId: string
    sectionTitle: string
    sectionIndex: number
    /** Accumulated dwell including ongoing time in current section */
    timeVisibleMs: number
    revisitCount: number
    interactions: Array<{ componentId: string; componentType: string; success: boolean; attemptCount: number }>
  }>
}

export interface EngagementTracker {
  trackInteraction: (
    componentId: string,
    componentType: string,
    success: boolean,
    attemptCount: number
  ) => void
  trackHint: () => void
  sendSession: (lessonCompleted: boolean) => Promise<ContentAdjustment[]>
  getSnapshot: () => EngagementSnapshot
}

export function useEngagementTracker(
  lessonId: string,
  courseId: string,
  userId: string,
  contentRef: React.RefObject<HTMLElement | null>
): EngagementTracker {
  const sessionIdRef = useRef(generateSessionId())
  const startedAtRef = useRef(Date.now())
  const sectionsRef = useRef<SectionEngagement[]>([])
  const hintsRequestedRef = useRef(0)
  const scrollDepthRef = useRef(0)
  const currentSectionIndexRef = useRef(-1)
  const sectionEnterTimeRef = useRef(Date.now())
  const initializedRef = useRef(false)

  // Discover sections from rendered headings and build initial state
  useEffect(() => {
    const init = () => {
      if (!contentRef.current) return
      const headings = Array.from(
        contentRef.current.querySelectorAll("[data-section-id]")
      ) as HTMLElement[]
      if (headings.length === 0) return

      sectionsRef.current = headings.map((el, i) => ({
        sectionId: el.dataset.sectionId ?? `section-${i}`,
        sectionTitle:
          el.dataset.sectionTitle ?? el.textContent?.trim() ?? `Section ${i + 1}`,
        sectionIndex: i,
        timeVisibleMs: 0,
        revisitCount: 0,
        componentInteractions: [],
      }))
      initializedRef.current = true
    }

    // Give react-markdown time to finish rendering
    const t = setTimeout(init, 600)
    return () => clearTimeout(t)
  }, [contentRef, lessonId])

  // Scroll listener: update active section + scroll depth
  useEffect(() => {
    const handleScroll = () => {
      // Track max scroll depth
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        const depth = Math.min((window.scrollY / docHeight) * 100, 100)
        scrollDepthRef.current = Math.max(scrollDepthRef.current, depth)
      }

      if (!contentRef.current || !initializedRef.current) return

      const headings = Array.from(
        contentRef.current.querySelectorAll("[data-section-id]")
      ) as HTMLElement[]
      if (headings.length === 0) return

      // Active section = last heading whose top is at or above 40% of viewport
      const threshold = window.innerHeight * 0.4
      let newIndex = -1
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top <= threshold) {
          newIndex = i
          break
        }
      }

      if (newIndex !== currentSectionIndexRef.current) {
        const now = Date.now()
        const prevIdx = currentSectionIndexRef.current

        // Accumulate time on the section we just left
        if (prevIdx >= 0 && sectionsRef.current[prevIdx]) {
          sectionsRef.current[prevIdx].timeVisibleMs +=
            now - sectionEnterTimeRef.current
        }

        currentSectionIndexRef.current = newIndex
        sectionEnterTimeRef.current = now

        // Count each entry into a section (first entry + revisits)
        if (newIndex >= 0 && sectionsRef.current[newIndex]) {
          sectionsRef.current[newIndex].revisitCount += 1
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [contentRef])

  const trackInteraction = useCallback(
    (
      componentId: string,
      componentType: string,
      success: boolean,
      attemptCount: number
    ) => {
      const interaction: ComponentInteraction = {
        componentId,
        componentType,
        timestamp: Date.now(),
        success,
        attemptCount,
      }

      const sectionIdx = currentSectionIndexRef.current
      if (sectionIdx >= 0 && sectionsRef.current[sectionIdx]) {
        const interactions =
          sectionsRef.current[sectionIdx].componentInteractions
        const existingIdx = interactions.findIndex(
          (ci) => ci.componentId === componentId
        )
        if (existingIdx >= 0) {
          interactions[existingIdx] = interaction
        } else {
          interactions.push(interaction)
        }
      }
    },
    []
  )

  const trackHint = useCallback(() => {
    hintsRequestedRef.current += 1
  }, [])

  const sendSession = useCallback(
    async (lessonCompleted: boolean): Promise<ContentAdjustment[]> => {
      // Finalize time on the current section
      const now = Date.now()
      const prevIdx = currentSectionIndexRef.current
      if (prevIdx >= 0 && sectionsRef.current[prevIdx]) {
        sectionsRef.current[prevIdx].timeVisibleMs +=
          now - sectionEnterTimeRef.current
        sectionEnterTimeRef.current = now
      }

      const session: LessonEngagementSession = {
        sessionId: sessionIdRef.current,
        userId,
        lessonId,
        courseId,
        startedAt: startedAtRef.current,
        endedAt: now,
        scrollDepthPct: scrollDepthRef.current,
        sections: sectionsRef.current,
        hintsRequested: hintsRequestedRef.current,
        lessonCompleted,
      }

      return sendEngagementSession(session)
    },
    [userId, lessonId, courseId]
  )

  const getSnapshot = useCallback((): EngagementSnapshot => {
    const now = Date.now()
    const activeIdx = currentSectionIndexRef.current

    return {
      sessionId: sessionIdRef.current,
      sessionAgeMs: now - startedAtRef.current,
      scrollDepthPct: scrollDepthRef.current,
      hintsRequested: hintsRequestedRef.current,
      activeSectionIndex: activeIdx,
      activeSectionTitle: sectionsRef.current[activeIdx]?.sectionTitle ?? null,
      sections: sectionsRef.current.map((s, i) => ({
        sectionId: s.sectionId,
        sectionTitle: s.sectionTitle,
        sectionIndex: s.sectionIndex,
        // Add live time for the currently active section
        timeVisibleMs:
          i === activeIdx
            ? s.timeVisibleMs + (now - sectionEnterTimeRef.current)
            : s.timeVisibleMs,
        revisitCount: s.revisitCount,
        interactions: s.componentInteractions.map((ci) => ({
          componentId: ci.componentId,
          componentType: ci.componentType,
          success: ci.success,
          attemptCount: ci.attemptCount,
        })),
      })),
    }
  }, [])

  return { trackInteraction, trackHint, sendSession, getSnapshot }
}
