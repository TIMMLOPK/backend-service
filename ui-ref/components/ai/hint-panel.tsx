"use client"

import { useState, useRef, useEffect } from "react"
import {
  IconSparkles,
  IconSend,
  IconX,
  IconLoader2,
  IconBulb,
  IconRefresh,
  IconChevronDown,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { HintMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useEngagement } from "@/lib/engagement-context"

interface HintPanelProps {
  courseId: string
  lessonId: string
  lessonTitle: string
  isOpen: boolean
  onClose: () => void
}

const QUICK_PROMPTS = [
  "Give me a hint",
  "Explain this concept",
  "Show me an example",
  "What should I focus on?",
]

export function HintPanel({ courseId, lessonId, lessonTitle, isOpen, onClose }: HintPanelProps) {
  const { trackHint } = useEngagement()
  const [messages, setMessages] = useState<HintMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your Mentova AI tutor. I'm here to help you with **${lessonTitle}**. Ask me anything — I'll give you hints and guide you through the material without just giving away answers. What would you like to understand better?`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    trackHint()

    const userMsg: HintMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setStreaming(true)

    const assistantId = `msg-${Date.now()}-ai`
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date().toISOString() },
    ])

    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          courseId,
          lessonId,
          history: messages,
        }),
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I couldn't process that. Please try again." }
            : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleClear() {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: `Ready to help! What would you like to know about **${lessonTitle}**?`,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full border-l bg-background w-80 xl:w-96 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-linear-to-r from-purple-500/5 to-background">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <IconSparkles className="size-4 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Tutor</p>
            <p className="text-[10px] text-muted-foreground">Powered by Mentova AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleClear} title="Clear chat">
            <IconRefresh className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <IconX className="size-4" />
          </Button>
        </div>
      </div>

      {/* Context bar */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-1.5">
          <IconBulb className="size-3.5 text-yellow-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground truncate">
            Context: <span className="text-foreground font-medium">{lessonTitle}</span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="size-6 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <IconSparkles className="size-3.5 text-purple-500" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}
            >
              {msg.content ? (
                <SimpleMarkdown content={msg.content} />
              ) : (
                <div className="flex gap-1 items-center py-0.5">
                  <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide mb-2">Quick prompts</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scroll to bottom */}
      <button
        className="mx-4 mb-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
      >
        <IconChevronDown className="size-3" />
        Scroll to bottom
      </button>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Ask about this lesson..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="resize-none text-sm min-h-0"
            disabled={streaming}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="shrink-0"
          >
            {streaming ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconSend className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

function SimpleMarkdown({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="bg-background/50 dark:bg-foreground/10 px-1 py-0.5 rounded text-xs font-mono">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
