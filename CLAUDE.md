# kōza — Budget 50/30/20 — Instructions Claude Code

> **kōza** (口座, « compte » en japonais) — application de suivi de budget personnel basée sur la règle 50/30/20. Graphie de marque : `kōza`, en minuscules avec macron.

## Rôle et posture

Tu es un développeur fullstack senior spécialisé en applications web modernes. Tu travailles sur ce projet en mode **vibe coding** : tu prends les décisions techniques par défaut sans demander de validation pour chaque choix, tu proposes du code fonctionnel et production-grade, et tu documentes tes choix importants directement dans le code ou dans ce fichier.

**Deadline : vendredi 13 juin 2026 — livraison, déploiement et démo live.**

---

## Concept du projet

Application web de gestion des finances personnelles basée sur la **règle budgétaire 50/30/20** :

| Catégorie | % | Contenu |
| --- | --- | --- |
| Dépenses essentielles | 50 % | Logement, alimentation, transports, santé, assurances, factures |
| Loisirs | 30 % | Restaurants, sorties, vacances, sport, jeux vidéo, culture |
| Épargne / Investissement | 20 % | Livret d'épargne, ETF, actions, immobilier, fonds d'urgence |

---

## Stack technique

### Versions épinglées (référence : 8 juin 2026)

On vise du **moderne et stable**. Versions de référence à l'initialisation :

| Lib | Version | Notes |
| --- | --- | --- |
| Node.js | **24 LTS** | requis par Next 16 (≥ 20.9), image `node:24-alpine` |
| Next.js | **16.2.x LTS** | App Router, CVE-2025-29927 corrigée |
| React | **19.2.x** | + React DOM même version |
| TypeScript | **5.x** | mode strict |
| Prisma | **7.x** | générateur `prisma-client` (Rust-free, ESM) |
| Tailwind CSS | **4.x** | config **CSS-first** (`@theme`), pas de `tailwind.config.ts` |
| next-intl | **4.x** | i18n compatible Next 16 |
| Zod | **4.x** | validation |
| React Hook Form | **7.x** | + `@hookform/resolvers` (détecte Zod v4) |
| Recharts | **3.x** | React 19 natif |
| next-themes | dernière stable | thème clair/sombre |
| Vitest | **4.x** | tests unitaires & intégration |
| Playwright | dernière stable | E2E |

> Toujours installer la dernière patch stable de chaque majeur. Si une alternative est plus pertinente pour un besoin précis, adopte-la et note ton choix ici.

### Framework fullstack

- **Next.js 16 LTS** (App Router) — TypeScript strict
- Rendu : **Server Components par défaut**, Client Components uniquement là où il y a de l'interactivité (formulaires, graphiques, thème)
- API : **Route Handlers** (`app/api/`) — pas de serveur séparé
- Config en **`next.config.ts`** (TypeScript supporté nativement)

### Base de données

- **Prisma Postgres** (PostgreSQL 16 hébergé) — base de **dev ET de prod**, via la connection string `DATABASE_URL`
- **Prisma 7** — ORM, migrations, génération de types
  - Générateur **`prisma-client`** (sortie ESM dans `src/generated/prisma`), pas l'ancien `prisma-client-js`
  - Connexion via le **driver adapter `@prisma/adapter-pg`** (`pg`) + **`prisma.config.ts`** (Prisma 7 retire `url` du schéma)
  - `DATABASE_URL` obtenu via `npx prisma postgres link` — jamais commité (`.env` gitignoré, secret GitHub pour la CI)
  - Montants en **`Decimal`** (→ Postgres `NUMERIC`) — jamais `Float`, pour une précision exacte sur les sommes et ratios 50/30/20
  - Manipulation des montants via les `Decimal` Prisma / `decimal.js` côté logique métier — jamais d'arithmétique sur des `number` flottants
- Pas de SQLite, pas de localStorage comme source de vérité

### Styling

- **Tailwind CSS 4** — palette douce, design apaisant
- **Config CSS-first** : les tokens de thème sont déclarés via `@theme` dans `src/app/globals.css`, pas dans un fichier JS
- Toute la DA (couleurs, radius, shadows) passe par des variables CSS exposées au `@theme`
- Dark mode via `@custom-variant dark (&:where(.dark, .dark *))` + classe `dark` sur `<html>` pilotée par `next-themes`

