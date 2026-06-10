"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PiggyBank, TrendingUp, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SoftBanner } from "@/components/ui/soft-banner";
import { formatEUR } from "@/lib/formatters";
import type { Notification } from "@/lib/notifications";

const ICONS: Record<Notification["kind"], LucideIcon> = {
  savingsGoalNear: PiggyBank,
  budgetWarning: TrendingUp,
  budgetOver: Info,
  categoryOver: Info,
};

export function NotificationList({ items }: { items: Notification[] }) {
  const t = useTranslations("notifications");
  const tc = useTranslations("categories");
  const locale = useLocale() as "fr" | "en";

  if (items.length === 0) return null;

  function message(n: Notification): ReactNode {
    switch (n.kind) {
      case "savingsGoalNear":
        return n.values.reached
          ? t("savingsGoalReached", { name: String(n.values.name) })
          : t("savingsGoalNear", {
              name: String(n.values.name),
              amount: formatEUR(String(n.values.remaining), locale),
            });
      case "budgetWarning":
        return t("budgetWarning", {
          name: String(n.values.name),
          percent: Number(n.values.percent),
        });
      case "budgetOver":
        return t("budgetOver", { name: String(n.values.name) });
      case "categoryOver":
        return t("categoryOver", { category: tc(String(n.values.category)) });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((n) => (
        <SoftBanner key={n.id} icon={ICONS[n.kind]} tone={n.tone}>
          {message(n)}
        </SoftBanner>
      ))}
    </div>
  );
}
