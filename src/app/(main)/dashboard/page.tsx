import Link from "next/link";
import { Wallet } from "lucide-react";
import { getMonthlySummary } from "@/lib/dashboard";
import { currentMonth } from "@/lib/month";
import { SoftBanner } from "@/components/ui/soft-banner";
import { DashboardMonthNav } from "@/components/dashboard/dashboard-month-nav";
import { PrevMonthDelta } from "@/components/dashboard/prev-month-delta";
import { CategoryDonut } from "@/components/charts/category-donut";
import { CategoryProgressCard } from "@/components/dashboard/category-progress-card";

export const dynamic = "force-dynamic";

function resolveMonth(value: string | undefined): string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const month = resolveMonth(rawMonth);
  const summary = await getMonthlySummary(month);
  const income = Number(summary.income);
  const slices = summary.categories.map((category) => ({
    category: category.category,
    amount: Number(category.spent),
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-8 px-6 py-12">
      <DashboardMonthNav month={month} />

      {income === 0 ? (
        <Link href="/incomes">
          <SoftBanner icon={Wallet} tone="accent">
            Ajoute tes revenus pour voir tes objectifs 50/30/20.
          </SoftBanner>
        </Link>
      ) : (
        <PrevMonthDelta
          current={summary.totalSpent.toString()}
          previous={summary.previousTotalSpent.toString()}
        />
      )}

      <CategoryDonut slices={slices} balance={Number(summary.balance)} />

      <div className="flex flex-col gap-3">
        {summary.categories.map((category) => (
          <CategoryProgressCard
            key={category.category}
            category={category.category}
            spent={category.spent.toString()}
            target={category.target.toString()}
          />
        ))}
      </div>
    </main>
  );
}