### Librairies clés

- **Recharts 3** — graphiques (compatible React 19, plus de hack `react-is`)
- **next-intl 4** — internationalisation (FR par défaut, EN disponible)
- **Zod 4** — validation des formulaires et des payloads API
- **next-themes** — gestion du thème clair/sombre
- **React Hook Form 7** + `@hookform/resolvers` (Zod resolver) — formulaires performants

### Tests

- **Vitest 4** — tests unitaires (logique métier, validators, utils)
- **Testing Library** — tests d'intégration composants React
- **Playwright** — tests E2E
- **CI** : GitHub Actions — obligatoire au vert pour merger une PR

### Infrastructure

- **Docker** + **Docker Compose** — développement local et déploiement
- **Multi-stage Dockerfile** — build optimisé pour la production (base `node:24-alpine`)

> Si une alternative est plus pertinente pour un besoin précis, adopte-la et note ton choix ici.

---

## Fonctionnalités MVP (scope strict)

### 1. Onboarding (premier lancement)

Flow guidé en 3 étapes, sans données pré-remplies :

1. **Bienvenue** — écran d'accueil expliquant la méthode 50/30/20 en une phrase + illustration zen
2. **Revenus** — saisir son revenu principal (montant + source). Possibilité d'ajouter d'autres sources ou de skip
3. **Confirmation** — récapitulatif des enveloppes calculées (50/30/20) avec message encourageant

L'onboarding ne s'affiche qu'une seule fois. Un flag `onboardingCompleted` est stocké en base.

### 2. Revenus

- Saisie manuelle avec plusieurs sources possibles
- Calcul automatique des enveloppes 50/30/20 dès la saisie
- CRUD complet : créer, modifier, supprimer un revenu

### 3. Dépenses

- Ajout rapide : **montant → catégorie → description → date** (moins de 10 secondes)
- Champs obligatoires : date, montant, description, catégorie principale, sous-catégorie
- Classement en 3 catégories principales avec sous-catégories prédéfinies (voir tableau ci-dessus)
- CRUD complet : créer, modifier, supprimer une dépense
- Confirmation avant suppression (modal zen, pas de popup browser)

### 4. Budgets personnalisés

Chaque budget contient :

- Nom, montant cible, date optionnelle, catégorie parente
- Barre de progression visuelle
- CRUD complet : créer, modifier, supprimer un budget
- Exemples : "Vacances d'été" (Loisirs), "Apport immobilier" (Épargne)

### 5. Tableaux de bord

**Vue mensuelle :**

- Revenus du mois
- Dépenses par catégorie vs objectifs 50/30/20
- Comparaison avec le mois précédent
- Navigation entre les mois pour consulter l'historique

**Vue annuelle :**

- Répartition globale des dépenses
- Tendances de consommation
- Progression de l'épargne

### 6. Logique mensuelle

- **Reset au 1er de chaque mois** — un nouveau cycle budgétaire démarre automatiquement
- **Report du surplus/déficit** — si l'utilisateur dépense 45% en "Essentiels" au lieu de 50%, les 5% restants s'ajoutent au mois suivant. Inversement, un dépassement se soustrait
- **Historique consultable** — l'utilisateur peut naviguer dans les mois passés pour voir ses dépenses, revenus et répartition. Les mois clôturés sont en lecture seule

### 7. Notifications (in-app uniquement pour le MVP)

Déclencher une alerte contextuelle lorsque :

- 80 % d'un budget est atteint
- 100 % d'un budget est dépassé
- Une catégorie dépasse son seuil 50/30/20
- Un objectif d'épargne est proche (≥ 90 %)

Ton des notifications : **informatif et encourageant**, jamais culpabilisant.

### 8. Paramètres utilisateur

- Basculer entre **thème clair / thème sombre**
- Changer la **langue** (FR / EN) — la devise reste EUR
- Modifier / reconfigurer ses revenus
- Exporter ses données en JSON (backup manuel)

---

## Hors scope MVP

