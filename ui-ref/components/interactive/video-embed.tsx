"use client"

import { useState } from "react"
import { IconPlayerPlay } from "@tabler/icons-react"
import type { VideoEmbedProps } from "@/lib/types"

function toEmbedUrl(url: string, startTime?: number): string | null {
  try {
    const u = new URL(url)

    // YouTube
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let videoId = u.searchParams.get("v")
      if (!videoId && u.hostname === "youtu.be") {
        videoId = u.pathname.slice(1)
      }
      if (!videoId) return null
      const params = new URLSearchParams({ autoplay: "1", rel: "0" })
      if (startTime) params.set("start", String(Math.floor(startTime)))
      return `https://www.youtube.com/embed/${videoId}?${params}`
    }

    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const videoId = u.pathname.split("/").filter(Boolean)[0]
      const params = new URLSearchParams({ autoplay: "1" })
      if (startTime) params.set("t", `${Math.floor(startTime)}s`)
      return `https://player.vimeo.com/video/${videoId}?${params}`
    }

    return null
  } catch {
    return null
  }
}

export function VideoEmbedComponent({ props }: { props: VideoEmbedProps }) {
  const [playing, setPlaying] = useState(false)
  const embedUrl = toEmbedUrl(props.url, props.start_time)

  if (!embedUrl) {
    return (
      <div className="my-6 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
        Video:{" "}
        <a
          href={props.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {props.url}
        </a>
      </div>
    )
  }

  return (
    <div className="my-6">
      <div className="relative rounded-2xl overflow-hidden border shadow-sm aspect-video bg-black">
        {playing ? (
          <iframe
            src={embedUrl}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={props.caption ?? "Lesson video"}
          />
        ) : (
          <button
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/70 hover:bg-black/60 transition-colors group"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
          >
            <span className="size-16 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <IconPlayerPlay className="size-7 text-white fill-white" />
            </span>
          </button>
        )}
      </div>
      {props.caption && (
        <p className="text-xs text-muted-foreground text-center mt-2 italic">{props.caption}</p>
      )}
    </div>
  )
}
