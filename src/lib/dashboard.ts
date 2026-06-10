import { Prisma } from "@/generated/prisma/client";
import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { computeEnvelopes } from "@/lib/budget";
import { previousMonth } from "@/lib/month";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface CategorySpend {
  category: CategoryKey;
  spent: Prisma.Decimal;
  target: Prisma.Decimal;
}

export interface MonthlySummary {
  month: string;
  income: Prisma.Decimal;
  totalSpent: Prisma.Decimal;
  balance: Prisma.Decimal;
  categories: CategorySpend[];
  previousTotalSpent: Prisma.Decimal;
}

function sum(amounts: { amount: Prisma.Decimal | string }[]): Prisma.Decimal {
  return amounts.reduce((acc, item) => acc.plus(item.amount), new Prisma.Decimal(0));
}

// Synthèse mensuelle : revenus, dépenses par catégorie vs objectifs 50/30/20, solde, total du mois précédent.
export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const [incomes, expenses, previousExpenses] = await Promise.all([
    listMonthIncomes(month),
    listMonthExpenses(month),
    listMonthExpenses(previousMonth(month)),
  ]);

  const income = sum(incomes);
  const totalSpent = sum(expenses);
  const envelopes = computeEnvelopes(income);

  const categories: CategorySpend[] = CATEGORY_ORDER.map((category) => ({
    category,
    spent: sum(expenses.filter((expense) => expense.category === category)),
    target: envelopes[category],
  }));

  return {
    month,
    income,
    totalSpent,
    balance: income.minus(totalSpent),
    categories,
    previousTotalSpent: sum(previousExpenses),
  };
}
