import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface StepIndicatorProps {
  step: number;
  total?: number;
}

export function StepIndicator({ step, total = 3 }: StepIndicatorProps) {
  const t = useTranslations("onboarding");
  return (
    <div className="mb-8 flex items-center gap-1.5" aria-label={t("step", { step, total })}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn("h-1 w-6 rounded-full", index < step ? "bg-accent" : "bg-surface-alt")}
        />
      ))}
    </div>
  );
}
