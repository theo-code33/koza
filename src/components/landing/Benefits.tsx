import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export default function Benefits() {
  const t = useTranslations("landing.benefits");
  const benefits = t.raw("items") as { title: string; desc: string; color: string; icon: string }[];
  const bold = { b: (chunks: ReactNode) => <strong>{chunks}</strong> };

  return (
    <section id="benefits" className="py-24 bg-[var(--color-surface-alt)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">{t("title")}</h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="space-y-4">
              <div
                className={`h-16 w-16 rounded-[var(--radius-card)] flex items-center justify-center text-3xl ${benefit.color}`}
              >
                {benefit.icon}
              </div>
              <h3 className="text-2xl font-semibold">{benefit.title}</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] p-8 shadow-card">
          <h3 className="text-xl font-semibold mb-4">{t("boxTitle")}</h3>
          <ul className="space-y-3 text-[var(--color-text-secondary)]">
            <li className="flex gap-3">
              <span className="text-[var(--color-accent)] font-bold">✓</span>
              <span>{t.rich("list1", bold)}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent)] font-bold">✓</span>
              <span>{t.rich("list2", bold)}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent)] font-bold">✓</span>
              <span>{t.rich("list3", bold)}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
