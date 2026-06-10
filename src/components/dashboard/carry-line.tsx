import { useLocale, useTranslations } from "next-intl";
import { formatEUR } from "@/lib/formatters";

interface CarryLineProps {
  carryIn: string;
}

export function CarryLine({ carryIn }: CarryLineProps) {
  const locale = useLocale() as "fr" | "en";
  const t = useTranslations("dashboard");
  const value = Number(carryIn);
  if (value === 0) return null;
  const label =
    value > 0
      ? t("carryPositive", { amount: formatEUR(value, locale) })
      : t("carryNegative", { amount: formatEUR(value, locale) });
  return <p className="text-[13px] text-text-secondary">{label}</p>;
}
