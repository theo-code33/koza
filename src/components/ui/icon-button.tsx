import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: number;
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  size = 20,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tap grid h-10 w-10 place-items-center rounded-full transition",
        active ? "bg-accent-soft text-accent" : "bg-transparent text-text-secondary",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      <Icon size={size} strokeWidth={1.6} />
    </button>
  );
}
