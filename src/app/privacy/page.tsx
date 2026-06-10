import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

export const metadata = {
  title: "Politique de confidentialité - kōza",
  description: "Politique de confidentialité de l'application kōza",
};

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-12">
            Politique de confidentialité
          </h1>

          <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-8">
            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                1. Introduction
              </h2>
              <p>
                kōza respecte votre vie privée. Cette politique de confidentialité explique comment
                nous collectons, utilisons et protégeons vos données personnelles lorsque vous
                utilisez notre application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                2. Données que nous collectons
              </h2>
              <p>Nous collectons les types de données suivants :</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>
                  <strong>Données de budget :</strong> revenus, dépenses, catégories, budgets
                  personnalisés que vous entrez
                </li>
                <li>
                  <strong>Données de préférence :</strong> thème (clair/sombre), langue, paramètres
                  utilisateur
                </li>
                <li>
                  <strong>Données d&apos;accès :</strong> adresse IP, type de navigateur, pages
                  visitées (via logs serveur anonymisés)
                </li>
              </ul>
              <p className="mt-4">
                Nous ne collectons <strong>pas</strong> : email, numéro de téléphone, informations
                bancaires directes (nous ne nous intégrons pas aux banques).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                3. Comment nous utilisons vos données
              </h2>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>Fournir le service (stocker et afficher vos budgets et dépenses)</li>
                <li>Améliorer l&apos;application (analyse d&apos;utilisation anonymisée)</li>
                <li>Vous envoyer des notifications d&apos;alerte importantes</li>
                <li>Maintenir la sécurité et la stabilité du service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                4. Partage de données
              </h2>
              <p>
                Vos données ne sont <strong>jamais</strong> partagées, vendues ou transférées à des
                tiers. Aucune publicité, aucun courtier de données, aucun profiling. C&apos;est
                simple : vos données vous appartiennent.
              </p>
              <p className="mt-4">
                Exception : nous pouvons être obligés de divulguer des données si la loi
                l&apos;exige (ordonnance judiciaire, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                5. Sécurité des données
              </h2>
              <p>Nous prenons la sécurité de vos données au sérieux. Vos données sont :</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>Stockées dans une base PostgreSQL chiffrée (Prisma Postgres)</li>
                <li>Protégées par HTTPS (chiffrement en transit)</li>
                <li>Soumises à une sauvegarde régulière</li>
                <li>Accessibles uniquement par votre navigateur (pas de cookies de tracking)</li>
              </ul>
              <p className="mt-4">
                Bien que nous ayons mis en place des mesures de sécurité raisonnables, aucun système
                n&apos;est 100% sûr. Nous ne pouvons pas garantir la sécurité absolue.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                6. Cookies et traceurs
              </h2>
              <p>
                kōza n&apos;utilise <strong>pas</strong> de cookies de tracking ou de publicité.
                Nous pouvons utiliser des cookies techniques minimaux pour mémoriser vos préférences
                (thème, langue) — uniquement sur votre appareil, jamais à travers d&apos;autres
                sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                7. Droits d&apos;accès et suppression
              </h2>
              <p>Vous avez le droit de :</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>Consulter toutes vos données via l&apos;export JSON</li>
                <li>Modifier ou supprimer vos données à tout moment dans l&apos;app</li>
                <li>Demander la suppression complète de votre compte</li>
              </ul>
              <p className="mt-4">
                Pour demander une suppression de compte, contactez :{" "}
                <a
                  href="mailto:hello@koza.app"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  hello@koza.app
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                8. Conservation des données
              </h2>
              <p>
                Vos données sont conservées aussi longtemps que vous utilisez kōza. Si vous
                supprimez votre compte, toutes les données associées seront effacées dans les 30
                jours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                9. Conformité RGPD
              </h2>
              <p>
                kōza est conforme au Règlement Général sur la Protection des Données (RGPD). Si vous
                êtes un utilisateur de l&apos;UE, vous avez le droit d&apos;accès, de rectification,
                de suppression et de portabilité de vos données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                10. Modifications de cette politique
              </h2>
              <p>
                Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Les
                changements importants seront communiqués via l&apos;application. Votre utilisation
                continue de kōza après une modification constitue votre acceptation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                11. Contact
              </h2>
              <p>
                Si vous avez des questions sur cette politique de confidentialité ou sur la façon
                dont nous traitons vos données, veuillez nous contacter à :{" "}
                <a
                  href="mailto:hello@koza.app"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  hello@koza.app
                </a>
              </p>
            </section>

            <section className="pt-8 border-t border-[var(--color-line)]">
              <p className="text-sm text-[var(--color-muted)]">
                Dernière mise à jour : 10 juin 2026
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
