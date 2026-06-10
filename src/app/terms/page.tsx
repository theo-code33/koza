import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

export async function generateMetadata() {
  const t = await getTranslations("legal.terms");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function TermsOfService() {
  const t = useTranslations("legal.terms");
  const s8Items = t.raw("s8Items") as string[];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-12">{t("pageTitle")}</h1>

          <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-8">
            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s1Title")}
              </h2>
              <p>{t("s1Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s2Title")}
              </h2>
              <p>{t("s2Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s3Title")}
              </h2>
              <p>{t("s3Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s4Title")}
              </h2>
              <p>{t("s4Body1")}</p>
              <p className="mt-4">{t("s4Body2")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s5Title")}
              </h2>
              <p>{t("s5Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s6Title")}
              </h2>
              <p>{t("s6Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s7Title")}
              </h2>
              <p>{t("s7Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s8Title")}
              </h2>
              <p>{t("s8Intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                {s8Items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s9Title")}
              </h2>
              <p>{t("s9Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s10Title")}
              </h2>
              <p>{t("s10Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s11Title")}
              </h2>
              <p>{t("s11Body")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s12Title")}
              </h2>
              <p>
                {t("s12Body")}{" "}
                <a
                  href="mailto:hello@koza.app"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  hello@koza.app
                </a>
              </p>
            </section>

            <section className="pt-8 border-t border-[var(--color-line)]">
              <p className="text-sm text-[var(--color-muted)]">{t("lastUpdated")}</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
