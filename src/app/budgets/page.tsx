import { BudgetsManager } from "@/components/budgets/budgets-manager";
import { listBudgetsWithSpent } from "@/lib/budgets";
import type { CategoryKey } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const budgets = await listBudgetsWithSpent();
  const rows = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    targetAmount: budget.targetAmount.toString(),
    spent: budget.spent.toString(),
    category: budget.category as CategoryKey,
    deadline: budget.deadline ? budget.deadline.toISOString().slice(0, 10) : null,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes budgets</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        Tes objectifs d&apos;épargne et de dépense.
      </p>
      <div className="mt-8">
        <BudgetsManager budgets={rows} />
      </div>
    </main>
  );
}
