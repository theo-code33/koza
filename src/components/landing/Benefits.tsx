export default function Benefits() {
  const benefits = [
    {
      title: '50% — Essentiels',
      desc: 'Logement, alimentation, transports, santé. La fondation qui ne change pas.',
      color: 'bg-[var(--color-essential-bg)] text-[var(--color-essential)]',
      icon: '🏠',
    },
    {
      title: '30% — Loisirs',
      desc: 'Restaurants, sorties, vacances, culture. La joie et les expériences.',
      color: 'bg-[var(--color-leisure-bg)] text-[var(--color-leisure)]',
      icon: '🎉',
    },
    {
      title: '20% — Épargne',
      desc: 'Fonds d\'urgence, investissements, projets à long terme. Votre futur.',
      color: 'bg-[var(--color-savings-bg)] text-[var(--color-savings)]',
      icon: '💰',
    },
  ];

  return (
    <section id="benefits" className="py-24 bg-[var(--color-surface-alt)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">
            La règle 50/30/20 expliquée
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Un cadre simple et prouvé pour une vie financière équilibrée.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="space-y-4">
              <div className={`h-16 w-16 rounded-[var(--radius-card)] flex items-center justify-center text-3xl ${benefit.color}`}>
                {benefit.icon}
              </div>
              <h3 className="text-2xl font-semibold">{benefit.title}</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] p-8 shadow-card">
          <h3 className="text-xl font-semibold mb-4">Pourquoi cette règle marche ?</h3>
          <ul className="space-y-3 text-[var(--color-text-secondary)]">
            <li className="flex gap-3">
              <span className="text-[var(--color-accent)] font-bold">✓</span>
              <span>Elle est <strong>facile à mémoriser et à mettre en place</strong> — pas de calcul complexe.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent)] font-bold">✓</span>
              <span>Elle <strong>équilibre plaisir et sécurité</strong> — vous ne vous privez pas, vous investissez.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent)] font-bold">✓</span>
              <span>Elle <strong>s\'adapte à tous les revenus</strong> — l\'important c\'est la proportion, pas le chiffre absolu.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
