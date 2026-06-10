"use client";

import { useRouter } from "next/navigation";
import { MonthNav } from "@/components/ui/month-nav";
import { formatMonth } from "@/lib/formatters";
import { previousMonth, nextMonth, currentMonth } from "@/lib/month";

interface DashboardMonthNavProps {
  month: string;
}

export function DashboardMonthNav({ month }: DashboardMonthNavProps) {
  const router = useRouter();
  const canNext = month < currentMonth();
  return (
    <MonthNav
      title={formatMonth(month)}
      canPrev
      canNext={canNext}
      onPrev={() => router.push(`/dashboard?month=${previousMonth(month)}`)}
      onNext={() => router.push(`/dashboard?month=${nextMonth(month)}`)}
    />
  );
}
