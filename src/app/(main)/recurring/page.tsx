import { prisma } from "@/lib/prisma";
import { RecurringManager } from "@/components/recurring/recurring-manager";
import type { RecurringModel } from "@/components/recurring/recurring-form";
import type { CategoryKey } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const models = await prisma.recurringExpense.findMany({ orderBy: { createdAt: "asc" } });
  const rows: RecurringModel[] = models.map((model) => ({
    id: model.id,
    label: model.label,
    type: model.type,
    amount: model.amount.toString(),
    category: model.category as CategoryKey,
    subcategory: model.subcategory,
    frequency: model.frequency,
    anchorMonth: model.anchorMonth,
    endMonth: model.endMonth,
    active: model.active,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Dépenses récurrentes</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        Tes charges qui reviennent chaque mois, trimestre ou année.
      </p>
      <div className="mt-8">
        <RecurringManager models={rows} />
      </div>
    </main>
  );
}