Ne pas implémenter pour l'instant :

- Synchronisation bancaire
- Import automatique de transactions
- Prévisions financières
- Gestion patrimoniale
- Authentification / comptes multi-utilisateurs
- Accessibilité WCAG (sera traitée dans une itération dédiée)
- PWA / mode offline

---

## Internationalisation (i18n)

- Langue par défaut : **français (fr)**
- Langue secondaire : **anglais (en)**
- La devise est **toujours EUR** — pas de conversion, pas de sélection de devise
- Format des montants : `1 234,56 €` en FR, `€1,234.56` en EN
- Format des dates : `JJ/MM/AAAA` en FR, `MM/DD/YYYY` en EN
- Toutes les chaînes de caractères visibles passent par i18n — aucun texte en dur dans les composants
- Fichiers de traduction dans `src/locales/{fr,en}.json` ou `messages/`
- La langue est stockée en base (préférence utilisateur) et en cookie comme fallback

---

## Principes UX non négociables

- **Ajout d'une dépense en < 10 secondes** — optimise le formulaire en conséquence (focus auto, valeurs par défaut, raccourcis clavier)
- **Une seule intention par écran** — pas d'éléments décoratifs inutiles, chaque px justifie sa présence
- **Jamais de rouge** — les alertes et dépassements s'expriment via une variation de teinte ou un texte doux, pas par une couleur d'alarme
- **Progression mise en avant** — ce qui est bien géré apparaît en premier, les dépassements sont discrets
- **L'utilisateur doit ressentir la paix, pas la pression** — l'app est un espace de clarté mentale, pas un tableau de bord de performance

---

## Direction artistique — Zen / Apple-like

### Intention globale

L'interface doit évoquer **la clarté d'un matin calme** : propre, aéré, intentionnel. Chaque écran doit donner l'impression que tout est sous contrôle, même quand un budget déborde légèrement. Pense à un carnet de notes premium, une app de méditation (Calm, Headspace), ou un produit Apple — mais appliqué à la finance.

### Palette — Light mode (défaut)

```css
--color-bg:           #F9F8F6;
--color-surface:      #FFFFFF;
--color-surface-alt:  #F3F2EF;

--color-text:         #1C1C1E;
--color-text-secondary: #6E6E73;
--color-muted:        #AEAEB2;

--color-essential:    #7D9E8C;
--color-essential-bg: #EEF3F0;
--color-leisure:      #9B8EAD;
--color-leisure-bg:   #F2EFF7;
--color-savings:      #7A9BB5;
--color-savings-bg:   #ECF2F7;

--color-warning:      #C4956A;
--color-warning-bg:   #FBF3EA;
--color-over:         #B07070;
--color-over-bg:      #F7EDEC;

--color-accent:       #5A7A6A;
--color-accent-soft:  #E9EFEB;
--color-line:         rgba(0,0,0,0.06);
```

### Palette — Dark mode

```css
--color-bg:           #1A1A1C;
--color-surface:      #242426;
--color-surface-alt:  #2C2C2E;

--color-text:         #E5E5E7;
--color-text-secondary: #98989D;
--color-muted:        #6E6E73;

--color-essential:    #8FB09E;
--color-essential-bg: #232A26;
--color-leisure:      #ADA0BF;
--color-leisure-bg:   #2A2630;
--color-savings:      #8AADC7;
--color-savings-bg:   #222B32;

--color-warning:      #D2A77E;
--color-warning-bg:   #2E281F;
--color-over:         #C18A8A;
--color-over-bg:      #2E2323;

--color-accent:       #7A9E8A;
--color-accent-soft:  #25302A;
--color-line:         rgba(255,255,255,0.06);
```

> Tokens alignés sur le handoff Claude Design (`docs/design/handoff/`), référence visuelle canonique. `--color-accent-soft` = fonds des boutons/états « soft » et icône active ; `--color-line` = bordures fines (notamment les cartes en dark, qui remplacent les ombres).

Implémentation : classe `dark` sur `<html>` via `next-themes`. En dark mode, les shadows sont remplacées par des bordures `1px solid rgba(255,255,255,0.06)`.

### Typographie — Sérénité et lisibilité

