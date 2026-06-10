import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { CatDot } from "@/components/ui/cat-dot";
import { IconButton } from "@/components/ui/icon-button";
import { formatEUR, formatDate } from "@/lib/formatters";
import type { CategoryKey } from "@/lib/categories";

export interface ExpenseRowData {
  id: string;
  amount: string;
  description: string;
  date: string;
  category: CategoryKey;
  subcategory: string;
  budgetId: string | null;
}

interface ExpenseRowProps {
  expense: ExpenseRowData;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  const t = useTranslations("subcategories");
  return (
    <div className="card flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <CatDot category={expense.category} />
        <div>
          <div className="text-[15px] font-medium text-text">{expense.description}</div>
          <div className="text-[13px] text-text-secondary">
            {t(expense.subcategory)} · {formatDate(expense.date)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="num mr-1 text-[15px] text-text">{formatEUR(expense.amount)}</span>
        {onEdit ? <IconButton icon={Pencil} label="Modifier la dépense" onClick={onEdit} /> : null}
        {onDelete ? (
          <IconButton icon={Trash2} label="Supprimer la dépense" onClick={onDelete} />
        ) : null}
      </div>
    </div>
  );
}
