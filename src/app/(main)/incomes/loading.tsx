import { Skeleton } from "@/components/ui";

// Squelette de la page Revenus pendant le chargement (liste des sources).
export default function IncomesLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <Skeleton className="h-8 w-40" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[16px]" />
        ))}
      </div>
    </main>
  );
}
