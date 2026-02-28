import * as React from "react";

import { cn } from "@/lib/utils";

interface NativeSelectProps extends React.ComponentProps<"select"> {
  label?: string;
  options: { value: string; label: string }[];
}

function NativeSelect({ className, label, options, ...props }: NativeSelectProps) {
  const select = (
    <select
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  if (label) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none" htmlFor={props.id}>
          {label}
        </label>
        {select}
      </div>
    );
  }

  return select;
}

export { NativeSelect };
