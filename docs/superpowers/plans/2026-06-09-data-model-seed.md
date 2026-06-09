# kōza — Couche données + seed de démo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter les 4 modèles métier Prisma (`Income`, `Expense`, `Budget`, `MonthlyBalance`) + migration, une taxonomie de sous-catégories typée et testée, et un seed de démo riche et idempotent — pour débloquer les features UI et la démo de vendredi.

**Architecture:** Les modèles sont déclarés verbatim depuis CLAUDE.md dans `prisma/schema.prisma` (montants `Decimal(12,2)`). La taxonomie de sous-catégories vit dans `src/lib/subcategories.ts` (clé anglaise, label français), source de vérité unique réutilisée par le seed et les futurs formulaires. Le seed (`prisma/seed.ts`) est idempotent par reset + insert et ne tourne que contre koza-dev.

**Tech Stack:** Prisma 7 (`prisma-client` generator, adapter `@prisma/adapter-pg`), TypeScript strict, Vitest, tsx (runner du seed).

---

## Conventions pour chaque commit de ce plan

- Branche : **`feat/data-model-seed`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, impératif, minuscules, sans point final, ≤72 car., scope dans (`db`, `seed`).
- **Aucun trailer `Co-authored-by`.** Merge commit, pas de squash. PR ouverte via `gh`, merge manuel par le mainteneur.
- `npm run lint` + `npm run test` au vert avant chaque commit (`npm run format` si prettier râle).
- Le seed et les migrations s'exécutent contre **koza-dev** via le `DATABASE_URL` du `.env` local. Jamais contre la prod.

## File Structure

- `prisma/schema.prisma` — **modifier** : ajouter `Income`, `Expense`, `Budget`, `MonthlyBalance`.
- `prisma/migrations/<timestamp>_add_budget_domain_models/migration.sql` — **créé** par `prisma migrate dev`.
- `src/lib/subcategories.ts` — **créer** : taxonomie typée + helpers.
- `src/lib/subcategories.test.ts` — **créer** : tests unitaires de la taxonomie.
- `prisma/seed.ts` — **réécrire** : seed de démo idempotent.

---

### Task 1: Modèles Prisma + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_budget_domain_models/migration.sql` (généré)

- [ ] **Step 1: Ajouter les 4 modèles au schéma**

Dans `prisma/schema.prisma`, à la suite du modèle `UserSettings` existant, ajouter :

