import type { Expense } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/month";

// Dépenses d'un mois donné (filtrées par plage de dates), les plus récentes d'abord.
export function listMonthExpenses(month: string): Promise<Expense[]> {
  const { start, end } = monthRange(month);
  return prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: "desc" },
  });
}
