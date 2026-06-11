import { Skeleton } from "@/components/ui";

// Squelette de la page Réglages pendant le chargement (groupes de paramètres).
export default function SettingsLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-10 px-6 py-12">
      <Skeleton className="h-8 w-36" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full rounded-[12px]" />
        </div>
      ))}
    </main>
  );
}
