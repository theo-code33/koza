import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HeroEnhanced() {
  const t = useTranslations("landing.hero");
  return (
    <section className="bg-gradient-to-b from-[var(--color-surface-alt)] to-[var(--color-bg)] pt-20 pb-24 md:pt-32 md:pb-40">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="mb-6 inline-block px-4 py-2 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-sm font-medium">
          {t("badge")}
        </div>

        <h1 className="text-5xl md:text-6xl font-serif font-semibold mb-6 leading-tight">
          {t("title")}
        </h1>

        <p className="text-xl text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-2xl mx-auto">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link
            href="/onboarding"
            className="px-8 py-4 bg-[var(--color-accent)] text-white rounded-[var(--radius-button)] font-medium shadow-hover hover:shadow-card transition-shadow"
          >
            {t("ctaStart")}
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 border border-[var(--color-line)] rounded-[var(--radius-button)] font-medium hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            {t("ctaDemo")}
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="pt-8 border-t border-[var(--color-line)]">
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">{t("trustIntro")}</p>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-semibold text-[var(--color-essential)]">
                {t("stat1Value")}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">{t("stat1Label")}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-leisure)]">
                {t("stat2Value")}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">{t("stat2Label")}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-savings)]">
                {t("stat3Value")}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">{t("stat3Label")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