- **Display / titres** : `Instrument Serif` ou `Lora` — via `next/font/google`
- **Corps / UI** : `Inter` variable via `next/font/google` avec `font-feature-settings: "ss01", "cv05"`
- **Tailles** : échelle resserrée — 12 / 14 / 16 / 20 / 28 / 40px, jamais plus de 3 tailles par écran
- **Poids** : 300 (montants larges), 400 (corps), 500 (labels), 600 (titres de section) — jamais 700+

### Espacements & layout — Respiration maximale

- Marges internes des cartes : `24px` minimum, `32px` sur desktop
- Gouttières entre sections : `40px` à `64px` — l'espace vide **est** le design
- Largeur de contenu max : `720px` centré — pas de layout full-width
- Bottom nav mobile / sidebar minimaliste desktop, icônes seules (pas de labels sauf état actif)

### Responsive & breakpoints

L'app est une **web app responsive** : une seule base de code, fluide du mobile au desktop. Approche **mobile-first** (styles de base = mobile, on enrichit vers le haut avec les breakpoints Tailwind).

Breakpoints Tailwind par défaut : `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

**Breakpoint de bascule de navigation : `lg` (1024px).**

| | Mobile / tablette (`< lg`) | Desktop (`≥ lg`) |
| --- | --- | --- |
| **Navigation** | Bottom nav fixe, 4 icônes (`lg:hidden`) | Sidebar gauche minimaliste, icônes seules (`hidden lg:flex`) |
| **Contenu** | Colonne unique, `max-w-[720px]`, padding `24px`, gouttières `40px` | Colonne unique centrée, `max-w-[720px]`, padding `32px`, gouttières `48–64px` |
| **Ajout rapide** | Bottom sheet | Panneau latéral glissant (slide-in) |

Règles :

- Le **contenu reste plafonné à `720px` centré** à toutes les tailles — jamais de full-width, même en grand écran. La sidebar vit en dehors de cette colonne.
- Les paddings/gouttières montent progressivement (`md` puis `lg`), jamais en dessous des minima ci-dessus.
- Les graphiques Recharts utilisent un conteneur responsive (`ResponsiveContainer`) ; on ne fige jamais une largeur en pixels.
- Toute UI doit être vérifiée **mobile ET desktop** (déjà dans la checklist de PR).

### Formes & effets

```css
--radius-card:    16px;
--radius-button:  12px;
--radius-input:   10px;
--radius-pill:    999px;

--shadow-card:    0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
--shadow-hover:   0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06);
```

### Animations — Lentes et intentionnelles

- Transitions : `200ms ease-out` (hover/focus), `300ms ease-out` (transitions de page)
- Graphiques : ease-in progressif (stagger 80ms) — jamais de pop brutal
- Barres de progression : `600ms ease-out` à l'entrée dans le viewport
- Pas de compteurs animés (stress, pas zen)
- Transition dark mode : `300ms ease` sur background-color et color

### Graphiques — Minimalisme sensoriel

- **Recharts** : couleurs `--color-*-bg` pour les aires, `--color-*` pour les traits/barres
- Grilles supprimées, axes minimaux
- Tooltips légers : fond `--color-surface` + `backdrop-filter: blur(8px)`
- Donut chart 50/30/20 : stroke-width 8px, centre vide avec solde
- Courbes en `type="monotone"`

### Composants clés

**Cartes de catégorie :** fond `--color-*-bg`, aucune bordure, montant en `font-weight: 300` / 28px

**Barre de progression :** fond `--color-surface-alt`, hauteur 4px, jamais de rouge même à 100%

**Formulaire d'ajout rapide :** bottom sheet mobile / panel latéral desktop, champ montant 40px centré, catégorie en 3 pills

**Navigation :** 4 icônes max (Dashboard, Dépenses, Budgets, Réglages), icône active `--color-accent`

---

## Docker

### Développement local — `docker-compose.yml`

La base de dev est **Prisma Postgres (hébergé)**, pas un Postgres local — **pas de service `db`** dans le compose. Un seul service :

1. **`app`** — Next.js en mode dev
   - Port : `3000`
   - Volume bind-mount du code source (hot reload)
   - `env_file: .env` → se connecte à Prisma Postgres via `DATABASE_URL`

> Récupère ta connection string avec `npx prisma postgres link --database <id>` (écrit `DATABASE_URL` dans `.env`). Lancer l'app sans Docker fonctionne aussi : `npm run dev`.

Un fichier `.env.example` documente la variable requise. `.env` est dans le `.gitignore`.

### Production — `Dockerfile` (multi-stage)

```text
Stage 1 : deps        — install des dépendances (node_modules)
Stage 2 : builder     — prisma generate + next build
Stage 3 : runner      — image minimale (node:24-alpine), copie du standalone output + static + public
```

Optimisations :

- `output: 'standalone'` dans `next.config.js` — image finale légère (~150MB)
- L'image finale ne contient ni les sources ni les devDependencies
- `HEALTHCHECK` sur `/api/health`
- User non-root (`nextjs:nodejs`)

### Scripts npm attendus

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "db:migrate": "prisma migrate dev",
  "db:push": "prisma db push",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio",
  "lint": "eslint . && prettier --check .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "docker:dev": "docker compose up -d",
  "docker:down": "docker compose down"
}
```

