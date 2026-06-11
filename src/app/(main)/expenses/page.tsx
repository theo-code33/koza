import { getLocale, getTranslations } from "next-intl/server";
import { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { ExpensesManager } from "@/components/expenses/expenses-manager";
import { listMonthExpenses } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { isMonthOpen } from "@/lib/period-guard";
import { formatEUR } from "@/lib/formatters";
import { currentMonth } from "@/lib/month";
import { getCurrentUserId } from "@/lib/current-user";
import type { CategoryKey } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const locale = (await getLocale()) as "fr" | "en";
  const t = await getTranslations("expenses");
  const userId = await getCurrentUserId();
  const month = currentMonth();
  const [expenses, budgets, open] = await Promise.all([
    listMonthExpenses(userId, month),
    prisma.budget.findMany({ where: { userId }, select: { id: true, name: true, category: true } }),
    isMonthOpen(userId, month),
  ]);
  const total = expenses.reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
  const rows = expenses.map((expense) => ({
    id: expense.id,
    amount: expense.amount.toString(),
    description: expense.description,
    date: expense.date.toISOString().slice(0, 10),
    category: expense.category as CategoryKey,
    subcategory: expense.subcategory,
    budgetId: expense.budgetId,
  }));
  const budgetOptions = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    category: budget.category as CategoryKey,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">{t("pageTitle")}</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        {total.gt(0) ? t("summary", { amount: formatEUR(total, locale) }) : t("summaryEmpty")}
      </p>
      <Link href="/recurring" className="mt-4 text-[14px] font-medium text-accent">
        {t("manageRecurring")}
      </Link>
      <div className="mt-8">
        <ExpensesManager expenses={rows} budgets={budgetOptions} readOnly={!open} />
      </div>
    </main>
  );
}
