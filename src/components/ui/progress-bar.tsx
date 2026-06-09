import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  max: number;
  /** Tailwind bg-* class for the fill when on/under budget (e.g. "bg-essential"). */
  fillClass: string;
  height?: number;
}

export function ProgressBar({ value, max, fillClass, height = 4 }: ProgressBarProps) {
  const ratio = max > 0 ? value / max : 0;
  const over = ratio > 1;
  const pct = Math.min(ratio, 1) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="w-full overflow-hidden rounded-full bg-surface-alt"
      style={{ height }}
    >
      <div
        data-testid="progress-fill"
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          over ? "bg-over" : fillClass,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
