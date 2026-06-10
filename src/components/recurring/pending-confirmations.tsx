"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { SoftBanner } from "@/components/ui/soft-banner";
import { Button } from "@/components/ui/button";

export interface PendingItem {
  id: string;
  label: string;
  estimate: string;
}

export function PendingConfirmations({ items }: { items: PendingItem[] }) {
  const router = useRouter();
  const t = useTranslations("recurring");
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  if (items.length === 0) return null;

  async function confirm(item: PendingItem) {
    const amount = amounts[item.id] ?? "";
    const res = await fetch(`/api/recurring/occurrences/${item.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <SoftBanner icon={BellRing} tone="accent">
        {t("pendingBanner")}
      </SoftBanner>
      {items.map((item) => (
        <div key={item.id} className="card flex items-center gap-3 p-4">
          <span className="flex-1 text-[15px] text-text">{item.label}</span>
          <input
            inputMode="decimal"
            aria-label={t("realAmountAria", { label: item.label })}
            placeholder={item.estimate}
            value={amounts[item.id] ?? ""}
            onChange={(e) => setAmounts((a) => ({ ...a, [item.id]: e.target.value }))}
            className="h-10 w-28 rounded-input bg-surface-alt px-3 text-[15px] text-text outline-none"
          />
          <Button onClick={() => confirm(item)}>{t("confirmButton", { label: item.label })}</Button>
        </div>
      ))}
    </div>
  );
}
