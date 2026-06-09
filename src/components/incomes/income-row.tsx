import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { formatEUR } from "@/lib/formatters";

export interface IncomeRowData {
  id: string;
  source: string;
  amount: string;
  month: string;
}

interface IncomeRowProps {
  income: IncomeRowData;
  onEdit: () => void;
  onDelete: () => void;
}

export function IncomeRow({ income, onEdit, onDelete }: IncomeRowProps) {
  return (
    <div className="card flex items-center justify-between p-4">
      <div>
        <div className="text-[15px] font-medium text-text">{income.source}</div>
        <div className="num text-[13px] text-text-secondary">{formatEUR(income.amount)}</div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton icon={Pencil} label="Modifier le revenu" onClick={onEdit} />
        <IconButton icon={Trash2} label="Supprimer le revenu" onClick={onDelete} />
      </div>
    </div>
  );
}
