"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpenseRow, type ExpenseRowData } from "@/components/expenses/expense-row";
import { ExpenseQuickForm, type BudgetOption } from "@/components/expenses/expense-quick-form";

interface ExpensesManagerProps {
  expenses: ExpenseRowData[];
  budgets?: BudgetOption[];
}

type OverlayState = { mode: "add" } | { mode: "edit"; expense: ExpenseRowData } | null;

export function ExpensesManager({ expenses, budgets = [] }: ExpensesManagerProps) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleting, setDeleting] = useState<ExpenseRowData | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    setOverlay(null);
    setDeleting(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/expenses/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      refresh();
    } catch {
      setActionError("Suppression impossible. Réessaie dans un instant.");
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {expenses.length === 0 ? (
        <p className="text-[15px] text-text-secondary">
          Aucune dépense ce mois. Ajoute ta première dépense.
        </p>
      ) : (
        expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            onEdit={() => setOverlay({ mode: "edit", expense })}
            onDelete={() => setDeleting(expense)}
          />
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      <button
        type="button"
        onClick={() => setOverlay({ mode: "add" })}
        className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> Ajouter une dépense
      </button>

      {overlay ? (
        <Overlay mode="sheet" onClose={() => setOverlay(null)}>
          <ExpenseQuickForm
            expense={overlay.mode === "edit" ? overlay.expense : undefined}
            budgets={budgets}
            onSuccess={refresh}
            onCancel={() => setOverlay(null)}
          />
        </Overlay>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer cette dépense ?"
          message={`« ${deleting.description} » sera retirée de ce mois.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
