"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { IconButton } from "@/components/ui/icon-button";
import { previousYear, nextYear, currentYear } from "@/lib/month";

interface DashboardYearNavProps {
  year: string;
}

export function DashboardYearNav({ year }: DashboardYearNavProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const canNext = year < currentYear();
  const go = (target: string) => router.push(`/dashboard?view=year&year=${target}`);
  return (
    <div className="flex items-center justify-between">
      <IconButton icon={ChevronLeft} label={t("prevYear")} onClick={() => go(previousYear(year))} />
      <div className="whitespace-nowrap font-serif text-[28px] leading-none">{year}</div>
      <IconButton
        icon={ChevronRight}
        label={t("nextYear")}
        onClick={() => go(nextYear(year))}
        disabled={!canNext}
      />
    </div>
  );
}
