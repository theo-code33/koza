"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface OverlayProps {
  children: ReactNode;
  onClose: () => void;
  /** "panel" = right slide-in (desktop), "sheet" = bottom sheet (mobile). */
  mode: "panel" | "sheet";
}

export function Overlay({ children, onClose, mode }: OverlayProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        mode === "panel" ? "items-stretch justify-end" : "items-end justify-center",
      )}
    >
      <div
        data-testid="overlay-scrim"
        onClick={onClose}
        className="scrim-enter absolute inset-0 bg-[rgba(20,20,22,0.34)]"
      />
      <div
        className={cn(
          "relative bg-surface",
          mode === "panel"
            ? "panel-enter h-full w-[440px] max-w-[92vw] border-l border-line"
            : "sheet-enter w-full max-w-[560px] rounded-t-[24px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
