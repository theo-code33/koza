import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

export const metadata = {
  title: "Conditions d'utilisation - kōza",
  description: "Conditions d'utilisation de l'application kōza",
};

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-12">
            Conditions d&apos;utilisation
          </h1>

          <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-8">
            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                1. Acceptation des conditions
              </h2>
              <p>
                En accédant et en utilisant kōza, vous acceptez de respecter les présentes
                conditions d&apos;utilisation et toutes les lois et réglementations applicables. Si
                vous n&apos;acceptez pas ces conditions, veuillez cesser d&apos;utiliser le service
                immédiatement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                2. Licence d&apos;utilisation
              </h2>
              <p>
                kōza vous accorde une licence limitée, non exclusive, révocable et non transférable
                pour accéder et utiliser l&apos;application à des fins personnelles et non
                commerciales. Vous ne pouvez pas reproduire, distribuer, transmettre ou exploiter le
                contenu de kōza sans autorisation préalable écrite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                3. Droits d&apos;auteur
              </h2>
              <p>
                Tout le contenu de kōza, y compris les textes, graphiques, logos et images, est
                protégé par le droit d&apos;auteur. © 2026 kōza. Tous droits réservés. Vous pouvez
                télécharger votre contenu personnel pour votre usage personnel uniquement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                4. Disclaimer (Exonération de responsabilité)
              </h2>
              <p>
                kōza est fourni « tel quel » sans aucune garantie, expresse ou implicite. Nous ne
                garantissons pas l&apos;exactitude, la complétude ou l&apos;utilité des informations
                fournies par l&apos;application. Les conseils financiers ne doivent pas être
                considérés comme un avis professionnel.
              </p>
              <p className="mt-4">
                Nous déclinons toute responsabilité pour les pertes financières, les dommages
                indirects ou tout autre préjudice résultant de l&apos;utilisation de kōza.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                5. Limitation de responsabilité
              </h2>
              <p>
                En aucun cas kōza ne sera responsable des dommages directs, indirects, spéciaux,
                accidentels ou punitifs découlant de votre utilisation de l&apos;application, même
                si nous avons été informés de la possibilité de tels dommages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                6. Modifications du service
              </h2>
              <p>
                Nous nous réservons le droit de modifier ou d&apos;interrompre le service à tout
                moment, avec ou sans préavis. Nous ne serons pas responsables envers vous ou un
                tiers pour toute modification, suspension ou interruption du service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                7. Données utilisateur
              </h2>
              <p>
                Vous êtes responsable de toutes les données que vous soumettez à kōza. Vous
                garantissez que vous avez le droit de soumettre ces données et qu&apos;elles ne
                violent aucune loi ou droit de tiers. Vous conservez la propriété intégrale de vos
                données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                8. Utilisation acceptable
              </h2>
              <p>Vous ne devez pas utiliser kōza pour :</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>Violer les lois ou réglementations applicables</li>
                <li>Accéder au compte d&apos;un autre utilisateur sans permission</li>
                <li>Introduire des virus ou codes malveillants</li>
                <li>Harceler, menacer ou intimider d&apos;autres utilisateurs</li>
                <li>Envoyer du contenu spam ou publicitaire non sollicité</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                9. Résiliation
              </h2>
              <p>
                Nous nous réservons le droit de suspendre ou de résilier votre accès à kōza si nous
                jugeons, à notre seule discrétion, que vous avez violé ces conditions ou le droit
                applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                10. Droit applicable
              </h2>
              <p>
                Ces conditions d&apos;utilisation sont régies par et construites conformément aux
                lois de France, sans considération pour ses principes de conflits de lois.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                11. Modifications des conditions
              </h2>
              <p>
                Nous nous réservons le droit de modifier ces conditions d&apos;utilisation à tout
                moment. Vous êtes responsable de revoir régulièrement ces conditions. Votre
                utilisation continue de kōza après toute modification constitue votre acceptation
                des conditions modifiées.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                12. Contact
              </h2>
              <p>
                Si vous avez des questions concernant ces conditions d&apos;utilisation, veuillez
                nous contacter à :{" "}
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
