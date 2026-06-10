import { prisma } from "@/lib/prisma";

export interface ExportData {
  exportedAt: string;
  incomes: unknown[];
  expenses: unknown[];
  budgets: unknown[];
  settings: unknown;
}

// Rassemble toutes les données de l'app en un objet sérialisable (montants Decimal → string).
export async function buildExport(): Promise<ExportData> {
  const [incomes, expenses, budgets, settings] = await Promise.all([
    prisma.income.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.expense.findMany({ orderBy: { date: "asc" } }),
    prisma.budget.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.userSettings.findUnique({ where: { id: "default" } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    incomes: incomes.map((income) => ({ ...income, amount: income.amount.toString() })),
    expenses: expenses.map((expense) => ({ ...expense, amount: expense.amount.toString() })),
    budgets: budgets.map((budget) => ({
      ...budget,
      targetAmount: budget.targetAmount.toString(),
    })),
    settings,
  };
}
