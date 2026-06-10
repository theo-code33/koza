"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpenseRow, type ExpenseRowData } from "@/components/expenses/expense-row";
import { ExpenseQuickForm, type BudgetOption } from "@/components/expenses/expense-quick-form";

interface ExpensesManagerProps {
  expenses: ExpenseRowData[];
  budgets?: BudgetOption[];
  readOnly?: boolean;
}

type OverlayState = { mode: "add" } | { mode: "edit"; expense: ExpenseRowData } | null;

export function ExpensesManager({
  expenses,
  budgets = [],
  readOnly = false,
}: ExpensesManagerProps) {
  const t = useTranslations("expenses");
  const tc = useTranslations("common");
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
      setActionError(tc("deleteError"));
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {expenses.length === 0 ? (
        <p className="text-[15px] text-text-secondary">{t("empty")}</p>
      ) : (
        expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            onEdit={readOnly ? undefined : () => setOverlay({ mode: "edit", expense })}
            onDelete={readOnly ? undefined : () => setDeleting(expense)}
          />
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      {readOnly ? (
        <p className="mt-2 text-[13px] text-muted">{t("closedReadOnly")}</p>
      ) : (
        <button
          type="button"
          onClick={() => setOverlay({ mode: "add" })}
          className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
        >
          <Plus size={16} strokeWidth={1.8} /> {t("add")}
        </button>
      )}

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
          title={t("deleteTitle")}
          message={t("deleteMessage", { description: deleting.description })}
          confirmLabel={tc("delete")}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
