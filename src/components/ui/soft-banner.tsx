import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type BannerTone = "warning" | "accent" | "over";

interface SoftBannerProps {
  icon: LucideIcon;
  tone?: BannerTone;
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}

const TONE_CLASSES: Record<BannerTone, { bg: string; fg: string }> = {
  warning: { bg: "bg-warning-bg", fg: "text-warning" },
  accent: { bg: "bg-accent-soft", fg: "text-accent" },
  over: { bg: "bg-over-bg", fg: "text-over" },
};

export function SoftBanner({
  icon: Icon,
  tone = "warning",
  children,
  action,
  onAction,
}: SoftBannerProps) {
  const tones = TONE_CLASSES[tone];
  return (
    <div
      data-testid="soft-banner"
      className={cn("flex items-center gap-3 rounded-card px-4 py-3.5", tones.bg)}
    >
      <Icon size={18} strokeWidth={1.6} className={tones.fg} />
      <div className="flex-1 text-[14px] text-text">{children}</div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className={cn("tap shrink-0 text-[13px] font-medium", tones.fg)}
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
