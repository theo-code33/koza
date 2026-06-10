import { useTranslations } from "next-intl";
import { SUBCATEGORIES } from "@/lib/subcategories";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/cn";

interface SubcatChipsProps {
  category: CategoryKey;
  value: string;
  onChange: (key: string) => void;
}

export function SubcatChips({ category, value, onChange }: SubcatChipsProps) {
  const t = useTranslations("subcategories");
  return (
    <div className="flex flex-wrap gap-2">
      {SUBCATEGORIES[category].map((sub) => {
        const active = sub.key === value;
        return (
          <button
            key={sub.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(sub.key)}
            className={cn(
              "tap rounded-pill px-3 py-1.5 text-[13px] font-medium transition",
              active
                ? cn(CATEGORIES[category].bgClass, CATEGORIES[category].textClass)
                : "bg-surface-alt text-text-secondary",
            )}
          >
            {t(sub.key)}
          </button>
        );
      })}
    </div>
  );
}
