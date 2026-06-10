import { useLocale } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { CatDot } from "@/components/ui/cat-dot";
import { IconButton } from "@/components/ui/icon-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatEUR, formatDate } from "@/lib/formatters";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

export interface BudgetCardData {
  id: string;
  name: string;
  targetAmount: string;
  spent: string;
  category: CategoryKey;
  deadline: string | null;
}

interface BudgetCardProps {
  budget: BudgetCardData;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const locale = useLocale() as "fr" | "en";
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CatDot category={budget.category} />
          <span className="text-[15px] font-medium text-text">{budget.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton icon={Pencil} label="Modifier le budget" onClick={onEdit} />
          <IconButton icon={Trash2} label="Supprimer le budget" onClick={onDelete} />
        </div>
      </div>
      <ProgressBar
        value={Number(budget.spent)}
        max={Number(budget.targetAmount)}
        fillClass={CATEGORIES[budget.category].dotClass}
      />
      <div className="flex items-center justify-between text-[13px] text-text-secondary">
        <span className="num">
          {formatEUR(budget.spent, locale)} sur {formatEUR(budget.targetAmount, locale)}
        </span>
        {budget.deadline ? <span>Échéance {formatDate(budget.deadline, locale)}</span> : null}
      </div>
    </div>
  );
}