### Endpoint de santé — `app/api/health/route.ts`

Retourne `200 OK` avec un check de connexion Prisma. Utilisé par le `HEALTHCHECK` Docker et par la plateforme de déploiement.

---

## Déploiement — Vercel + Prisma Postgres

Déploiement sur **Vercel** ; base de données **Prisma Postgres** en deux instances isolées :

| Base | Usage | `migrate` |
|---|---|---|
| `koza-dev` | dev local quotidien | `migrate dev` (+ `db seed`) |
| `koza-prod` | production (vraies données) | **`migrate deploy` uniquement** |

> Tests CI = Postgres **éphémère** (service GitHub Actions), jamais dev ni prod.

### Où vit `DATABASE_URL` (jamais la prod dans le repo)

- **`.env` local** (gitignoré) → URL **dev** (via `npx prisma postgres link`).
- **Vercel → Production** → URL **prod** (`koza-prod`).
- **Vercel → Preview** (option) → URL dev ou base de preview dédiée.
- **Secret GitHub `DATABASE_URL`** → CI, pour `prisma generate` (ne se connecte pas).
- **Secret GitHub `PROD_DATABASE_URL`** → workflow `deploy.yml`, pour `migrate deploy`.

### Flux

```
dev   : edit schema → npm run db:migrate          (migrate dev → koza-dev) → commit
prod  : push sur main →
          • .github/workflows/deploy.yml → npm run db:migrate:deploy  (→ koza-prod)
          • Vercel (intégration Git) build & déploie l'app
```

- Build Vercel : `npm install` déclenche `postinstall: prisma generate`, puis `next build`.
- Runtime : l'app se connecte à `koza-prod` via l'adapter `@prisma/adapter-pg`.
- **Jamais `migrate dev` ni `db seed` contre la prod.**

---

## Conventions Git

### Branche principale

- `main` est **protégée** — zéro commit direct, sans exception
- Tout code passe obligatoirement par une **Pull Request** reviewée avant merge
- Stratégie de merge : **Merge commit** — **jamais de squash, jamais de rebase**. Tous les commits de la branche sont préservés tels quels sur `main`, plus un commit de merge qui marque le regroupement de la PR. Objectif : un historique précis et complet
- **Le merge est fait manuellement par le mainteneur sur l'interface GitHub web** — Claude Code n'effectue jamais le merge

### Nomenclature des branches

Format : `<type>/<scope-court>`

| Type | Usage |
| --- | --- |
| `feat/` | Nouvelle fonctionnalité (ex. `feat/add-expense-form`) |
| `fix/` | Correction de bug (ex. `fix/budget-overflow-calculation`) |
| `chore/` | Maintenance, dépendances, config (ex. `chore/update-recharts`) |
| `hotfix/` | Correction urgente (ex. `hotfix/db-connection-pool`) |
| `refactor/` | Réécriture sans changement de comportement (ex. `refactor/extract-budget-hook`) |
| `style/` | Changements purement visuels / CSS (ex. `style/zen-card-spacing`) |
| `docs/` | Documentation uniquement (ex. `docs/update-claude-md`) |
| `test/` | Ajout ou correction de tests (ex. `test/budget-utils-coverage`) |

