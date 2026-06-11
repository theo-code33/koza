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
import { CATEGORY_ORDER } from "@/lib/categories";

export interface MonthlyTrendPoint {
  month: string;
  essential: number;
  leisure: number;
  savings: number;
}

interface MonthlyTrendChartProps {
  points: MonthlyTrendPoint[];
}

function TrendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const locale = useLocale() as "fr" | "en";
  if (!active || !payload?.length || typeof label !== "string") return null;
  return (
    <div className="rounded-[10px] border border-line bg-surface/80 px-3 py-2 text-[12px] shadow-card backdrop-blur-sm">
      <div className="mb-1 capitalize text-text-secondary">{formatMonthShort(label, locale)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="num text-text">
          {formatEUR(Number(entry.value ?? 0), locale)}
        </div>
      ))}
    </div>
  );
}

export function MonthlyTrendChart({ points }: MonthlyTrendChartProps) {
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
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--color-line)" }} />
          {CATEGORY_ORDER.map((category) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stackId="spend"
              stroke={`var(--color-${category})`}
              fill={`var(--color-${category}-bg)`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
