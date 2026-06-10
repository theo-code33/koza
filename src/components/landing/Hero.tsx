import Link from "next/link";

export default function Hero() {
  return (
    <header className="bg-[var(--color-surface-alt)]">
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-sm bg-[var(--color-accent-soft)] text-[var(--color-accent)]">kōza</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-semibold mb-4">La paix dans votre budget</h1>
        <p className="text-[var(--color-text-secondary)] text-lg mb-8">Suivez vos revenus et dépenses, répartissez automatiquement selon la règle 50/30/20 et progressez sereinement vers vos objectifs.</p>

        <div className="flex justify-center gap-4">
          <Link href="/onboarding" className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg shadow-hover">Commencer</Link>
          <Link href="/dashboard" className="border border-[var(--color-line)] px-6 py-3 rounded-lg">Voir le tableau de bord</Link>
        </div>
      </div>
    </header>
  );
}
