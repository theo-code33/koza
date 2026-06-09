import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/cn";

interface CatDotProps {
  category: CategoryKey;
  size?: number;
}

export function CatDot({ category, size = 8 }: CatDotProps) {
  return (
    <span
      data-testid="cat-dot"
      className={cn("inline-block rounded-full", CATEGORIES[category].dotClass)}
      style={{ width: size, height: size }}
    />
  );
}
