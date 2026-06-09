import type { Ref } from "react";
import { cn } from "@/lib/cn";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  inputRef,
  className,
}: TextInputProps) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none",
        className,
      )}
    />
  );
}
