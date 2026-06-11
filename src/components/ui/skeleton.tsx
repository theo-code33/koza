import { cn } from "@/lib/cn";

// Bloc de chargement neutre : pulsation douce sur surface-alt, désactivée si
// l'utilisateur réduit les animations. Purement décoratif (aria-hidden).
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[10px] bg-surface-alt motion-reduce:animate-none",
        className,
      )}
    />
  );
}
