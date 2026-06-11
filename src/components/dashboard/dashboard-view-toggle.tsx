import Link from "next/link";
import { useTranslations } from "next-intl";

interface DashboardViewToggleProps {
  view: "month" | "year";
}

const PILL = "rounded-pill px-4 py-1.5 text-[13px] transition-colors";

export function DashboardViewToggle({ view }: DashboardViewToggleProps) {
  const t = useTranslations("dashboard");
  return (
    <div className="mx-auto flex w-fit gap-1 rounded-pill bg-surface-alt p-1">
      <Link
        href="/dashboard"
        aria-current={view === "month" ? "page" : undefined}
        className={`${PILL} ${view === "month" ? "bg-accent-soft text-accent" : "text-text-secondary"}`}
      >
        {t("viewMonth")}
      </Link>
      <Link
        href="/dashboard?view=year"
        aria-current={view === "year" ? "page" : undefined}
        className={`${PILL} ${view === "year" ? "bg-accent-soft text-accent" : "text-text-secondary"}`}
      >
        {t("viewYear")}
      </Link>
    </div>
  );
}