```prisma
model Income {
  id        String   @id @default(cuid())
  source    String
  amount    Decimal  @db.Decimal(12, 2)
  month     String // "YYYY-MM"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Expense {
  id          String   @id @default(cuid())
  amount      Decimal  @db.Decimal(12, 2)
  description String
  date        DateTime
  category    String // 'essential' | 'leisure' | 'savings'
  subcategory String // clé de sous-catégorie (cf. src/lib/subcategories.ts)
  budgetId    String?
  budget      Budget?  @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Budget {
  id           String    @id @default(cuid())
  name         String
  targetAmount Decimal   @db.Decimal(12, 2)
  category     String // 'essential' | 'leisure' | 'savings'
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

- [ ] **Step 2: Générer et appliquer la migration**

Run: `npx prisma migrate dev --name add_budget_domain_models`
Expected: une migration `prisma/migrations/<timestamp>_add_budget_domain_models/migration.sql` est créée et appliquée à koza-dev ; le client Prisma est régénéré dans `src/generated/prisma` (gitignoré). Aucune erreur.

- [ ] **Step 3: Vérifier le SQL généré**

Run: `cat prisma/migrations/*_add_budget_domain_models/migration.sql`
Expected: `CREATE TABLE "Income"`, `"Expense"`, `"Budget"`, `"MonthlyBalance"` ; une contrainte FK `Expense.budgetId → Budget(id)` en `ON DELETE SET NULL` ; un index unique sur `MonthlyBalance(month)`.

- [ ] **Step 4: Vérifier que le projet compile avec les nouveaux types**

Run: `npm run build`
Expected: build OK (le client régénéré expose `prisma.income`, `prisma.expense`, `prisma.budget`, `prisma.monthlyBalance` ; aucun consommateur encore, donc compilation triviale).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add income, expense, budget and monthly balance models"
```

---

### Task 2: Taxonomie sous-catégories + tests

**Files:**
- Create: `src/lib/subcategories.ts`
- Create: `src/lib/subcategories.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/subcategories.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { CATEGORY_ORDER } from "@/lib/categories";
import {
  SUBCATEGORIES,
  ALL_SUBCATEGORIES,
  SUBCATEGORY_KEYS,
  isValidSubcategory,
} from "@/lib/subcategories";

describe("subcategories", () => {
  it("tags every subcategory with its owning category", () => {
    for (const category of CATEGORY_ORDER) {
      for (const sub of SUBCATEGORIES[category]) {
        expect(sub.category).toBe(category);
      }
    }
  });

  it("has 17 unique keys across all categories", () => {
    expect(ALL_SUBCATEGORIES).toHaveLength(17);
    expect(SUBCATEGORY_KEYS.size).toBe(17);
  });

  it("validates a key against its own category", () => {
    expect(isValidSubcategory("essential", "housing")).toBe(true);
    expect(isValidSubcategory("savings", "etf")).toBe(true);
  });

  it("rejects a key from another category or an unknown key", () => {
    expect(isValidSubcategory("essential", "etf")).toBe(false);
    expect(isValidSubcategory("leisure", "does_not_exist")).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/subcategories.test.ts`
Expected: FAIL — module `@/lib/subcategories` introuvable.

- [ ] **Step 3: Implémenter la taxonomie**

`src/lib/subcategories.ts` :

```ts
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface SubcategoryConfig {
  key: string;
  label: string;
  category: CategoryKey;
}

export const SUBCATEGORIES: Record<CategoryKey, SubcategoryConfig[]> = {
  essential: [
    { key: "housing", label: "Logement", category: "essential" },
    { key: "food", label: "Alimentation", category: "essential" },
    { key: "transport", label: "Transports", category: "essential" },
    { key: "health", label: "Santé", category: "essential" },
    { key: "insurance", label: "Assurances", category: "essential" },
    { key: "bills", label: "Factures", category: "essential" },
  ],
  leisure: [
    { key: "restaurants", label: "Restaurants", category: "leisure" },
    { key: "outings", label: "Sorties", category: "leisure" },
    { key: "vacations", label: "Vacances", category: "leisure" },
    { key: "sport", label: "Sport", category: "leisure" },
    { key: "games", label: "Jeux vidéo", category: "leisure" },
    { key: "culture", label: "Culture", category: "leisure" },
  ],
  savings: [
    { key: "savings_account", label: "Livret d'épargne", category: "savings" },
    { key: "etf", label: "ETF", category: "savings" },
    { key: "stocks", label: "Actions", category: "savings" },
    { key: "real_estate", label: "Immobilier", category: "savings" },
    { key: "emergency_fund", label: "Fonds d'urgence", category: "savings" },
  ],
};

export const ALL_SUBCATEGORIES: SubcategoryConfig[] = CATEGORY_ORDER.flatMap(
  (key) => SUBCATEGORIES[key],
);

export const SUBCATEGORY_KEYS: Set<string> = new Set(ALL_SUBCATEGORIES.map((sub) => sub.key));

export function isValidSubcategory(category: CategoryKey, key: string): boolean {
  return SUBCATEGORIES[category].some((sub) => sub.key === key);
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/subcategories.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Lint + commit**

Run: `npm run lint`
Expected: clean (sinon `npm run format`).

```bash
git add src/lib/subcategories.ts src/lib/subcategories.test.ts
git commit -m "feat(db): add typed subcategory taxonomy"
```

---

### Task 3: Seed de démo idempotent

**Files:**
- Modify (réécriture complète) : `prisma/seed.ts`

> Le seed n'importe pas la lib (pour éviter la résolution d'alias `@/` sous tsx) : les clés de sous-catégorie sont des littéraux qui **doivent** correspondre à `src/lib/subcategories.ts` (vérifié par la taxonomie de Task 2).

- [ ] **Step 1: Réécrire le seed**

Remplacer **tout** le contenu de `prisma/seed.ts` par :

```ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const now = new Date();

// "YYYY-MM" pour le mois courant + `offset` mois.
function monthKey(offset: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Date d'un jour donné dans le mois courant + `offset` mois.
function dayInMonth(offset: number, day: number): Date {
  return new Date(now.getFullYear(), now.getMonth() + offset, day);
}

// Dernier jour du mois courant + `offset` mois.
function lastDayOfMonth(offset: number): Date {
  return new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
}

async function main() {
  // Reset des tables démo (ordre FK-safe). Ne tourne que contre koza-dev.
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.income.deleteMany();
  await prisma.monthlyBalance.deleteMany();

  // Budgets (créés d'abord pour récupérer leurs ids et y rattacher des dépenses).
  const vacances = await prisma.budget.create({
    data: {
      name: "Vacances Grèce",
      targetAmount: "1200.00",
      category: "leisure",
      deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1),
    },
  });
  const fondsUrgence = await prisma.budget.create({
    data: {
      name: "Fonds d'urgence",
      targetAmount: "3000.00",
      category: "savings",
    },
  });

  // Revenus : salaire sur 3 mois + un extra freelance sur le mois courant.
  await prisma.income.createMany({
    data: [
      { source: "Salaire", amount: "2500.00", month: monthKey(-2) },
      { source: "Salaire", amount: "2500.00", month: monthKey(-1) },
      { source: "Salaire", amount: "2500.00", month: monthKey(0) },
      { source: "Freelance", amount: "400.00", month: monthKey(0) },
    ],
  });

  // 18 dépenses réalistes réparties sur 3 mois. Montants en strings (pas de float).
  await prisma.expense.createMany({
    data: [
      // Mois -2
      { amount: "850.00", description: "Loyer", date: dayInMonth(-2, 3), category: "essential", subcategory: "housing" },
      { amount: "320.50", description: "Courses Carrefour", date: dayInMonth(-2, 12), category: "essential", subcategory: "food" },
      { amount: "75.00", description: "Électricité", date: dayInMonth(-2, 8), category: "essential", subcategory: "bills" },
      { amount: "48.90", description: "Restaurant italien", date: dayInMonth(-2, 15), category: "leisure", subcategory: "restaurants" },
      { amount: "24.00", description: "Cinéma", date: dayInMonth(-2, 20), category: "leisure", subcategory: "culture" },
      { amount: "400.00", description: "Virement Livret A", date: dayInMonth(-2, 28), category: "savings", subcategory: "savings_account" },
      // Mois -1
      { amount: "850.00", description: "Loyer", date: dayInMonth(-1, 3), category: "essential", subcategory: "housing" },
      { amount: "295.00", description: "Courses", date: dayInMonth(-1, 10), category: "essential", subcategory: "food" },
      { amount: "75.00", description: "Abonnement transports", date: dayInMonth(-1, 5), category: "essential", subcategory: "transport" },
      { amount: "65.00", description: "Concert", date: dayInMonth(-1, 18), category: "leisure", subcategory: "outings" },
      { amount: "35.00", description: "Salle de sport", date: dayInMonth(-1, 2), category: "leisure", subcategory: "sport" },
      { amount: "300.00", description: "Achat ETF World", date: dayInMonth(-1, 25), category: "savings", subcategory: "etf" },
      // Mois courant
      { amount: "850.00", description: "Loyer", date: dayInMonth(0, 3), category: "essential", subcategory: "housing" },
      { amount: "180.40", description: "Courses", date: dayInMonth(0, 7), category: "essential", subcategory: "food" },
      { amount: "32.50", description: "Pharmacie", date: dayInMonth(0, 8), category: "essential", subcategory: "health" },
      { amount: "59.99", description: "Jeu vidéo", date: dayInMonth(0, 9), category: "leisure", subcategory: "games" },
      { amount: "250.00", description: "Acompte hôtel Santorin", date: dayInMonth(0, 6), category: "leisure", subcategory: "vacations", budgetId: vacances.id },
      { amount: "200.00", description: "Épargne de précaution", date: dayInMonth(0, 4), category: "savings", subcategory: "emergency_fund", budgetId: fondsUrgence.id },
    ],
  });

  // 2 mois précédents clôturés, avec léger surplus/déficit (le mois courant reste ouvert).
  await prisma.monthlyBalance.createMany({
    data: [
      { month: monthKey(-2), carryOver: "30.00", essentialOver: "-40.00", leisureOver: "15.00", savingsOver: "0.00", closedAt: lastDayOfMonth(-2) },
      { month: monthKey(-1), carryOver: "55.00", essentialOver: "-20.00", leisureOver: "25.00", savingsOver: "-10.00", closedAt: lastDayOfMonth(-1) },
    ],
  });

  // Profil unique du MVP : onboarding marqué terminé pour la démo.
  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: { onboardingCompleted: true },
    create: { id: "default", theme: "light", locale: "fr", onboardingCompleted: true },
  });

  const [incomes, expenses, budgets] = await Promise.all([
    prisma.income.count(),
    prisma.expense.count(),
    prisma.budget.count(),
  ]);
  console.log(`Seed complete · incomes: ${incomes} · expenses: ${expenses} · budgets: ${budgets}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Lancer le seed**

Run: `npx prisma db seed`
Expected: `Seed complete · incomes: 4 · expenses: 18 · budgets: 2`, sans erreur.

- [ ] **Step 3: Vérifier l'idempotence**

Run: `npx prisma db seed`
Expected: même sortie exacte (`incomes: 4 · expenses: 18 · budgets: 2`) — le reset empêche toute duplication.

- [ ] **Step 4: Lint + commit**

Run: `npm run lint`
Expected: clean (sinon `npm run format`).

```bash
git add prisma/seed.ts
git commit -m "feat(seed): add rich idempotent demo dataset"
```

---

### Task 4: Vérification finale + PR

- [ ] **Step 1: Lint, build et suite de tests complète**

Run: `npm run lint && npm run build && npm run test`
Expected: lint clean, build OK, tous les tests au vert (dont les 4 nouveaux de `subcategories.test.ts`).

- [ ] **Step 2: Vérification manuelle du dataset (optionnel mais recommandé)**

Run: `npx prisma studio`
Expected: les tables `Income` (4), `Expense` (18), `Budget` (2), `MonthlyBalance` (2 clôturés) et `UserSettings` (`onboardingCompleted: true`) sont peuplées de façon cohérente ; 2 dépenses portent un `budgetId`. Fermer Prisma Studio.

- [ ] **Step 3: Push et ouverture de la PR**

```bash
git push -u origin feat/data-model-seed
gh pr create --base main --head feat/data-model-seed \
  --title "feat(db): add budget domain models and demo seed" \
  --body "Ajoute les modèles Prisma Income / Expense / Budget / MonthlyBalance (+ migration), une taxonomie de sous-catégories typée et testée (src/lib/subcategories.ts), et réécrit le seed de démo en un jeu de données riche et idempotent (4 revenus, 18 dépenses sur 3 mois, 2 budgets avec progression, 2 mois clôturés). Débloque l'onboarding, les CRUD et le dashboard."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge sur GitHub une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- Modèles `Income`/`Expense`/`Budget`/`MonthlyBalance` + migration → Task 1 ✅
- Config sous-catégories typée (clé EN / label FR) + helpers + tests → Task 2 ✅ (17 clés : 6+6+5)
- Seed idempotent reset+insert, mois calculés, montants strings, 2 dépenses liées aux budgets, 2 MonthlyBalance clôturés, UserSettings upsert → Task 3 ✅
- Tests unitaires `subcategories` + vérif build/types + vérif seed manuelle → Tasks 2 & 4 ✅
- Différé (Zod, lib/budget.ts, API, écrans) → hors plan, conforme au spec ✅

**Scan placeholders :** aucun TBD/TODO ; tout le code (schéma, lib, seed) est complet ; chaque step a une commande + un résultat attendu.

**Cohérence des types :**
- `CategoryKey` importé de `@/lib/categories`, réutilisé dans `SubcategoryConfig` et `SUBCATEGORIES`.
- `SUBCATEGORIES[category]` / `ALL_SUBCATEGORIES` / `SUBCATEGORY_KEYS` / `isValidSubcategory` — signatures cohérentes entre lib et test.
- Clés de sous-catégorie du seed (`housing`, `food`, `bills`, `restaurants`, `culture`, `savings_account`, `transport`, `outings`, `sport`, `etf`, `health`, `games`, `vacations`, `emergency_fund`) ⊆ clés définies dans `SUBCATEGORIES`.
- Montants toujours en **strings** vers les champs `Decimal` ; `budgetId` optionnel sur `Expense`.
```
