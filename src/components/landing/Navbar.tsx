"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import JoselineEasterEgg from "./JoselineEasterEgg";
import { redirect } from "next/navigation";

export default function Navbar() {
  const t = useTranslations("landing.nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showJoseline, setShowJoseline] = useState(false);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);

    // Easter egg: 3 clics pour Joseline
    if (newClicks === 3) {
      setShowJoseline(true);
      setLogoClicks(0);
    } else {
      redirect("/");
    }

    // Reset après 2 secondes d'inactivité
    setTimeout(() => {
      setLogoClicks(0);
    }, 2000);
  };

  return (
    <>
      <JoselineEasterEgg isVisible={showJoseline} onClose={() => setShowJoseline(false)} />

      <nav className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleLogoClick}
            className="text-2xl font-serif font-semibold cursor-pointer hover:text-[var(--color-accent)] transition-colors"
            title={logoClicks > 0 ? t("easterEggHint", { remaining: 3 - logoClicks }) : undefined}
          >
            kōza
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex gap-8 items-center">
            <a
              href="#features"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              {t("features")}
            </a>
            <a
              href="#benefits"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              {t("benefits")}
            </a>
            <a
              href="#faq"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              {t("faq")}
            </a>
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              {t("dashboard")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("menu")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--color-line)] px-6 py-4 space-y-3">
            <a
              href="#features"
              className="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              onClick={() => setMobileOpen(false)}
            >
              {t("features")}
            </a>
            <a
              href="#benefits"
              className="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              onClick={() => setMobileOpen(false)}
            >
              {t("benefits")}
            </a>
            <a
              href="#faq"
              className="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              onClick={() => setMobileOpen(false)}
            >
              {t("faq")}
            </a>
            <Link href="/dashboard" className="block text-sm text-[var(--color-accent)]">
              {t("dashboard")}
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
