"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        data-testid="dialog-scrim"
        onClick={onCancel}
        className="scrim-enter absolute inset-0 bg-[rgba(20,20,22,0.34)]"
      />
      <div className="card screen-enter relative w-full max-w-[360px] p-6">
        <h2 className="font-serif text-[20px] text-text">{title}</h2>
        {message ? <p className="mt-2 text-[14px] text-text-secondary">{message}</p> : null}
        <div className="mt-6 flex gap-3">
          <Button variant="surface" full onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button full onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
