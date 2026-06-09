# kōza

> **kōza** (口座, « compte » en japonais) — application web de suivi de budget personnel basée sur la règle **50 / 30 / 20**.

| Catégorie | Part | Contenu |
| --- | --- | --- |
| Dépenses essentielles | 50 % | Logement, alimentation, transports, santé, assurances, factures |
| Loisirs | 30 % | Restaurants, sorties, vacances, sport, jeux vidéo, culture |
| Épargne / Investissement | 20 % | Livret, ETF, actions, immobilier, fonds d'urgence |

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** strict
- **Prisma 7** + **Prisma Postgres** (générateur `prisma-client`, driver adapter `@prisma/adapter-pg`)
- **Tailwind CSS 4** (config CSS-first via `@theme`) · **next-themes** (clair/sombre)
- **Vitest** + Testing Library (unitaire/intégration) · **Playwright** (E2E)
- **Node.js 24 LTS**

## Démarrage

```bash
# 1. Dépendances (déclenche `prisma generate` via postinstall)
npm install

# 2. Connection string de la base de dev (écrit DATABASE_URL dans .env)
npx prisma postgres link

# 3. Migrations + jeu de démo
npm run db:migrate
npm run db:seed

# 4. Serveur de dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Le `.env` (contenant `DATABASE_URL`) est gitignoré ; voir `.env.example`.

## Scripts

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build de production / démarrage |
| `npm run lint` | ESLint + Prettier (check) — `npm run format` pour corriger |
| `npm run test` / `npm run test:watch` | Tests unitaires & intégration (Vitest) |
| `npm run test:e2e` | Tests end-to-end (Playwright) |
| `npm run db:migrate` | Migration (`migrate dev`) contre **koza-dev** |
| `npm run db:seed` | Seed de démo |
| `npm run db:studio` | Prisma Studio (exploration de la base) |

## Modèle de données

Cinq modèles Prisma (`prisma/schema.prisma`). Les montants sont en `Decimal(12, 2)` (Postgres `NUMERIC`) — **jamais** de `Float`, pour une précision exacte sur les sommes et ratios.

| Modèle | Rôle |
| --- | --- |
| `Income` | Revenus mensuels (`source`, `amount`, `month` au format `YYYY-MM`) |
| `Expense` | Dépenses (`amount`, `category`, `subcategory`, `date`, lien optionnel vers un `Budget`) |
| `Budget` | Objectifs personnalisés (`name`, `targetAmount`, `category`, `deadline?`) |
| `MonthlyBalance` | Clôture mensuelle : report (`carryOver`) et écarts par catégorie (`*Over`) |
| `UserSettings` | Profil unique du MVP (thème, langue, flag d'onboarding) |

### Catégories & sous-catégories

Les **clés sont en anglais**, les **labels en français** (l'i18n des labels viendra dans une PR dédiée). La taxonomie est la source de vérité unique, réutilisée par le seed et les futurs formulaires :

- **Catégories** (`src/lib/categories.ts`) : `essential` · `leisure` · `savings` (avec part 50/30/20 et classes de tokens UI).
- **Sous-catégories** (`src/lib/subcategories.ts`) : 17 entrées typées réparties par catégorie, plus les helpers `SUBCATEGORIES`, `ALL_SUBCATEGORIES`, `SUBCATEGORY_KEYS` et `isValidSubcategory(category, key)`.

En base, `Expense.subcategory` stocke la **clé** de sous-catégorie.

## Seed de démo

`npm run db:seed` (`prisma/seed.ts`) produit un dataset réaliste pour la présentation. Il est **idempotent** (reset des tables démo puis insertion) et ne s'exécute **que contre koza-dev**, jamais la prod :

- 4 revenus (salaire sur 3 mois + un extra freelance sur le mois courant) ;
- 18 dépenses réparties sur 3 mois, sous-catégories variées, dont 2 rattachées à un budget ;
- 2 budgets avec progression partielle (« Vacances Grèce », « Fonds d'urgence ») ;
- 2 mois précédents clôturés (`MonthlyBalance`) avec léger surplus/déficit ;
- `UserSettings` avec `onboardingCompleted: true`.

Les mois sont calculés à partir de la date courante, donc le dataset reste cohérent quel que soit le jour d'exécution.

## Structure du projet

```text
src/
  app/            # App Router (route groups, API routes, layout, globals.css)
  components/ui/  # primitives UI réutilisables (Card, Button, ProgressBar…)
  lib/            # logique partagée (prisma, categories, subcategories, cn)
  generated/      # client Prisma généré (gitignoré)
prisma/
  schema.prisma   # modèle de données
  migrations/     # migrations versionnées
  seed.ts         # seed de démo
docs/             # specs & plans d'implémentation
```

## Déploiement

Hébergé sur **Vercel** (intégration Git). Deux bases Prisma Postgres isolées : `koza-dev` (dev local) et `koza-prod` (production). Les migrations de prod sont appliquées via `.github/workflows/deploy.yml` (`migrate deploy`) au merge sur `main` ; jamais de `migrate dev` ni de `db seed` contre la prod.
