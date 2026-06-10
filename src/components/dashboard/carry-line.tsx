import { useLocale } from "next-intl";
import { formatEUR } from "@/lib/formatters";

interface CarryLineProps {
  carryIn: string;
}

export function CarryLine({ carryIn }: CarryLineProps) {
  const locale = useLocale() as "fr" | "en";
  const value = Number(carryIn);
  if (value === 0) return null;
  const label =
    value > 0
      ? `Report du mois dernier : +${formatEUR(value, locale)}`
      : `Report du mois dernier : ${formatEUR(value, locale)} à absorber`;
  return <p className="text-[13px] text-text-secondary">{label}</p>;
}
