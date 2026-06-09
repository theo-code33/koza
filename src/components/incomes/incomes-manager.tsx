"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IncomeRow, type IncomeRowData } from "@/components/incomes/income-row";
import { IncomeForm } from "@/components/incomes/income-form";

interface IncomesManagerProps {
  incomes: IncomeRowData[];
  month: string;
}

type OverlayState = { mode: "add" } | { mode: "edit"; income: IncomeRowData } | null;

export function IncomesManager({ incomes, month }: IncomesManagerProps) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleting, setDeleting] = useState<IncomeRowData | null>(null);
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
      const res = await fetch(`/api/incomes/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      refresh();
    } catch {
      setActionError("Suppression impossible. Réessaie dans un instant.");
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {incomes.length === 0 ? (
        <p className="text-[15px] text-text-secondary">
          Aucun revenu pour ce mois. Ajoute ta première source pour voir tes enveloppes.
        </p>
      ) : (
        incomes.map((income) => (
          <IncomeRow
            key={income.id}
            income={income}
            onEdit={() => setOverlay({ mode: "edit", income })}
            onDelete={() => setDeleting(income)}
          />
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      <button
        type="button"
        onClick={() => setOverlay({ mode: "add" })}
        className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> Ajouter un revenu
      </button>

      {overlay ? (
        <Overlay mode="sheet" onClose={() => setOverlay(null)}>
          <IncomeForm
            month={month}
            income={overlay.mode === "edit" ? overlay.income : undefined}
            onSuccess={refresh}
            onCancel={() => setOverlay(null)}
          />
        </Overlay>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer ce revenu ?"
          message={`« ${deleting.source} » sera retiré de ce mois.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
