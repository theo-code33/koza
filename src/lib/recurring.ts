import { prisma } from "@/lib/prisma";
import { isTriggerMonth } from "@/lib/budget";

// Premier jour du mois "YYYY-MM" (date locale).
function firstOfMonth(month: string): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
}

// Matérialise les échéances récurrentes du mois M : FIXED → Expense + occurrence APPLIED ;
// VARIABLE → occurrence PENDING (à confirmer). Idempotent grâce à la garde @@unique.
export async function materializeRecurring(month: string): Promise<void> {
  const models = await prisma.recurringExpense.findMany({ where: { active: true } });

  for (const model of models) {
    if (model.anchorMonth > month) continue;
    if (model.endMonth && month > model.endMonth) continue;
    if (!isTriggerMonth(model, month)) continue;

    const existing = await prisma.recurringOccurrence.findUnique({
      where: { recurringId_month: { recurringId: model.id, month } },
    });
    if (existing) continue;

    if (model.type === "FIXED") {
      const expense = await prisma.expense.create({
        data: {
          amount: model.amount,
          description: model.label,
          date: firstOfMonth(month),
          month,
          category: model.category,
          subcategory: model.subcategory,
          recurringId: model.id,
        },
      });
      await prisma.recurringOccurrence.create({
        data: { recurringId: model.id, month, status: "APPLIED", expenseId: expense.id },
      });
    } else {
      await prisma.recurringOccurrence.create({
        data: { recurringId: model.id, month, status: "PENDING" },
      });
    }
  }
}
