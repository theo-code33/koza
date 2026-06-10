"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { CatDot } from "@/components/ui/cat-dot";
import { IconButton } from "@/components/ui/icon-button";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RecurringForm, type RecurringModel } from "@/components/recurring/recurring-form";
import { formatEUR } from "@/lib/formatters";

const FREQUENCY_LABEL: Record<RecurringModel["frequency"], string> = {
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
};

interface RecurringManagerProps {
  models: RecurringModel[];
}

type OverlayState = { mode: "add" } | { mode: "edit"; model: RecurringModel } | null;

export function RecurringManager({ models }: RecurringManagerProps) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleting, setDeleting] = useState<RecurringModel | null>(null);
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
      const res = await fetch(`/api/recurring/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      refresh();
    } catch {
      setActionError("Suppression impossible. Réessaie dans un instant.");
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {models.length === 0 ? (
        <p className="text-[15px] text-text-secondary">
          Aucune dépense récurrente. Ajoute tes charges fixes ou variables.
        </p>
      ) : (
        models.map((model) => (
          <div key={model.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CatDot category={model.category} />
              <div>
                <div className="text-[15px] font-medium text-text">{model.label}</div>
                <div className="text-[13px] text-text-secondary">
                  {FREQUENCY_LABEL[model.frequency]}
                  {model.type === "VARIABLE" ? " · variable" : ""}
                  {model.active ? "" : " · en pause"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="num mr-1 text-[15px] text-text">{formatEUR(model.amount)}</span>
              <IconButton
                icon={Pencil}
                label="Modifier la récurrente"
                onClick={() => setOverlay({ mode: "edit", model })}
              />
              <IconButton
                icon={Trash2}
                label="Supprimer la récurrente"
                onClick={() => setDeleting(model)}
              />
            </div>
          </div>
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      <button
        type="button"
        onClick={() => setOverlay({ mode: "add" })}
        className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> Ajouter une récurrente
      </button>

      {overlay ? (
        <Overlay mode="sheet" onClose={() => setOverlay(null)}>
          <RecurringForm
            model={overlay.mode === "edit" ? overlay.model : undefined}
            onSuccess={refresh}
            onCancel={() => setOverlay(null)}
          />
        </Overlay>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer cette récurrente ?"
          message={`« ${deleting.label} » ne générera plus de dépenses. Les dépenses passées sont conservées.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
