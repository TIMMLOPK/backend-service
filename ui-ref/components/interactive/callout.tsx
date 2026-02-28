"use client"

import ReactMarkdown from "react-markdown"
import {
  IconInfoCircle,
  IconAlertTriangle,
  IconBulb,
  IconFlame,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { CalloutProps } from "@/lib/types"

const CALLOUT_CONFIG = {
  info: {
    icon: IconInfoCircle,
    containerClass: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    iconClass: "text-blue-500",
    titleClass: "text-blue-900 dark:text-blue-200",
    bodyClass: "text-blue-800 dark:text-blue-300",
  },
  warning: {
    icon: IconAlertTriangle,
    containerClass: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    iconClass: "text-amber-500",
    titleClass: "text-amber-900 dark:text-amber-200",
    bodyClass: "text-amber-800 dark:text-amber-300",
  },
  tip: {
    icon: IconBulb,
    containerClass: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    iconClass: "text-emerald-500",
    titleClass: "text-emerald-900 dark:text-emerald-200",
    bodyClass: "text-emerald-800 dark:text-emerald-300",
  },
  danger: {
    icon: IconFlame,
    containerClass: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    iconClass: "text-red-500",
    titleClass: "text-red-900 dark:text-red-200",
    bodyClass: "text-red-800 dark:text-red-300",
  },
}

export function CalloutComponent({ props }: { props: CalloutProps }) {
  const config = CALLOUT_CONFIG[props.type]
  const Icon = config.icon

  return (
    <div className={cn("my-6 rounded-xl border p-4 flex gap-3", config.containerClass)}>
      <Icon className={cn("size-5 mt-0.5 shrink-0", config.iconClass)} />
      <div className="min-w-0">
        <p className={cn("font-semibold text-sm mb-1", config.titleClass)}>{props.title}</p>
        <div className={cn("text-sm leading-relaxed [&_strong]:font-semibold [&_code]:bg-black/10 [&_code]:px-1 [&_code]:rounded", config.bodyClass)}>
          <ReactMarkdown>{props.body_markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
