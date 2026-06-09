import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PillProps {
  children: ReactNode;
  className?: string;
}

export function Pill({ children, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium",
        "bg-surface-alt text-text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}
