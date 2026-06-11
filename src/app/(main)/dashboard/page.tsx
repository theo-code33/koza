import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wallet } from "lucide-react";
import { getMonthlySummary } from "@/lib/dashboard";
import { listBudgetsWithSpent } from "@/lib/budgets";
import { deriveNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/month";
import { reconcile } from "@/lib/period";
import { getCurrentUserId } from "@/lib/current-user";
import { SoftBanner } from "@/components/ui/soft-banner";
import { NotificationList } from "@/components/notifications/notification-list";
import { DashboardMonthNav } from "@/components/dashboard/dashboard-month-nav";
import { CarryLine } from "@/components/dashboard/carry-line";
import { CategoryDonut } from "@/components/charts/category-donut";
import { CategoryProgressCard } from "@/components/dashboard/category-progress-card";
import { PendingConfirmations } from "@/components/recurring/pending-confirmations";

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
  const userId = await getCurrentUserId();
  // Réconciliation serveur avant toute lecture : clôt les mois franchis et matérialise
  // les récurrentes du mois courant, pour que le résumé les reflète dès le premier rendu.
  await reconcile(userId, new Date());
  const t = await getTranslations("dashboard");
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
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-8 px-6 py-12">
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
