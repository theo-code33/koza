# kōza

> **kōza** (口座, « compte » en japonais) — application web de suivi de budget personnel basée sur la règle **50 / 30 / 20**.

| Catégorie | Part | Contenu |
| --- | --- | --- |
| Dépenses essentielles | 50 % | Logement, alimentation, transports, santé, assurances, factures |
| Loisirs | 30 % | Restaurants, sorties, vacances, sport, jeux vidéo, culture |
| Épargne / Investissement | 20 % | Livret, ETF, actions, immobilier, fonds d'urgence |

## Fonctionnalités

- **Onboarding** guidé en 3 étapes (bienvenue → revenus → confirmation des enveloppes).
- **Revenus** : saisie multi-sources, calcul automatique des enveloppes 50/30/20 (CRUD).
- **Dépenses** : ajout rapide (montant → catégorie → sous-catégorie → date), CRUD complet.
- **Dépenses récurrentes** : modèles fixes (auto-matérialisés) ou variables (à confirmer chaque mois).
- **Budgets** personnalisés avec barre de progression (CRUD).
- **Tableaux de bord** avec bascule mois / année : vue **mensuelle** (enveloppes 50/30/20, navigation entre les mois, comparaison) et vue **annuelle** (répartition globale, tendances mensuelles empilées, épargne accumulée).
- **Logique mensuelle** : clôture au passage de mois et report du surplus/déficit (`carryIn`/`carryOut`).
- **Notifications in-app** contextuelles et encourageantes (seuils de budget, dépassements).
- **Réglages** : thème clair/sombre, langue FR/EN, reconfiguration des revenus, export JSON.
- **Authentification** (email + mot de passe), chaque compte ne voit que ses propres données.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** strict
- **Prisma 7** + **Prisma Postgres** (générateur `prisma-client`, driver adapter `@prisma/adapter-pg`)
- **Auth.js / NextAuth 5** (Credentials, sessions JWT) + **bcryptjs**
- **Tailwind CSS 4** (config CSS-first via `@theme`) · **next-themes** (clair/sombre)
- **next-intl 4** (i18n FR/EN, sans routing) · devise toujours **EUR**
- **React Hook Form 7** + **Zod 4** (`@hookform/resolvers`) — formulaires & validation
- **Recharts 3** — graphiques (donut 50/30/20, tendances mensuelles, courbe d'épargne)
- **Vitest** + Testing Library (unitaire/intégration) · **Playwright** (E2E)
- **Node.js 24 LTS**

## Démarrage

```bash
# 1. Dépendances (déclenche `prisma generate` via postinstall)
npm install

# 2. Connection string de la base de dev (écrit DATABASE_URL dans .env)
npx prisma postgres link

# 3. Secret de signature des sessions (écrire AUTH_SECRET dans .env)
npx auth secret

# 4. Migrations + jeu de démo
npm run db:migrate
npm run db:seed

# 5. Serveur de dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Le `.env` (contenant `DATABASE_URL` et `AUTH_SECRET`) est gitignoré ; voir `.env.example`.

Le seed crée un **compte de démo** : `demo@koza.app` / `demo1234`.

> Variante Docker : `npm run docker:dev` lance l'app en mode dev via `docker-compose.yml` (se connecte à Prisma Postgres via `.env`). `npm run docker:down` pour l'arrêter.

## Scripts

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build de production / démarrage |
| `npm run lint` | ESLint + Prettier (check) — `npm run format` pour corriger |
| `npm run test` / `npm run test:watch` | Tests unitaires & intégration (Vitest) |
| `npm run test:e2e` | Tests end-to-end (Playwright) |
| `npm run db:migrate` | Migration (`migrate dev`) contre **koza-dev** |
| `npm run db:migrate:deploy` | Applique les migrations (`migrate deploy`) — utilisé en CD prod |
| `npm run db:seed` / `npm run db:reset` | (Re)seed de démo (idempotent, wipe + insert) |
| `npm run db:reset:fresh` | Idem mais `onboardingCompleted: false` (pour démontrer l'onboarding) |
| `npm run db:studio` | Prisma Studio (exploration de la base) |

## Authentification

- **Auth.js / NextAuth 5** avec provider **Credentials** (email + mot de passe hashé bcrypt), sessions **JWT**.
- Le **middleware** (`middleware.ts` + `src/auth.config.ts`, Edge-safe) protège toutes les routes hors pages publiques (`/`, `/login`, `/signup`, `/privacy`, `/terms`, `/api/auth/*`, `/api/health`) et redirige vers `/login` sinon.
- L'app est **multi-utilisateur** : chaque modèle porte un `userId` et les requêtes sont scopées au compte connecté (`getCurrentUserId`).

## Internationalisation

- **FR par défaut**, **EN** disponible — la devise reste **EUR** (pas de conversion).
- **next-intl 4 sans routing** : la locale n'est pas dans l'URL, elle est résolue par requête (cookie `NEXT_LOCALE` → préférence DB `UserSettings.locale` → défaut `fr`).
- Tous les textes visibles passent par i18n (`src/locales/{fr,en}.json`, namespacés). Un test de parité garantit l'égalité des clés FR/EN.

## Modèle de données

Huit modèles Prisma (`prisma/schema.prisma`). Les montants sont en `Decimal(12, 2)` (Postgres `NUMERIC`) — **jamais** de `Float`, pour une précision exacte sur les sommes et ratios.

| Modèle | Rôle |
| --- | --- |
| `User` | Compte (email, `passwordHash`) ; possède toutes les données liées |
| `UserSettings` | Préférences par compte (thème, langue, flag d'onboarding) |
| `Income` | Revenus mensuels (`source`, `amount`, `month` au format `YYYY-MM`) |
| `Expense` | Dépenses (`amount`, `category`, `subcategory`, `date`, liens optionnels vers `Budget` / `RecurringExpense`) |
| `Budget` | Objectifs personnalisés (`name`, `targetAmount`, `category`, `deadline?`) |
| `MonthlyPeriod` | Cycle budgétaire : report (`carryIn` / `carryOut`) et état ouvert/clôturé (`closedAt`) |
| `RecurringExpense` | Modèle récurrent (`FIXED` auto-matérialisé / `VARIABLE` à confirmer), fréquence & ancrage |
| `RecurringOccurrence` | Échéance d'un modèle pour un mois donné (`APPLIED` / `PENDING` / `CONFIRMED` / `DROPPED`) |

### Catégories & sous-catégories

Les **clés sont stables et en anglais** ; les **libellés passent par l'i18n** (FR/EN). La taxonomie est la source de vérité unique, réutilisée par le seed et les formulaires :

- **Catégories** (`src/lib/categories.ts`) : `essential` · `leisure` · `savings` (avec part 50/30/20 et classes de tokens UI).
- **Sous-catégories** (`src/lib/subcategories.ts`) : entrées typées réparties par catégorie, avec les helpers `SUBCATEGORIES`, `ALL_SUBCATEGORIES`, `SUBCATEGORY_KEYS` et `isValidSubcategory(category, key)`.

En base, `Expense.subcategory` stocke la **clé** de sous-catégorie.

## Seed de démo

`npm run db:seed` (`prisma/seed.ts`) produit un dataset réaliste pour la présentation. Il est **idempotent** (reset des tables démo puis insertion) et ne s'exécute **que contre koza-dev**, jamais la prod :

- 1 compte de démo (`demo@koza.app` / `demo1234`) propriétaire de toute la data ;
- 4 revenus (salaire sur 3 mois + un extra freelance sur le mois courant) ;
- ~18 dépenses réparties sur 3 mois, sous-catégories variées, dont 2 rattachées à un budget ;
- 2 budgets avec progression partielle (« Vacances Grèce », « Fonds d'urgence ») ;
- des `MonthlyPeriod` clôturés sur les mois précédents avec léger surplus/déficit ;
- 3 dépenses récurrentes (dont une variable « Électricité » avec une occurrence à confirmer) ;
- `UserSettings` avec `onboardingCompleted: true` (`DEMO_ONBOARDING=fresh` pour le remettre à `false`).

Les mois sont calculés à partir de la date courante, donc le dataset reste cohérent quel que soit le jour d'exécution.

## Structure du projet

```text
src/
  app/
    (auth)/         # login, signup
    (onboarding)/   # welcome, setup, confirm
    (main)/         # dashboard, expenses, budgets, recurring, incomes, settings
    api/            # Route Handlers (health, incomes, expenses, budgets, recurring, settings…)
    layout.tsx · globals.css
  components/       # dashboard, expenses, budgets, charts, nav, notifications, onboarding, recurring, settings, ui, auth
  lib/             # logique métier (budget, period, recurring, notifications, formatters, validators, prisma…)
  i18n/ · locales/ # configuration next-intl & catalogues FR/EN
  generated/       # client Prisma généré (gitignoré)
middleware.ts      # protection des routes (Auth.js, Edge-safe)
prisma/
  schema.prisma · migrations/ · seed.ts
docs/              # specs & plans d'implémentation (historique)
```

## Tests

- **Unitaire / intégration** (`npm run test`, Vitest) : logique 50/30/20, report, seuils de notification, validators Zod, formatters, Route Handlers (Prisma mocké), composants (Testing Library + helper `renderWithIntl`).
- **E2E** (`npm run test:e2e`, Playwright).
- **CI** (GitHub Actions) : `lint` + `build` à chaque push ; tests unit/intégration/E2E sur PR vers `main`. Tous les checks doivent être verts pour merger.

## Déploiement

Hébergé sur **Vercel** (intégration Git). Deux bases Prisma Postgres isolées : `koza-dev` (dev local) et `koza-prod` (production). Les migrations de prod sont appliquées via `.github/workflows/deploy.yml` (`migrate deploy`) au merge sur `main` ; jamais de `migrate dev` ni de `db seed` contre la prod. `AUTH_SECRET` et `DATABASE_URL` (prod) sont définis dans les variables d'environnement Vercel.
