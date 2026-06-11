import { Skeleton } from "@/components/ui";

// Squelette affiché instantanément pendant la résolution du dashboard (rendu dynamique).
export default function DashboardLoading() {
  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-[16px]" />
      <div className="flex justify-center py-4">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-[16px]" />
        ))}
      </div>
    </main>
  );
}
