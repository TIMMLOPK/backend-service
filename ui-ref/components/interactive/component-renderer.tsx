"use client"

import { useEffect, useState } from "react"
import type { ComponentInstance } from "@/lib/types"
import { QuizComponent } from "./quiz"
import { FlashcardComponent } from "./flashcard"
import { CodeExerciseComponent } from "./code-exercise"
import { ChartComponent } from "./chart"
import { VideoEmbedComponent } from "./video-embed"
import { CalloutComponent } from "./callout"

function ComponentSkeleton() {
  return (
    <div className="my-6 rounded-2xl border bg-muted/30 animate-pulse h-32" />
  )
}

function ComponentError({ id }: { id: string }) {
  return (
    <div className="my-6 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground font-mono">
      component:{id} — failed to load
    </div>
  )
}

function renderInstance(instance: ComponentInstance) {
  switch (instance.type) {
    case "Quiz":
      return (
        <QuizComponent
          componentId={instance.id}
          props={instance.props as Parameters<typeof QuizComponent>[0]["props"]}
        />
      )
    case "Flashcard":
      return (
        <FlashcardComponent
          props={instance.props as Parameters<typeof FlashcardComponent>[0]["props"]}
        />
      )
    case "CodeExercise":
      return (
        <CodeExerciseComponent
          componentId={instance.id}
          props={instance.props as Parameters<typeof CodeExerciseComponent>[0]["props"]}
        />
      )
    case "Chart":
      return (
        <ChartComponent
          props={instance.props as Parameters<typeof ChartComponent>[0]["props"]}
        />
      )
    case "VideoEmbed":
      return (
        <VideoEmbedComponent
          props={instance.props as Parameters<typeof VideoEmbedComponent>[0]["props"]}
        />
      )
    case "Callout":
      return (
        <CalloutComponent
          props={instance.props as Parameters<typeof CalloutComponent>[0]["props"]}
        />
      )
    default:
      return null
  }
}

export function ComponentRenderer({ id }: { id: string }) {
  const [instance, setInstance] = useState<ComponentInstance | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/components/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<ComponentInstance>
      })
      .then((data) => {
        if (!cancelled) setInstance(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) return <ComponentError id={id} />
  if (!instance) return <ComponentSkeleton />
  return renderInstance(instance)
}
