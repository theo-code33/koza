import { Prisma } from "@/generated/prisma/client";
import type { MonthlySummary } from "@/lib/dashboard";
import type { BudgetWithSpent } from "@/lib/budgets";

export type NotificationTone = "accent" | "warning" | "over";
export type NotificationKind = "savingsGoalNear" | "budgetWarning" | "budgetOver" | "categoryOver";

export interface Notification {
  id: string;
  kind: NotificationKind;
  tone: NotificationTone;
  values: Record<string, string | number | boolean>;
}

// Progression mise en avant, dépassements discrets (CLAUDE.md).
const ORDER: NotificationKind[] = [
  "savingsGoalNear",
  "budgetWarning",
  "categoryOver",
  "budgetOver",
];

// Alertes dérivées du mois courant (catégories vs objectifs 50/30/20 + budgets).
export function deriveNotifications(
  summary: MonthlySummary,
  budgets: BudgetWithSpent[],
): Notification[] {
  const out: Notification[] = [];

  for (const cat of summary.categories) {
    if (cat.target.gt(0) && cat.spent.gt(cat.target)) {
      out.push({
        id: `category-${cat.category}`,
        kind: "categoryOver",
        tone: "over",
        values: { category: cat.category },
      });
    }
  }

  for (const b of budgets) {
    if (b.targetAmount.lte(0)) continue;
    const percent = b.spent.div(b.targetAmount).times(100).toNumber();

    if (b.category === "savings") {
      if (percent >= 90) {
        const diff = b.targetAmount.minus(b.spent);
        const remaining = diff.lt(0) ? new Prisma.Decimal(0) : diff;
        out.push({
          id: `budget-${b.id}`,
          kind: "savingsGoalNear",
          tone: "accent",
          values: { name: b.name, remaining: remaining.toString(), reached: percent >= 100 },
        });
      }
    } else if (percent >= 100) {
      out.push({
        id: `budget-${b.id}`,
        kind: "budgetOver",
        tone: "over",
        values: { name: b.name },
      });
    } else if (percent >= 80) {
      out.push({
        id: `budget-${b.id}`,
        kind: "budgetWarning",
        tone: "warning",
        values: { name: b.name, percent: Math.round(percent) },
      });
    }
  }

  return out
    .map((n, i) => ({ n, i }))
    .sort((a, b) => ORDER.indexOf(a.n.kind) - ORDER.indexOf(b.n.kind) || a.i - b.i)
    .map(({ n }) => n);
}
