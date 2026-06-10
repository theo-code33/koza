import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-line)]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-12 mb-8">
          <div>
            <p className="text-2xl font-serif font-semibold mb-2">kōza</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Gestion de budget zen basée sur la règle 50/30/20.
            </p>
          </div>

          <div>
            <p className="font-semibold text-sm uppercase mb-4 text-[var(--color-muted)]">Produit</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <a href="#features" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#faq" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-sm uppercase mb-4 text-[var(--color-muted)]">Legal</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/terms" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  Conditions d&apos;utilisation
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  Politique de confidentialité
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-sm uppercase mb-4 text-[var(--color-muted)]">Contact</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:hello@koza.app" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  hello@koza.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--color-line)] pt-8">
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} kōza. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
