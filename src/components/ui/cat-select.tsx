import { useTranslations } from "next-intl";
import { CATEGORIES, CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/cn";

interface CatSelectProps {
  value: CategoryKey;
  onChange: (value: CategoryKey) => void;
}

export function CatSelect({ value, onChange }: CatSelectProps) {
  const t = useTranslations("categories");
  return (
    <div className="grid grid-cols-3 gap-2">
      {CATEGORY_ORDER.map((key) => {
        const category = CATEGORIES[key];
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={cn(
              "tap h-11 rounded-input text-[14px] font-medium transition",
              active
                ? cn(category.bgClass, category.textClass, "ring-[1.5px] ring-inset")
                : "bg-surface-alt text-text-secondary",
            )}
          >
            {t(key)}
          </button>
        );
      })}
    </div>
  );
}
