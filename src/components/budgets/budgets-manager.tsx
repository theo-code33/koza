"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetCard, type BudgetCardData } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";

interface BudgetsManagerProps {
  budgets: BudgetCardData[];
}

type OverlayState = { mode: "add" } | { mode: "edit"; budget: BudgetCardData } | null;

export function BudgetsManager({ budgets }: BudgetsManagerProps) {
  const t = useTranslations("budgets");
  const tc = useTranslations("common");
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleting, setDeleting] = useState<BudgetCardData | null>(null);
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
      const res = await fetch(`/api/budgets/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      refresh();
    } catch {
      setActionError(tc("deleteError"));
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {budgets.length === 0 ? (
        <p className="text-[15px] text-text-secondary">{t("empty")}</p>
      ) : (
        budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={() => setOverlay({ mode: "edit", budget })}
            onDelete={() => setDeleting(budget)}
          />
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      <button
        type="button"
        onClick={() => setOverlay({ mode: "add" })}
        className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> {t("add")}
      </button>

      {overlay ? (
        <Overlay mode="sheet" onClose={() => setOverlay(null)}>
          <BudgetForm
            budget={overlay.mode === "edit" ? overlay.budget : undefined}
            onSuccess={refresh}
            onCancel={() => setOverlay(null)}
          />
        </Overlay>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title={t("deleteTitle")}
          message={t("deleteMessage", { name: deleting.name })}
          confirmLabel={tc("delete")}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
