"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { clsx } from "clsx";

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold text-gray-900 mt-3 mb-1">{children}</h4>,
  p: ({ children }) => <p className="text-gray-700 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-gray-700">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-gray-700">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-teal-400 pl-4 italic text-gray-600 my-2">{children}</blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    return isBlock ? (
      <code className="block bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono overflow-x-auto">{children}</code>
    ) : (
      <code className="bg-gray-100 text-teal-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    );
  },
  pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
  hr: () => <hr className="border-gray-200 my-4" />,
  a: ({ href, children }) => (
    <a href={href} className="text-teal-700 underline underline-offset-2 hover:text-teal-600" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  table: ({ children }) => (
    <div className="my-4 w-full overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  tr: ({ children }) => <tr className="even:bg-gray-50/60 transition-colors">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-gray-700 align-top">{children}</td>
  ),
};
import { FileText, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CaseStudyData } from "@/lib/types";

interface CaseStudyViewerProps {
  data: CaseStudyData;
  title: string;
  isCompleted: boolean;
  onComplete?: () => void;
}

export function CaseStudyViewer({
  data,
  title,
  isCompleted,
  onComplete,
}: CaseStudyViewerProps) {
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(
    new Set(),
  );

  const toggleQuestion = (idx: number) => {
    setRevealedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Badge bg="bg-teal-100" text="text-teal-700">
          <FileText className="h-3 w-3 mr-1 inline" />
          Case Study
        </Badge>
        <span className="text-sm text-gray-500">{title}</span>
      </div>

      {/* Scenario */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <ReactMarkdown components={MARKDOWN_COMPONENTS}>{data.scenario}</ReactMarkdown>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Discussion Questions
        </h3>
        {data.questions.map((q, idx) => {
          const isRevealed = revealedQuestions.has(idx);
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(idx)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-semibold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {q.question}
                  </span>
                </div>
                {isRevealed ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </button>
              {isRevealed && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-teal-600 mb-1">
                    Sample Answer
                  </p>
                  <p className="text-sm text-gray-600">{q.sample_answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete */}
      {onComplete && (
        <div className="flex justify-center">
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
