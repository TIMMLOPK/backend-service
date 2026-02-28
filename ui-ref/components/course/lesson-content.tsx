"use client"

import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { cn } from "@/lib/utils"
import { ComponentRenderer } from "@/components/interactive/component-renderer"

interface LessonContentProps {
  content: string
  className?: string
}

// {{component:some-uuid-here}}
const COMPONENT_TOKEN_RE = /\{\{component:([^}]+)\}\}/g

type ContentSegment =
  | { kind: "markdown"; text: string }
  | { kind: "component"; id: string }

function parseContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  COMPONENT_TOKEN_RE.lastIndex = 0
  while ((match = COMPONENT_TOKEN_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "markdown", text: content.slice(lastIndex, match.index) })
    }
    segments.push({ kind: "component", id: match[1].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ kind: "markdown", text: content.slice(lastIndex) })
  }

  return segments
}

function slugify(text: string) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const components: Components = {
  h1: ({ children }) => {
    const id = slugify(String(children))
    const title = String(children)
    return (
      <h1
        id={id}
        data-section-id={id}
        data-section-title={title}
        className="text-2xl font-bold mt-12 mb-4 first:mt-0 scroll-mt-24"
      >
        {children}
      </h1>
    )
  },
  h2: ({ children }) => {
    const id = slugify(String(children))
    const title = String(children)
    return (
      <h2
        id={id}
        data-section-id={id}
        data-section-title={title}
        className="text-xl font-bold mt-10 mb-3 scroll-mt-24"
      >
        {children}
      </h2>
    )
  },
  h3: ({ children }) => {
    const id = slugify(String(children))
    const title = String(children)
    return (
      <h3
        id={id}
        data-section-id={id}
        data-section-title={title}
        className="text-lg font-semibold mt-8 mb-2 scroll-mt-24"
      >
        {children}
      </h3>
    )
  },
  p: ({ children }) => (
    <p className="text-base leading-[1.85] mb-5 text-foreground/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-5 space-y-2 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 space-y-2 pl-5 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-base leading-[1.7] text-foreground/90 flex gap-2.5">
      <span className="text-primary mt-[5px] shrink-0 text-xs">●</span>
      <span>{children}</span>
    </li>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      const lang = className?.replace("language-", "") ?? ""
      return (
        <div className="mb-6 rounded-xl overflow-hidden border border-border shadow-sm">
          {lang && (
            <div className="flex items-center justify-between px-4 py-2 bg-muted border-b text-[11px] font-mono text-muted-foreground">
              <span className="uppercase tracking-wide">{lang}</span>
            </div>
          )}
          <pre className="overflow-x-auto p-5 bg-muted/40 text-sm font-mono leading-relaxed">
            <code className="text-foreground">{children}</code>
          </pre>
        </div>
      )
    }
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded-md text-[13.5px] font-mono text-primary">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <>{children}</>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-[3px] border-primary/50 pl-5 py-1">
      <div className="text-base leading-[1.8] text-foreground/70 italic">{children}</div>
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/80">{children}</em>
  ),
  table: ({ children }) => (
    <div className="mb-6 overflow-x-auto rounded-xl border shadow-sm">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted text-xs uppercase text-muted-foreground tracking-wide">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 border-t text-foreground/90">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
  ),
  hr: () => <hr className="my-10 border-border" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
    >
      {children}
    </a>
  ),
}

export function LessonContent({ content, className }: LessonContentProps) {
  const segments = parseContent(content)

  return (
    <div className={cn("prose-article", className)}>
      {segments.map((seg, i) =>
        seg.kind === "component" ? (
          <ComponentRenderer key={`${seg.id}-${i}`} id={seg.id} />
        ) : (
          <ReactMarkdown key={i} components={components}>
            {seg.text}
          </ReactMarkdown>
        )
      )}
    </div>
  )
}
