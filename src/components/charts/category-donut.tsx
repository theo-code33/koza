"use client";

import { useLocale } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatEUR } from "@/lib/formatters";
import type { CategoryKey } from "@/lib/categories";

interface DonutSlice {
  category: CategoryKey;
  amount: number;
}

interface CategoryDonutProps {
  slices: DonutSlice[];
  balance: number;
}

export function CategoryDonut({ slices, balance }: CategoryDonutProps) {
  const locale = useLocale() as "fr" | "en";
  const total = slices.reduce((acc, slice) => acc + slice.amount, 0);
  const data =
    total > 0
      ? slices.filter((slice) => slice.amount > 0)
      : [{ category: "empty" as const, amount: 1 }];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            innerRadius="74%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            paddingAngle={total > 0 ? 2 : 0}
          >
            {data.map((slice) => (
              <Cell
                key={slice.category}
                fill={total > 0 ? `var(--color-${slice.category})` : "var(--color-surface-alt)"}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`num text-[28px] font-light ${balance < 0 ? "text-over" : "text-text"}`}>
          {formatEUR(balance, locale)}
        </span>
        <span className="text-[12px] text-text-secondary">restant</span>
      </div>
    </div>
  );
}
