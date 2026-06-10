import Link from "next/link";

export default function CTAFinal() {
  return (
    <section className="py-24 bg-[var(--color-surface-alt)]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
          Prêt à reprendre le contrôle ?
        </h2>

        <p className="text-xl text-[var(--color-text-secondary)] mb-10 leading-relaxed">
          Rejoignez ceux qui ont transformé leur relation à l&apos;argent. L&apos;onboarding dure 3
          minutes.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/onboarding"
            className="px-10 py-4 bg-[var(--color-accent)] text-white rounded-[var(--radius-button)] font-semibold shadow-hover hover:shadow-card transition-shadow"
          >
            Commencer maintenant
          </Link>
          <Link
            href="/dashboard"
            className="px-10 py-4 border border-[var(--color-line)] rounded-[var(--radius-button)] font-semibold hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Voir la démo
          </Link>
        </div>

        <p className="text-sm text-[var(--color-muted)] mt-8">
          💳 Gratuit, sans engagement, pas de carte bancaire requise.
        </p>
      </div>
    </section>
  );
}
