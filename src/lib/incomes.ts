import type { Income } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Revenus d'un mois donné, triés par date de création.
export function listMonthIncomes(month: string): Promise<Income[]> {
  return prisma.income.findMany({ where: { month }, orderBy: { createdAt: "asc" } });
}
