import { Skeleton } from "@/components/ui";

// Squelette de la page Dépenses récurrentes pendant le chargement (liste des modèles).
export default function RecurringLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <Skeleton className="h-8 w-56" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[16px]" />
        ))}
      </div>
    </main>
  );
}
