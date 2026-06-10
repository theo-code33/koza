import { useLocale, useTranslations } from "next-intl";
import { CatDot } from "@/components/ui/cat-dot";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatEUR } from "@/lib/formatters";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

interface CategoryProgressCardProps {
  category: CategoryKey;
  spent: string;
  target: string;
}

export function CategoryProgressCard({ category, spent, target }: CategoryProgressCardProps) {
  const t = useTranslations("categories");
  const locale = useLocale() as "fr" | "en";
  const config = CATEGORIES[category];
  const over = Number(spent) > Number(target);

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CatDot category={category} />
          <span className="text-[15px] font-medium text-text">{t(category)}</span>
        </div>
        <span className={`num text-[13px] ${over ? "text-over" : "text-text-secondary"}`}>
          {formatEUR(spent, locale)} / {formatEUR(target, locale)}
        </span>
      </div>
      <ProgressBar value={Number(spent)} max={Number(target)} fillClass={config.dotClass} />
    </div>
  );
}
