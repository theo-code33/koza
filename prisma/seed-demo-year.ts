import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildDemoDataset } from "../src/lib/demo-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function maskHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown-host";
  }
}

function dateInMonth(month: string, day: number): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, day);
}

function lastDayOfMonth(month: string): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0);
}

async function main() {
  const data = buildDemoDataset(currentMonth());
  console.log(`Seeding demo user ${data.user.email} → host ${maskHost(connectionString!)}`);

  const passwordHash = await bcrypt.hash(data.user.password, 10);

  // Upsert du compte par email — ne crée jamais de doublon, ne touche aucun autre compte.
  const user = await prisma.user.upsert({
    where: { email: data.user.email },
    update: { passwordHash },
    create: { email: data.user.email, passwordHash },
  });
  const userId = user.id;

  await prisma.userSettings.upsert({
    where: { userId },
    update: { locale: data.user.locale, theme: data.user.theme, onboardingCompleted: true },
    create: {
      userId,
      locale: data.user.locale,
      theme: data.user.theme,
      onboardingCompleted: true,
    },
  });

  // Idempotence : on efface UNIQUEMENT les données de ce userId. Jamais de wipe global.
  await prisma.recurringOccurrence.deleteMany({ where: { userId } });
  await prisma.expense.deleteMany({ where: { userId } });
  await prisma.income.deleteMany({ where: { userId } });
  await prisma.monthlyPeriod.deleteMany({ where: { userId } });
  await prisma.recurringExpense.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });

  // Budgets → map key → id.
  const budgetId = new Map<string, string>();
  for (const b of data.budgets) {
    const created = await prisma.budget.create({
      data: {
        userId,
        name: b.name,
        targetAmount: b.targetAmount,
        category: b.category,
        deadline: b.deadlineMonth ? dateInMonth(b.deadlineMonth, 1) : null,
      },
    });
    budgetId.set(b.key, created.id);
  }

  // Récurrentes → map key → id.
  const recurringId = new Map<string, string>();
  for (const r of data.recurring) {
    const created = await prisma.recurringExpense.create({
      data: {
        userId,
        label: r.label,
        type: r.type,
        amount: r.amount,
        category: r.category,
        subcategory: r.subcategory,
        frequency: r.frequency,
        anchorMonth: r.anchorMonth,
        endMonth: r.endMonth ?? null,
      },
    });
    recurringId.set(r.key, created.id);
  }

  // Revenus.
  await prisma.income.createMany({
    data: data.incomes.map((x) => ({
      userId,
      source: x.source,
      amount: x.amount,
      date: dateInMonth(x.month, x.day),
      month: x.month,
    })),
  });

  // Dépenses (résout budgetId/recurringId) → map (recurringKey, month) → expenseId.
  const expenseByRecurringMonth = new Map<string, string>();
  for (const e of data.expenses) {
    const created = await prisma.expense.create({
      data: {
        userId,
        amount: e.amount,
        description: e.description,
        date: dateInMonth(e.month, e.day),
        month: e.month,
        category: e.category,
        subcategory: e.subcategory,
        budgetId: e.budgetKey ? budgetId.get(e.budgetKey) : null,
        recurringId: e.recurringKey ? recurringId.get(e.recurringKey) : null,
      },
    });
    if (e.recurringKey) {
      expenseByRecurringMonth.set(`${e.recurringKey}:${e.month}`, created.id);
    }
  }

  // Occurrences (expenseId via la map pour APPLIED/CONFIRMED, null pour PENDING).
  await prisma.recurringOccurrence.createMany({
    data: data.occurrences.map((o) => ({
      userId,
      recurringId: recurringId.get(o.recurringKey)!,
      month: o.month,
      status: o.status,
      expenseId:
        o.status === "PENDING"
          ? null
          : (expenseByRecurringMonth.get(`${o.recurringKey}:${o.month}`) ?? null),
    })),
  });

  // Périodes mensuelles (report figé pour les mois clôturés).
  await prisma.monthlyPeriod.createMany({
    data: data.periods.map((p) => ({
      userId,
      month: p.month,
      carryIn: p.carryIn,
      carryOut: p.carryOut,
      closedAt: p.closed ? lastDayOfMonth(p.month) : null,
    })),
  });

  const [incomes, expenses, budgets, recurring, occurrences, periods] = await Promise.all([
    prisma.income.count({ where: { userId } }),
    prisma.expense.count({ where: { userId } }),
    prisma.budget.count({ where: { userId } }),
    prisma.recurringExpense.count({ where: { userId } }),
    prisma.recurringOccurrence.count({ where: { userId } }),
    prisma.monthlyPeriod.count({ where: { userId } }),
  ]);
  console.log(
    `Demo seed complete · incomes: ${incomes} · expenses: ${expenses} · budgets: ${budgets} · recurring: ${recurring} · occurrences: ${occurrences} · periods: ${periods}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
