import type { ReactNode } from "react";

interface FieldProps {
  label?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-[13px] font-medium text-text-secondary">{label}</span>
      ) : null}
      {children}
      {hint ? <span className="mt-1.5 block text-[12px] text-muted">{hint}</span> : null}
    </label>
  );
}
