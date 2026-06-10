"use client";

import { useState } from "react";

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    {
      q: "Kōza coûte combien ?",
      a: "Kōza est 100% gratuit. Pas d'abonnement, pas de limite, pas de publicité. C'est cadeau.",
    },
    {
      q: "Mes données sont-elles sécurisées ?",
      a: "Oui. Vos données sont stockées dans une base PostgreSQL chiffrée. Pas d'intégration bancaire, pas de tiers. Juste vous et vos données.",
    },
    {
      q: "Puis-je ajouter d'autres sources de revenu ?",
      a: "Absolument. Vous pouvez déclarer un salaire principal, un freelance, des dividendes — tout ce que vous voulez. Les enveloppes se recalculent automatiquement.",
    },
    {
      q: "Que se passe-t-il si je dépasse mon budget ?",
      a: "Rien. Pas de culpabilité, pas d'alarme rouge. Kōza vous notifie gentiment et reporte le surplus sur le mois suivant. C'est une aide, pas un jugement.",
    },
    {
      q: "Puis-je consulter les mois passés ?",
      a: "Oui. Vous pouvez naviguer librement dans votre historique pour voir vos tendances, comparer les mois et apprendre de vos habitudes.",
    },
    {
      q: "Puis-je exporter mes données ?",
      a: "Bien sûr. Un clic et vous avez un JSON de toutes vos données. C'est vos données, vous les gardez.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Tout ce que vous vouliez savoir sans crainte.
          </p>
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
