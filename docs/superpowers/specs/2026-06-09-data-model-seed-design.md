# kōza — Couche données + seed de démo — Design

> Spec validée le 2026-06-09. Étape #2 du build order CLAUDE.md (« Schéma Prisma + migrations + seed de démo »). Débloque l'onboarding, les revenus, les dépenses, les budgets et le dashboard.

## Objectif

Compléter la couche de données du MVP : ajouter les 4 modèles métier manquants (`Income`, `Expense`, `Budget`, `MonthlyBalance`), exposer une taxonomie de sous-catégories typée et réutilisable, et produire un seed de démo riche et déterministe pour la présentation de vendredi 13 juin 2026.

## Périmètre

**Inclus (data layer strict) :**

- Modèles Prisma `Income`, `Expense`, `Budget`, `MonthlyBalance` + migration.
- Config sous-catégories typée dans `src/lib/subcategories.ts` (avec tests unitaires).
- Réécriture du seed de démo `prisma/seed.ts` (idempotent, reset + insert).

**Différé explicitement (autres PRs) :**

- Validators Zod (`lib/validators.ts`) — viendront avec les routes API consommatrices.
- Logique 50/30/20 (`lib/budget.ts`) — viendra avec le dashboard / la logique mensuelle.
- Routes API, hooks, écrans.

## Décisions actées (brainstorming)

1. **Sous-catégories** : liste canonique typée en lib (clé anglaise, label français). En base, `Expense.subcategory` stocke la clé. Pas de table relationnelle (hors périmètre MVP mono-utilisateur).
2. **Seed idempotent** : reset des tables démo (`deleteMany`) puis insert d'un jeu propre. `UserSettings` en upsert. Ne s'exécute jamais contre la prod (CLAUDE.md : `db seed` interdit sur prod).
3. **Périmètre** : data layer strict (cf. ci-dessus).

---

## 1. Schéma Prisma

Ajout dans `prisma/schema.prisma`, conforme au modèle de CLAUDE.md. Montants en `Decimal @db.Decimal(12, 2)` (Postgres `NUMERIC`), jamais `Float`. Le bloc `datasource` reste sans `url` (Prisma 7 le résout via `prisma.config.ts`).

```prisma
model Income {
  id        String   @id @default(cuid())
  source    String
  amount    Decimal  @db.Decimal(12, 2)
  month     String   // "YYYY-MM"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Expense {
  id          String   @id @default(cuid())
  amount      Decimal  @db.Decimal(12, 2)
  description String
  date        DateTime
  category    String   // 'essential' | 'leisure' | 'savings'
  subcategory String   // clé de sous-catégorie (cf. lib/subcategories.ts)
  budgetId    String?
  budget      Budget?  @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
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

model MonthlyBalance {
  id            String    @id @default(cuid())
  month         String    @unique // "YYYY-MM"
  carryOver     Decimal   @default(0) @db.Decimal(12, 2)
  essentialOver Decimal   @default(0) @db.Decimal(12, 2)
  leisureOver   Decimal   @default(0) @db.Decimal(12, 2)
  savingsOver   Decimal   @default(0) @db.Decimal(12, 2)
  closedAt      DateTime?
}
```

**Migration** : `npx prisma migrate dev --name add_budget_domain_models` (génère le SQL contre koza-dev, écrit dans `prisma/migrations/`). Appliquée en CI via `prisma migrate deploy` (Postgres éphémère des jobs `test-integration` / `test-e2e`) et en prod via `.github/workflows/deploy.yml`.

## 2. Config sous-catégories — `src/lib/subcategories.ts`

Module séparé de `categories.ts` (qui reste focalisé sur les tokens UI). Importe `CategoryKey`.

```ts
import type { CategoryKey } from "@/lib/categories";

export interface SubcategoryConfig {
  key: string;
  label: string;
  category: CategoryKey;
}
```

Taxonomie (clé anglaise → label français) :

| Catégorie | Sous-catégories |
|---|---|
| `essential` | `housing`→Logement · `food`→Alimentation · `transport`→Transports · `health`→Santé · `insurance`→Assurances · `bills`→Factures |
| `leisure` | `restaurants`→Restaurants · `outings`→Sorties · `vacations`→Vacances · `sport`→Sport · `games`→Jeux vidéo · `culture`→Culture |
| `savings` | `savings_account`→Livret d'épargne · `etf`→ETF · `stocks`→Actions · `real_estate`→Immobilier · `emergency_fund`→Fonds d'urgence |

