import { useLocale } from "next-intl";
import { formatEUR } from "@/lib/formatters";

interface PrevMonthDeltaProps {
  current: string;
  previous: string;
}

export function PrevMonthDelta({ current, previous }: PrevMonthDeltaProps) {
  const locale = useLocale() as "fr" | "en";
  const diff = Number(current) - Number(previous);
  if (Number(current) === 0 && Number(previous) === 0) return null;
  if (diff === 0) {
    return <p className="text-[13px] text-text-secondary">Autant que le mois dernier.</p>;
  }
  const amount = formatEUR(Math.abs(diff), locale);
  const label =
    diff < 0 ? `${amount} de moins que le mois dernier` : `${amount} de plus que le mois dernier`;
  return <p className="text-[13px] text-text-secondary">{label}</p>;
}
