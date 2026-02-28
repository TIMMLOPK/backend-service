"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LectureData } from "@/lib/types";

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-6 mb-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mt-5 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h4>,
  p: ({ children }) => <p className="text-foreground/80 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-foreground/80">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-foreground/80">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-2">{children}</blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    return isBlock ? (
      <code className="block bg-muted text-foreground rounded-lg p-4 text-sm font-mono overflow-x-auto">{children}</code>
    ) : (
      <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    );
  },
  pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
  hr: () => <hr className="border-border my-4" />,
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
};

interface LectureViewerProps {
  title: string;
  data: LectureData;
  isCompleted: boolean;
  onComplete?: () => void;
}

export function LectureViewer({
  title,
  data,
  isCompleted,
  onComplete,
}: LectureViewerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge bg="bg-primary/20" text="text-primary">
          <BookOpen className="h-3 w-3 mr-1 inline" />
          Lecture
        </Badge>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>

      <div className="space-y-4 leading-relaxed">
        <ReactMarkdown components={MARKDOWN_COMPONENTS}>{data.content}</ReactMarkdown>
      </div>

      {onComplete && (
        <div className="flex justify-center pt-2">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle className="h-5 w-5" />
              Marked as read
            </div>
          ) : (
            <Button onClick={onComplete}>
              <CheckCircle className="h-4 w-4" />
              Mark as Read
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
