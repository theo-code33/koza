import { formatEUR } from "@/lib/formatters";

interface CarryLineProps {
  carryIn: string;
}

export function CarryLine({ carryIn }: CarryLineProps) {
  const value = Number(carryIn);
  if (value === 0) return null;
  const label =
    value > 0
      ? `Report du mois dernier : +${formatEUR(value)}`
      : `Report du mois dernier : ${formatEUR(value)} à absorber`;
  return <p className="text-[13px] text-text-secondary">{label}</p>;
}
