import Link from "next/link";

export default function HeroEnhanced() {
  return (
    <section className="bg-gradient-to-b from-[var(--color-surface-alt)] to-[var(--color-bg)] pt-20 pb-24 md:pt-32 md:pb-40">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="mb-6 inline-block px-4 py-2 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-sm font-medium">
          ✨ La paix fiscale, enfin
        </div>

        <h1 className="text-5xl md:text-6xl font-serif font-semibold mb-6 leading-tight">
          Reprendre le contrôle de votre budget
        </h1>

        <p className="text-xl text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-2xl mx-auto">
          Suivez vos revenus et dépenses sans stress. La règle 50/30/20 vous guide automatiquement
          vers une gestion sereine et durable de votre argent.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link
            href="/onboarding"
            className="px-8 py-4 bg-[var(--color-accent)] text-white rounded-[var(--radius-button)] font-medium shadow-hover hover:shadow-card transition-shadow"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 border border-[var(--color-line)] rounded-[var(--radius-button)] font-medium hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Voir la démo
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="pt-8 border-t border-[var(--color-line)]">
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Rejoignez ceux qui ont retrouvé la sérénité financière
          </p>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-semibold text-[var(--color-essential)]">100%</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">Gratuit & sans pub</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-leisure)]">3 min</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Mise en place rapide
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-savings)]">0 tracas</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Pas d&apos;intégration bancaire
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
