"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function FAQ() {
  const t = useTranslations("landing.faq");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = t.raw("items") as { q: string; a: string }[];

  return (
    <section id="faq" className="py-24 bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">{t("title")}</h2>
          <p className="text-lg text-[var(--color-text-secondary)]">{t("subtitle")}</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <button
              key={idx}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full text-left p-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-card hover:shadow-hover transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-semibold text-lg flex-1">{faq.q}</h3>
                <span className="text-[var(--color-accent)] text-xl flex-shrink-0">
                  {openIdx === idx ? "−" : "+"}
                </span>
              </div>

              {openIdx === idx && (
                <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed text-base">
                  {faq.a}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
