import { useLocale, useTranslations } from "next-intl";
import { formatEUR } from "@/lib/formatters";

interface PrevMonthDeltaProps {
  current: string;
  previous: string;
}

export function PrevMonthDelta({ current, previous }: PrevMonthDeltaProps) {
  const locale = useLocale() as "fr" | "en";
  const t = useTranslations("dashboard");
  const diff = Number(current) - Number(previous);
  if (Number(current) === 0 && Number(previous) === 0) return null;
  if (diff === 0) {
    return <p className="text-[13px] text-text-secondary">{t("deltaSame")}</p>;
  }
  const amount = formatEUR(Math.abs(diff), locale);
  const label = diff < 0 ? t("deltaLess", { amount }) : t("deltaMore", { amount });
  return <p className="text-[13px] text-text-secondary">{label}</p>;
}
