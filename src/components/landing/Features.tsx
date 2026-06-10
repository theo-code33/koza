export default function Features() {
  const features = [
    {
      title: "Onboarding en 3 étapes",
      description:
        "Rentrez votre revenu et les enveloppes 50/30/20 se calculent automatiquement. Zéro configuration.",
      icon: "📋",
    },
    {
      title: "Ajout rapide de dépenses",
      description:
        "Enregistrez une dépense en moins de 10 secondes. Focus, montant, catégorie, c'est tout.",
      icon: "⚡",
    },
    {
      title: "Suivi visuel des budgets",
      description:
        "Des barres de progression zen qui vous montrent où vous en êtes, sans culpabilité.",
      icon: "📊",
    },
    {
      title: "Budgets personnalisés",
      description: "Créez des objectifs (vacances, épargne d'urgence) et suivez les en temps réel.",
      icon: "🎯",
    },
    {
      title: "Navigation mensuelle",
      description:
        "Explorez vos dépenses des mois passés. Historique complet, toujours accessible.",
      icon: "📅",
    },
    {
      title: "Thème clair/sombre",
      description: "L'app s'adapte à votre préférence. Lisez confortablement à tout moment.",
      icon: "🌙",
    },
  ];

  return (
    <section id="features" className="py-24 bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Une suite d&apos;outils simples et puissants, pensée pour la clarté mentale.
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
