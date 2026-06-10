# kōza — i18n de la landing page — Design

> Spec validée le 2026-06-11. Branche : `feat/landing-i18n`. Suite de la PR #12 (i18n FR/EN de l'app).

## Objectif

Faire passer la **landing page publique** (ajoutée sur `main` après la PR i18n, donc en FR en dur) sous le système d'internationalisation existant, pour une cohérence FR/EN complète du site. Périmètre : les 9 composants `src/components/landing/*`, la page d'accueil `/`, et les pages légales `/privacy` et `/terms`.

## Décisions

### Pas de sélecteur de langue sur la landing

Un visiteur arrive sur `/` avant l'onboarding et n'a pas accès aux Réglages. **On n'ajoute pas** de switcher dans la Navbar : la landing est traduite mais rendue selon la locale déjà résolue par `resolveLocale()` (cookie `NEXT_LOCALE` → DB `UserSettings.locale` → défaut `fr`). Le choix de langue se fait après onboarding dans les Réglages. Pas de négociation `Accept-Language` (cohérent avec le hors-scope de la PR i18n initiale).

### `useTranslations` partout (API isomorphe synchrone)

Tous les composants et pages landing utilisent **`useTranslations`** (depuis `next-intl`), pas `getTranslations`. Raison : `useTranslations` est synchrone et fonctionne dans les composants serveur **non-async** (Hero, Features, Benefits, CTAFinal, Footer, pages légales) comme dans les client components (Navbar, FAQ, JoselineEasterEgg). Cela évite de transformer les composants serveur en `async` — ce qui les rendrait non-rendables en jsdom et casserait le smoke test de la home. Tous sont déjà englobés par le `NextIntlClientProvider` du layout racine.

### Trad EN : marketing idiomatique, légal avec caveat

- Landing : traduction **idiomatique** (copie marketing), pas littérale.
- `/privacy` et `/terms` : traduction EN fournie mais **non relue par un juriste** — à faire valider avant une mise en prod où l'enjeu légal est réel.

## Catalogues (`src/locales/{fr,en}.json`)

Deux nouveaux namespaces au niveau racine :

- **`landing`**, structuré par section : `nav`, `hero`, `features`, `benefits`, `faq`, `cta`, `footer`, `easterEgg`.
- **`legal`** : `privacy` et `terms` (titres de sections + paragraphes).

**Listes** (cartes de `features`, `benefits`, items de `faq`) : on conserve le `.map()` des composants et on récupère le tableau d'objets via **`t.raw("landing.<section>.items")`** (next-intl renvoie la valeur brute du catalogue). Pas de restructuration des composants en clés indexées.

`fr.json` = source de vérité ; `en.json` = mêmes clés, traduit. Le **test de parité** existant (`src/locales/parity.test.ts`) garantit l'égalité des jeux de clés `fr`/`en` — il couvre automatiquement `landing` et `legal`.

## Fichiers

**Modifiés :**
- `src/components/landing/Hero.tsx`, `HeroEnhanced.tsx`, `Features.tsx`, `Benefits.tsx`, `FAQ.tsx`, `CTAFinal.tsx`, `Footer.tsx`, `Navbar.tsx`, `JoselineEasterEgg.tsx` — chaînes visibles → `t(...)` / `t.raw(...)`.
- `src/app/page.tsx` (composition landing — peu/pas de strings propres), `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`.
- `src/locales/fr.json`, `src/locales/en.json` — namespaces `landing` + `legal`.
- `src/app/page.test.tsx` — rendu via `renderWithIntl` (le smoke test monte la landing qui utilise désormais `useTranslations`).

> `Hero.tsx` est traduit pour la complétude même s'il n'est pas monté par `page.tsx` (qui utilise `HeroEnhanced`).

## Tests

- **Smoke test home** (`page.test.tsx`) : `renderWithIntl(<Home />)` → la landing complète monte sans crash en FR (assertions sur le DOM non vide).
- **Parité des clés** `fr`/`en` (garde-fou existant) — étendu de fait aux nouvelles clés.
- Pas de nouveaux tests unitaires par composant landing : ces composants n'en ont pas aujourd'hui, on reste cohérent (YAGNI).

## Cas limites

- Visiteur sans cookie ni préférence DB → `resolveLocale` renvoie `fr` → landing en français, `<html lang="fr">`.
- Texte avec apostrophes : passe désormais par les catalogues JSON (pas de JSX littéral) → plus de problème `react/no-unescaped-entities`.

## Hors scope

- Sélecteur de langue sur la landing.
- Négociation `Accept-Language`.
- Relecture juridique professionnelle de la trad EN des mentions légales.
- Tests unitaires par composant landing.

## Convention de commits

Branche `feat/landing-i18n`. Conventional Commits, anglais, scope `i18n` (ou `landing`). Pas de trailer `Co-authored-by`. Merge commit manuel par le mainteneur. `npm run format` + `lint` + `test` verts + `build` (typecheck) avant chaque commit.
