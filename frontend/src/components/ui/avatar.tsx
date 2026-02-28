import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/20 font-semibold text-primary shrink-0",
        sizeStyles[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
