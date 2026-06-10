import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { LocaleToggle } from "@/components/settings/locale-toggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-10 px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">{t("title")}</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          {t("appearance")}
        </h2>
        <div className="card flex items-center justify-between p-5">
          <span className="text-[15px] text-text">{t("darkTheme")}</span>
          <ThemeToggle />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          {t("language")}
        </h2>
        <div className="card flex items-center justify-between p-5">
          <span className="text-[15px] text-text">{t("language")}</span>
          <LocaleToggle />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          {t("incomes")}
        </h2>
        <Link href="/incomes" className="text-[14px] font-medium text-accent">
          {t("manageIncomes")}
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          {t("data")}
        </h2>
        <a href="/api/export" download className="text-[14px] font-medium text-accent">
          {t("exportData")}
        </a>
      </section>
    </main>
  );
}
