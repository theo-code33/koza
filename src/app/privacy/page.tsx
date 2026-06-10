import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

export async function generateMetadata() {
  const t = await getTranslations("legal.privacy");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function PrivacyPolicy() {
  const t = useTranslations("legal.privacy");
  const bold = { b: (chunks: ReactNode) => <strong>{chunks}</strong> };
  const s3Items = t.raw("s3Items") as string[];
  const s5Items = t.raw("s5Items") as string[];
  const s7Items = t.raw("s7Items") as string[];

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
              <p>{t("s2Intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>{t.rich("s2Item1", bold)}</li>
                <li>{t.rich("s2Item2", bold)}</li>
                <li>{t.rich("s2Item3", bold)}</li>
              </ul>
              <p className="mt-4">{t.rich("s2Outro", bold)}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s3Title")}
              </h2>
              <p>{t("s3Intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                {s3Items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s4Title")}
              </h2>
              <p>{t.rich("s4Body1", bold)}</p>
              <p className="mt-4">{t("s4Body2")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s5Title")}
              </h2>
              <p>{t("s5Intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                {s5Items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="mt-4">{t("s5Outro")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s6Title")}
              </h2>
              <p>{t.rich("s6Body", bold)}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[var(--color-text)] mb-4">
                {t("s7Title")}
              </h2>
              <p>{t("s7Intro")}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                {s7Items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="mt-4">
                {t("s7ContactPrefix")}{" "}
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
                {t("s8Title")}
              </h2>
              <p>{t("s8Body")}</p>
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
              <p>
                {t("s11Body")}{" "}
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