Règles de nommage :

- Tout en **minuscules**, séparateurs **tirets** (`-`), pas d'underscores ni de camelCase
- Scope court et descriptif — 2 à 5 mots maximum
- Pas de numéro de ticket en préfixe

### Convention de commits — Conventional Commits

Format : `<type>(<scope>): <description>`

```text
feat(expenses): add quick-add bottom sheet form
fix(dashboard): correct 50/30/20 ratio when income is zero
chore(docker): add multi-stage production dockerfile
refactor(budget): extract useBudgetProgress hook
test(api): add integration tests for income endpoints
```

Règles :

- **Type** : identique aux types de branche
- **Scope** : module concerné (`expenses`, `dashboard`, `budgets`, `charts`, `api`, `db`, `docker`, `ci`, `i18n`)
- **Description** : en **anglais**, impératif présent, sans majuscule, sans point final
- **72 caractères max** sur la première ligne
- **Aucun `Co-authored-by`** — jamais de trailer d'attribution. Un seul auteur par commit : le développeur.

### Pull Requests

- **Titre** : format Conventional Commits
- **La PR ne peut être mergée que si tous les checks CI sont au vert**
- **Template** (`.github/pull_request_template.md`) :

```markdown
## Ce que fait cette PR
<!-- Une phrase. -->

## Pourquoi
<!-- Contexte ou problème résolu. -->

## Comment tester
<!-- Étapes manuelles pour vérifier le comportement. -->

## Checklist
- [ ] Le code respecte les conventions du CLAUDE.md
- [ ] Aucun `console.log` de debug laissé
- [ ] Les types TypeScript sont complets (pas de `any`)
- [ ] Les tests passent localement (`npm run test`)
- [ ] L'UI a été vérifiée sur mobile et desktop
- [ ] L'UI fonctionne en light mode et dark mode
- [ ] Les textes visibles passent par i18n (pas de string en dur)
```

### Granularité des commits

- **Pas de squash** → chaque commit atterrit tel quel sur `main`. Donc **chaque commit doit être parfait individuellement** : il build, le lint passe, les types sont complets, pas de `console.log`, et il représente une étape cohérente et fonctionnelle
- **Commits fins et précis privilégiés** — découper par étape logique. Une PR peut largement dépasser 3-6 commits si chaque commit reste atomique et propre ; mieux vaut 10 commits nets qu'un seul commit fourre-tout
- Un commit = une intention claire (ex. « add zod validators », puis « add api route », puis « add tests »), jamais un mélange de plusieurs préoccupations
- Pas de commit « WIP » ou cassé sur une branche destinée à une PR

### Règles pour Claude Code

- Crée **une branche par fonctionnalité** — ne jamais empiler plusieurs features sur une même branche
- Ne jamais committer directement sur `main`
- Ne jamais merger soi-même : ouverture de la PR via `gh`, le merge reste manuel côté mainteneur
- Corrections urgentes : branche `hotfix/` depuis `main`

---

## Structure de projet

```text
koza/
  src/
    app/
      (onboarding)/               # Route group — pages d'onboarding
        welcome/page.tsx
        setup/page.tsx
        confirm/page.tsx
      (main)/                     # Route group — app principale
        dashboard/page.tsx
        expenses/page.tsx
        budgets/page.tsx
        settings/page.tsx
      api/
        health/route.ts
        incomes/route.ts
        expenses/route.ts
        expenses/[id]/route.ts
        budgets/route.ts
        budgets/[id]/route.ts
        settings/route.ts
        monthly-balance/route.ts
      layout.tsx
      globals.css
    components/
      dashboard/
      expenses/
      budgets/
      charts/
      notifications/
      onboarding/
      ui/                         # composants atomiques réutilisables
    hooks/
    lib/
      prisma.ts                   # singleton Prisma client
      budget.ts                   # logique 50/30/20, reports
      notifications.ts            # calcul des seuils
      formatters.ts               # montants, dates selon locale
      validators.ts               # schémas Zod partagés
    locales/
      fr.json
      en.json
    generated/
      prisma/                     # client Prisma 7 généré (gitignored)
    types/
      index.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts                       # seed optionnel pour la démo
  e2e/
    specs/
    fixtures/
  public/
  .github/
    workflows/
      ci.yml
    pull_request_template.md
  Dockerfile
  docker-compose.yml
  .env.example
  next.config.ts                  # TS natif (Next 16)
  postcss.config.mjs              # @tailwindcss/postcss (Tailwind v4)
  CLAUDE.md
```

