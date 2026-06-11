import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface AnnualCategoryTotal {
  category: CategoryKey;
  spent: Prisma.Decimal;
}

export interface AnnualMonthlyPoint {
  month: string; // "YYYY-MM"
  essential: Prisma.Decimal;
  leisure: Prisma.Decimal;
  savings: Prisma.Decimal;
}

export interface AnnualSavingsPoint {
  month: string; // "YYYY-MM"
  cumulative: Prisma.Decimal;
}

export interface AnnualSummary {
  year: string;
  totals: AnnualCategoryTotal[];
  totalSpent: Prisma.Decimal;
  monthly: AnnualMonthlyPoint[];
  savingsCumulative: AnnualSavingsPoint[];
}

interface ExpenseRow {
  amount: Prisma.Decimal | string;
  category: string;
  month: string;
}

const ZERO = () => new Prisma.Decimal(0);

// Synthèse annuelle : totaux par catégorie, série mensuelle (12 points) et cumul d'épargne.
// Une seule requête (mois stockés "YYYY-MM" → filtre startsWith année), agrégation Decimal.
export async function getAnnualSummary(userId: string, year: string): Promise<AnnualSummary> {
  const expenses = (await prisma.expense.findMany({
    where: { userId, month: { startsWith: year } },
  })) as ExpenseRow[];

  const months = Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  );

  const byMonth = new Map<string, Record<CategoryKey, Prisma.Decimal>>(
    months.map((m) => [m, { essential: ZERO(), leisure: ZERO(), savings: ZERO() }]),
  );

  for (const row of expenses) {
    const bucket = byMonth.get(row.month);
    if (!bucket) continue;
    if (row.category === "essential" || row.category === "leisure" || row.category === "savings") {
      bucket[row.category] = bucket[row.category].plus(row.amount);
    }
  }

  const monthly: AnnualMonthlyPoint[] = months.map((month) => {
    const b = byMonth.get(month)!;
    return { month, essential: b.essential, leisure: b.leisure, savings: b.savings };
  });

  const totals: AnnualCategoryTotal[] = CATEGORY_ORDER.map((category) => ({
    category,
    spent: monthly.reduce((acc, p) => acc.plus(p[category]), ZERO()),
  }));

  const totalSpent = totals.reduce((acc, t) => acc.plus(t.spent), ZERO());

  let running = ZERO();
  const savingsCumulative: AnnualSavingsPoint[] = monthly.map((point) => {
    running = running.plus(point.savings);
    return { month: point.month, cumulative: running };
  });

  return { year, totals, totalSpent, monthly, savingsCumulative };
}