Exports publics :

- `SUBCATEGORIES: Record<CategoryKey, SubcategoryConfig[]>` — taxonomie par catégorie, dans l'ordre ci-dessus.
- `ALL_SUBCATEGORIES: SubcategoryConfig[]` — liste à plat (essential → leisure → savings).
- `SUBCATEGORY_KEYS: Set<string>` — toutes les clés valides.
- `isValidSubcategory(category: CategoryKey, key: string): boolean` — vrai si `key` appartient à `category`.

## 3. Seed de démo — `prisma/seed.ts`

Idempotent : reset puis insert. Conserve l'en-tête existant (adapter `@prisma/adapter-pg`, garde `DATABASE_URL`).

**Mois** calculés depuis la date courante : `current` (= mois de `new Date()`), `prev1`, `prev2` au format `YYYY-MM`. Au 2026-06-09 : `2026-06`, `2026-05`, `2026-04`.

**Ordre de reset (FK-safe)** : `expense.deleteMany` → `budget.deleteMany` → `income.deleteMany` → `monthlyBalance.deleteMany`.

**Insertion** :

1. **Budgets** (2) :
   - « Vacances Grèce » — `targetAmount "1200.00"`, `category "leisure"`, `deadline` ~ août 2026.
   - « Fonds d'urgence » — `targetAmount "3000.00"`, `category "savings"`, sans deadline.
2. **Revenus** (4) : « Salaire » `"2500.00"` sur les 3 mois + « Freelance » `"400.00"` sur le mois courant.
3. **Dépenses** (18) réparties sur les 3 mois, sous-catégories variées et cohérentes avec leur catégorie, montants en strings Decimal (ex. `"54.90"`). 2 dépenses rattachées aux budgets via `budgetId` (une vers « Vacances Grèce » en leisure/`vacations`, une vers « Fonds d'urgence » en savings/`emergency_fund`). La répartition vise grossièrement 50/30/20 avec un léger sur/sous-dépassement pour rendre les `MonthlyBalance` parlants.
4. **MonthlyBalance** (2 clôturés) : `2026-04` et `2026-05`, avec `carryOver` + `*Over` légers (quelques dizaines d'euros) et `closedAt` renseigné. Le mois courant n'a pas de `MonthlyBalance` (non clôturé).
5. **UserSettings** : upsert `id "default"`, `onboardingCompleted: true`, `theme "light"`, `locale "fr"`.

Tous les montants manipulés comme **strings** (jamais d'arithmétique flottante). Les clés de sous-catégorie utilisées dans le seed proviennent de `lib/subcategories.ts` (source de vérité unique).

**Sortie** : log récapitulatif (`Seed complete · incomes: X · expenses: Y · budgets: Z`).

## 4. Tests & vérification

- **Unit (Vitest)** — `src/lib/subcategories.test.ts` :
  - Chaque `SubcategoryConfig.category` est une clé de catégorie valide et cohérente avec sa position dans `SUBCATEGORIES`.
  - Toutes les clés sont uniques (pas de doublon inter-catégories).
  - `SUBCATEGORY_KEYS` contient exactement le bon nombre de clés (17).
  - `isValidSubcategory` : accepte une paire valide, rejette une clé d'une autre catégorie, rejette une clé inconnue.
- **Schéma / types** : couverts par `prisma generate` + `next build` (tsc strict).
- **Seed** : pas de test unitaire (script DB). Vérification manuelle dans le plan : `npx prisma db seed` contre koza-dev, doit typer et tourner sans erreur, et produire les comptes attendus.

## Critères d'acceptation

- [ ] `prisma migrate dev` génère une migration appliquable ; `prisma generate` produit le client avec les 4 modèles.
- [ ] `src/lib/subcategories.ts` exporte la taxonomie typée + helpers, tests unitaires au vert.
- [ ] `npx prisma db seed` est rejouable (run x2 → même état) et peuple un dataset de démo réaliste.
- [ ] `npm run lint`, `npm run build`, `npm run test` au vert.
- [ ] Aucun `any`, montants en `Decimal`/strings, clés de sous-catégorie issues de la lib.

## Conventions

Branche `feat/data-model-seed`. Conventional Commits (`feat(db)`, `feat(seed)`, `test(db)`), anglais, impératif, sans trailer d'attribution. Commits atomiques. PR via `gh`, merge manuel par le mainteneur.