> Tailwind v4 est en **config CSS-first** : pas de `tailwind.config.ts`. Les tokens de thème vivent dans `src/app/globals.css` via `@theme`. Le client Prisma est généré dans `src/generated/prisma` (à ajouter au `.gitignore`).

---

## Tests et CI/CD

### Stratégie de tests

**Tests unitaires (Vitest)** :

- Logique métier : calculs 50/30/20, report surplus/déficit, seuils de notification
- Validators Zod : rejets et acceptations
- Formatters : montants et dates en FR et EN
- Couverture cible : **80%** sur `lib/`, `hooks/`

**Tests d'intégration** :

- Route Handlers : chaque endpoint CRUD testé avec une base de test
- Composants React : Testing Library pour les formulaires (ajout dépense, onboarding)

**Tests E2E (Playwright)** :

- Flow onboarding complet
- Ajout/modification/suppression d'une dépense
- Navigation entre mois
- Bascule dark mode + changement de langue

### GitHub Actions — `.github/workflows/ci.yml`

Le workflow se déclenche sur **`push` (toutes branches)** et sur **`pull_request` vers `main`**.

**Jobs systématiques** (à chaque push *et* sur PR) :

1. **lint** — ESLint + Prettier check
2. **build** — `prisma generate` + `next build` (échoue aussi sur erreur de type, `next build` exécute `tsc`)

**Jobs supplémentaires, uniquement sur PR** (`if: github.event_name == 'pull_request'`) :
3. **test-unit** — Vitest
4. **test-integration** — Vitest + base PostgreSQL (service container)
5. **test-e2e** — Playwright headless contre l'app buildée

Tous les jobs requis doivent être **au vert** pour qu'une PR soit mergeable. Sur un simple push de branche, seuls `lint` et `build` tournent — feedback rapide sans payer le coût des tests à chaque commit.

Les jobs d'intégration et E2E utilisent un **service PostgreSQL** dans GitHub Actions :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: koza_test
    ports:
      - 5432:5432
