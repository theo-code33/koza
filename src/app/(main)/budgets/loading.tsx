import { Skeleton } from "@/components/ui";

// Squelette de la page Budgets pendant le chargement (cartes avec progression).
export default function BudgetsLoading() {
  return (
    <main className="mx-auto flex max-w-[720px] flex-col px-6 py-12">
      <Skeleton className="h-8 w-40" />
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[16px]" />
        ))}
      </div>
    </main>
  );
}
