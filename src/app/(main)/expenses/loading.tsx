import { Skeleton } from "@/components/ui";

// Squelette de la page Dépenses pendant le chargement (liste du mois courant).
export default function ExpensesLoading() {
  return (
    <main className="mx-auto flex max-w-[720px] flex-col px-6 py-12">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-64" />
      <Skeleton className="mt-4 h-4 w-40" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[16px]" />
        ))}
      </div>
    </main>
  );
}
