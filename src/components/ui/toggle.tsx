import { cn } from "@/lib/cn";

interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "tap relative h-7 w-[46px] shrink-0 rounded-full transition-colors",
        on ? "bg-accent" : "bg-surface-alt",
      )}
    >
      <span
        className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-[left] duration-200 ease-out"
        style={{ left: on ? 21 : 3, boxShadow: "0 1px 3px rgba(0,0,0,.2)" }}
      />
    </button>
  );
}
