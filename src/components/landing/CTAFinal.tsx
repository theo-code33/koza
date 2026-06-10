import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CTAFinal() {
  const t = useTranslations("landing.cta");
  return (
    <section className="py-24 bg-[var(--color-surface-alt)]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6">{t("title")}</h2>

        <p className="text-xl text-[var(--color-text-secondary)] mb-10 leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/onboarding"
            className="px-10 py-4 bg-[var(--color-accent)] text-white rounded-[var(--radius-button)] font-semibold shadow-hover hover:shadow-card transition-shadow"
          >
            {t("ctaNow")}
          </Link>
          <Link
            href="/dashboard"
            className="px-10 py-4 border border-[var(--color-line)] rounded-[var(--radius-button)] font-semibold hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            {t("ctaDemo")}
          </Link>
        </div>

        <p className="text-sm text-[var(--color-muted)] mt-8">{t("note")}</p>
      </div>
    </section>
  );
}
