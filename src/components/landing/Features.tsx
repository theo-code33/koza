import { useTranslations } from "next-intl";

export default function Features() {
  const t = useTranslations("landing.features");
  const features = t.raw("items") as { title: string; description: string; icon: string }[];

  return (
    <section id="features" className="py-24 bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">{t("title")}</h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-card hover:shadow-hover transition-shadow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