```

Règles GitHub sur `main` :

- Branch protection activée
- Status checks requis : `lint`, `build`, et les jobs de tests (`test-unit`, `test-integration`, `test-e2e`)
- **Merge commit uniquement** — squash et rebase désactivés dans les réglages du repo

---

## Conventions de code

- **TypeScript strict** — pas de `any`, interfaces explicites pour toutes les entités
- **Server Components par défaut** — `"use client"` uniquement pour l'interactivité
- **Hooks personnalisés** pour la logique métier côté client
- **Séparation claire** : logique dans `lib/` et `hooks/`, présentation dans `components/`
- **Nommage** : PascalCase (composants), camelCase (fonctions/variables), SCREAMING_SNAKE_CASE (constantes)
- **Commentaires** : français pour la logique métier, anglais pour les annotations techniques
- **Pas de texte en dur** dans les composants — tout passe par i18n

---

## Modèle de données (Prisma)

> Montants en `Decimal @db.Decimal(12, 2)` (Postgres `NUMERIC`) — jamais `Float`. Précision exacte sur les sommes et ratios 50/30/20.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RecurringType    { FIXED VARIABLE }
enum Frequency        { MONTHLY QUARTERLY YEARLY }
enum OccurrenceStatus { APPLIED PENDING CONFIRMED DROPPED }

model Income {
  id        String   @id @default(cuid())
  source    String
  amount    Decimal  @db.Decimal(12, 2)
  date      DateTime               // date de réception (1er du mois par défaut)
  month     String   // "YYYY-MM"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([month])
}

model Expense {
  id          String            @id @default(cuid())
  amount      Decimal           @db.Decimal(12, 2)
  description String
  date        DateTime
  month       String            // "YYYY-MM" — période d'imputation (dérivée de date)
  category    String            // 'essential' | 'leisure' | 'savings'
  subcategory String
  budgetId    String?
  budget      Budget?           @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  recurringId String?           // null si saisie manuelle
  recurring   RecurringExpense? @relation(fields: [recurringId], references: [id], onDelete: SetNull)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  @@index([month])
}

model Budget {
  id           String    @id @default(cuid())
  name         String
  targetAmount Decimal   @db.Decimal(12, 2)
  category     String    // 'essential' | 'leisure' | 'savings'
  deadline     DateTime?
  expenses     Expense[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

// Ancre la chaîne de report et l'état ouvert/clôturé. Base et repères 50/30/20 sont dérivés.
model MonthlyPeriod {
  id        String    @id @default(cuid())
  month     String    @unique // "YYYY-MM"
  carryIn   Decimal   @default(0) @db.Decimal(12, 2)  // = carryOut du mois précédent
  carryOut  Decimal?  @db.Decimal(12, 2)              // figé à la clôture ; null tant qu'ouvert
  closedAt  DateTime?                                  // null = ouvert ; sinon lecture seule
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model RecurringExpense {
  id          String                @id @default(cuid())
  label       String
  type        RecurringType                 // FIXED = auto-créée ; VARIABLE = à confirmer
  amount      Decimal               @db.Decimal(12, 2)
  category    String
  subcategory String
  frequency   Frequency
  anchorMonth String                        // "YYYY-MM" : 1ʳᵉ échéance
  endMonth    String?
  active      Boolean               @default(true)
  occurrences RecurringOccurrence[]
  expenses    Expense[]
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
}

model RecurringOccurrence {
  id          String           @id @default(cuid())
  recurringId String
  recurring   RecurringExpense @relation(fields: [recurringId], references: [id], onDelete: Cascade)
  month       String
  status      OccurrenceStatus
  expenseId   String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  @@unique([recurringId, month])
}

model UserSettings {
  id                  String  @id @default("default")
  theme               String  @default("light")
  locale              String  @default("fr")
  onboardingCompleted Boolean @default(false)
}
```

---

## Seed de démo

Pour la présentation de vendredi, un script `prisma/seed.ts` doit générer :

- 1 revenu principal (ex. 2 500 € "Salaire") sur le mois en cours et les 2 mois précédents
- 15-20 dépenses réalistes réparties sur 3 mois avec des sous-catégories variées
- 2 budgets (ex. "Vacances Grèce" à 1 200 € / "Fonds d'urgence" à 3 000 €) avec une progression partielle
- 2 `MonthlyBalance` clôturés pour les mois précédents avec des surplus/déficits légers
- `UserSettings` avec `onboardingCompleted: true`

Le seed doit produire un dashboard visuellement riche et réaliste pour la démo. Commande : `npx prisma db seed`.

---

## Comportement attendu de Claude Code

1. **Commence par scaffolder** : structure Next.js + Prisma + Docker Compose + CI → l'app doit `docker compose up` et afficher une page blanche dès le premier commit
2. **Implémente feature par feature** dans cet ordre :
   - Setup projet + Docker + CI + health check
   - Schéma Prisma + migrations + seed de démo
   - Onboarding
   - Revenus (CRUD)
   - Dépenses (CRUD + ajout rapide)
   - Budgets (CRUD + progression)
   - Dashboard (mensuel + annuel + navigation mois)
   - Logique mensuelle (report surplus/déficit)
   - Notifications in-app
   - Settings (dark mode, i18n, export JSON)
3. **Écris les tests en parallèle de chaque feature** — chaque PR inclut ses tests unitaires et d'intégration
4. **Ne demande pas confirmation** pour les choix standards — documente-les
5. **Signale les blocages** uniquement si impact significatif sur le scope ou l'architecture
6. **Garde le CLAUDE.md à jour** si la stack ou les conventions changent
7. **Le seed de démo est prioritaire** — le dashboard doit être impressionnant pour la présentation de vendredi

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->