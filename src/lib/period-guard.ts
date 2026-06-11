import { prisma } from "@/lib/prisma";

// Vrai si le mois est ouvert (mutations autorisées) : pas de period ou closedAt null.
export async function isMonthOpen(userId: string, month: string): Promise<boolean> {
  const period = await prisma.monthlyPeriod.findUnique({
    where: { userId_month: { userId, month } },
  });
  return !period?.closedAt;
}
