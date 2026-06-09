import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "soft" | "ghost" | "surface";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  full?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white",
  soft: "bg-accent-soft text-accent",
  ghost: "bg-transparent text-text-secondary",
  surface: "bg-surface-alt text-text",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  full,
  type = "button",
  disabled,
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tap inline-flex h-11 items-center justify-center gap-2 rounded-button px-5 text-[15px] font-medium",
        VARIANT_CLASSES[variant],
        full && "w-full",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {Icon ? <Icon size={18} strokeWidth={1.6} /> : null}
      {children}
    </button>
  );
}
