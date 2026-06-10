import Link from "next/link";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-10 px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Réglages</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Apparence
        </h2>
        <div className="card flex items-center justify-between p-5">
          <span className="text-[15px] text-text">Thème sombre</span>
          <ThemeToggle />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Langue
        </h2>
        <div className="card flex items-center justify-between p-5">
          <span className="text-[15px] text-text">Français</span>
          <span className="text-[13px] text-muted">English — bientôt</span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Revenus
        </h2>
        <Link href="/incomes" className="text-[14px] font-medium text-accent">
          Gérer mes revenus
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Données
        </h2>
        <a href="/api/export" download className="text-[14px] font-medium text-accent">
          Exporter mes données (JSON)
        </a>
      </section>
    </main>
  );
}
