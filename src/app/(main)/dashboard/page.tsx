import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Wallet } from "lucide-react";
import { getMonthlySummary } from "@/lib/dashboard";
import { getAnnualSummary } from "@/lib/annual";
import { listBudgetsWithSpent } from "@/lib/budgets";
import { deriveNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { currentMonth, currentYear } from "@/lib/month";
import { reconcile } from "@/lib/period";
import { getCurrentUserId } from "@/lib/current-user";
import { formatEUR } from "@/lib/formatters";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import { SoftBanner } from "@/components/ui/soft-banner";
import { NotificationList } from "@/components/notifications/notification-list";
import { DashboardMonthNav } from "@/components/dashboard/dashboard-month-nav";
import { DashboardYearNav } from "@/components/dashboard/dashboard-year-nav";
import { DashboardViewToggle } from "@/components/dashboard/dashboard-view-toggle";
import { CarryLine } from "@/components/dashboard/carry-line";
import { CategoryDonut } from "@/components/charts/category-donut";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { SavingsProgressChart } from "@/components/charts/savings-progress-chart";
import { CategoryProgressCard } from "@/components/dashboard/category-progress-card";
import { PendingConfirmations } from "@/components/recurring/pending-confirmations";

export const dynamic = "force-dynamic";

function resolveMonth(value: string | undefined): string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; year?: string }>;
}) {
  const { month: rawMonth, view: rawView, year: rawYear } = await searchParams;
  const view = rawView === "year" ? "year" : "month";
  const month = resolveMonth(rawMonth);
  const year = typeof rawYear === "string" && /^\d{4}$/.test(rawYear) ? rawYear : currentYear();
  const userId = await getCurrentUserId();
  // Réconciliation serveur avant toute lecture : clôt les mois franchis et matérialise
  // les récurrentes du mois courant, pour que le résumé les reflète dès le premier rendu.
  await reconcile(userId, new Date());
  const t = await getTranslations("dashboard");

  if (view === "year") {
    const locale = (await getLocale()) as "fr" | "en";
    const tc = await getTranslations("categories");
    const annual = await getAnnualSummary(userId, year);
    const slices = annual.totals.map((total) => ({
      category: total.category,
      amount: Number(total.spent),
    }));
    const trend = annual.monthly.map((point) => ({
      month: point.month,
      essential: Number(point.essential),
      leisure: Number(point.leisure),
      savings: Number(point.savings),
    }));
    const savings = annual.savingsCumulative.map((point) => ({
      month: point.month,
      cumulative: Number(point.cumulative),
    }));
    return (
      <main className="mx-auto flex max-w-[720px] flex-col gap-8 px-6 py-12">
        <DashboardViewToggle view="year" />
        <DashboardYearNav year={year} />

        <section className="flex flex-col gap-4">
          <CategoryDonut
            slices={slices}
            balance={0}
            centerValue={Number(annual.totalSpent)}
            centerLabel={t("annualTotalSpent")}
          />
          <div className="flex flex-col gap-2">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="flex items-center justify-between text-[14px]">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-pill ${CATEGORIES[category].dotClass}`} />
                  {tc(category)}
                </span>
                <span className="num text-text-secondary">
                  {formatEUR(
                    Number(annual.totals.find((x) => x.category === category)?.spent ?? 0),
                    locale,
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-[20px]">{t("trendTitle")}</h2>
          <MonthlyTrendChart points={trend} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-[20px]">{t("savingsTitle")}</h2>
          <SavingsProgressChart points={savings} />
        </section>
      </main>
    );
  }

  const [summary, pending, budgets] = await Promise.all([
    getMonthlySummary(userId, month),
    prisma.recurringOccurrence.findMany({
      where: { userId, month, status: "PENDING" },
      include: { recurring: true },
    }),
    listBudgetsWithSpent(userId),
  ]);
  const notifications = summary.closed ? [] : deriveNotifications(summary, budgets);
  const income = Number(summary.income);
  const slices = summary.categories.map((category) => ({
    category: category.category,
    amount: Number(category.spent),
  }));
  const pendingItems = pending.map((occurrence) => ({
    id: occurrence.id,
    label: occurrence.recurring.label,
    estimate: occurrence.recurring.amount.toString(),
  }));

  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-8 px-6 py-12">
      <DashboardViewToggle view="month" />
      <DashboardMonthNav month={month} />

      {summary.closed ? <p className="text-[13px] text-muted">{t("closedReadOnly")}</p> : null}

      <NotificationList items={notifications} />

      {income === 0 ? (
        <Link href="/incomes">
          <SoftBanner icon={Wallet} tone="accent">
            {t("noIncomeBanner")}
          </SoftBanner>
        </Link>
      ) : (
        <CarryLine carryIn={summary.carryIn.toString()} />
      )}

      <PendingConfirmations items={pendingItems} />

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
