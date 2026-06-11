import type { Income } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Revenus d'un mois donné, triés par date de création.
export function listMonthIncomes(userId: string, month: string): Promise<Income[]> {
  return prisma.income.findMany({ where: { userId, month }, orderBy: { createdAt: "asc" } });
}
