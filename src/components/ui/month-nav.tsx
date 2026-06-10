import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

interface MonthNavProps {
  title: string;
  subtitle?: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNav({ title, subtitle, canPrev, canNext, onPrev, onNext }: MonthNavProps) {
  const t = useTranslations("common");
  return (
    <div className="flex items-center justify-between">
      <IconButton icon={ChevronLeft} label={t("prevMonth")} onClick={onPrev} disabled={!canPrev} />
      <div className="text-center">
        <div className="whitespace-nowrap font-serif text-[28px] capitalize leading-none">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1.5 whitespace-nowrap text-[12px] text-muted">{subtitle}</div>
        ) : null}
      </div>
      <IconButton icon={ChevronRight} label={t("nextMonth")} onClick={onNext} disabled={!canNext} />
    </div>
  );
}
