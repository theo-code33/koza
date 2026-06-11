"use client";

import { useLocale } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { formatEUR, formatMonthShort } from "@/lib/formatters";

export interface SavingsProgressPoint {
  month: string;
  cumulative: number;
}

interface SavingsProgressChartProps {
  points: SavingsProgressPoint[];
}

function SavingsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const locale = useLocale() as "fr" | "en";
  if (!active || !payload?.length || typeof label !== "string") return null;
  return (
    <div className="rounded-[10px] border border-line bg-surface/80 px-3 py-2 text-[12px] shadow-card backdrop-blur-sm">
      <div className="mb-1 capitalize text-text-secondary">{formatMonthShort(label, locale)}</div>
      <div className="num text-text">{formatEUR(Number(payload[0]?.value ?? 0), locale)}</div>
    </div>
  );
}

export function SavingsProgressChart({ points }: SavingsProgressChartProps) {
  const locale = useLocale() as "fr" | "en";
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="month"
            tickFormatter={(month: string) => formatMonthShort(month, locale)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            interval="preserveStartEnd"
          />
          <Tooltip content={<SavingsTooltip />} cursor={{ stroke: "var(--color-line)" }} />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="var(--color-savings)"
            fill="var(--color-savings-bg)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
