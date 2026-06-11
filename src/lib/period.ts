import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { nextMonth } from "@/lib/month";
import { computeBase, computeCarryOut } from "@/lib/budget";
import { materializeRecurring } from "@/lib/recurring";

function sum(rows: { amount: Prisma.Decimal | string }[]): Prisma.Decimal {
  return rows.reduce((acc, r) => acc.plus(r.amount), new Prisma.Decimal(0));
}

// carryOut figé d'un mois clôturé = base(M) − dépenses(M), base = entrées(M) + carryIn.
async function frozenCarryOut(
  userId: string,
  month: string,
  carryIn: Prisma.Decimal,
): Promise<Prisma.Decimal> {
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ where: { userId, month } }),
    prisma.expense.findMany({ where: { userId, month } }),
  ]);
  return computeCarryOut(computeBase(sum(incomes), carryIn), sum(expenses));
}

// Réconciliation paresseuse idempotente : clôture les mois franchis en cascade,
// propage le report, ouvre le mois courant et matérialise ses récurrentes.
export async function reconcile(userId: string, today: Date): Promise<void> {
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const latest = await prisma.monthlyPeriod.findFirst({
    where: { userId },
    orderBy: { month: "desc" },
  });

  if (!latest) {
    await prisma.monthlyPeriod.create({
      data: { userId, month: current, carryIn: new Prisma.Decimal(0) },
    });
    await materializeRecurring(userId, current);
    return;
  }

  let cursorMonth = latest.month;
  let cursorCarryIn = latest.carryIn;
  let cursorId = latest.id;

  while (cursorMonth < current) {
    const carryOut = await frozenCarryOut(userId, cursorMonth, cursorCarryIn);
    await prisma.monthlyPeriod.update({
      where: { id: cursorId },
      data: { carryOut, closedAt: new Date() },
    });
    await prisma.recurringOccurrence.updateMany({
      where: { userId, month: cursorMonth, status: "PENDING" },
      data: { status: "DROPPED" },
    });

    const next = nextMonth(cursorMonth);
    const created = await prisma.monthlyPeriod.create({
      data: { userId, month: next, carryIn: carryOut },
    });
    await materializeRecurring(userId, next);

    cursorMonth = next;
    cursorCarryIn = carryOut;
    cursorId = created.id;
  }
}
