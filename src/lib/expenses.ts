import type { Expense } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Dépenses d'un mois (clé month), les plus récentes d'abord.
export function listMonthExpenses(month: string): Promise<Expense[]> {
  return prisma.expense.findMany({ where: { month }, orderBy: { date: "desc" } });
}
