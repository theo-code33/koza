import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { computeBase, computeTargets, computeCarryOut } from "@/lib/budget";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface CategorySpend {
  category: CategoryKey;
  spent: Prisma.Decimal;
  target: Prisma.Decimal;
}

export interface MonthlySummary {
  month: string;
  income: Prisma.Decimal;
  carryIn: Prisma.Decimal;
  base: Prisma.Decimal;
  totalSpent: Prisma.Decimal;
  balance: Prisma.Decimal; // report sortant live = base - totalSpent
  categories: CategorySpend[];
  closed: boolean;
}

function sum(rows: { amount: Prisma.Decimal | string }[]): Prisma.Decimal {
  return rows.reduce((acc, r) => acc.plus(r.amount), new Prisma.Decimal(0));
}

// Synthèse mensuelle : base = entrées + report entrant, objectifs 50/30/20 dérivés de la base,
// dépenses par catégorie, solde (report sortant live), état clôturé.
export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const [incomes, expenses, period] = await Promise.all([
    listMonthIncomes(month),
    listMonthExpenses(month),
    prisma.monthlyPeriod.findUnique({ where: { month } }),
  ]);

  const income = sum(incomes);
  const carryIn = period?.carryIn ?? new Prisma.Decimal(0);
  const base = computeBase(income, carryIn);
  const totalSpent = sum(expenses);
  const targets = computeTargets(base);

  const categories: CategorySpend[] = CATEGORY_ORDER.map((category) => ({
    category,
    spent: sum(expenses.filter((e) => e.category === category)),
    target: targets[category],
  }));

  return {
    month,
    income,
    carryIn,
    base,
    totalSpent,
    balance: computeCarryOut(base, totalSpent),
    categories,
    closed: Boolean(period?.closedAt),
  };
}
