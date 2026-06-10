import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface BudgetWithSpent {
  id: string;
  name: string;
  targetAmount: Prisma.Decimal;
  spent: Prisma.Decimal;
  category: string;
  deadline: Date | null;
}

// Budgets avec le cumul de toutes leurs dépenses liées (tous mois confondus).
export async function listBudgetsWithSpent(): Promise<BudgetWithSpent[]> {
  const budgets = await prisma.budget.findMany({
    include: { expenses: { select: { amount: true } } },
    orderBy: { createdAt: "asc" },
  });
  return budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    targetAmount: budget.targetAmount,
    category: budget.category,
    deadline: budget.deadline,
    spent: budget.expenses.reduce(
      (sum, expense) => sum.plus(expense.amount),
      new Prisma.Decimal(0),
    ),
  }));
}
