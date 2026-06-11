# Multi-tenant data layer (sous-projet #2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Cloisonner toutes les données par `userId` (modèle `User` + `userId` sur 6 modèles + scoping de toutes les fonctions/routes), avec un `getCurrentUserId()` **stub** (remplacé par `auth()` en #3) pour rester testable et exécutable sans UI d'auth.

**Architecture:** `userId` threadé en **premier paramètre** de chaque fonction data de `lib/`. Routes/pages/actions appellent `getCurrentUserId()` puis passent le `userId`. Migration **destructive** (TRUNCATE) car la prod est quasi vide. Le seed crée un utilisateur démo (avec mot de passe hashé bcrypt, prêt pour #3).

**Tech Stack:** Prisma 7, `bcryptjs`, Vitest.

---

## Conventions

- Branche **`feat/multi-tenant-data`** (déjà créée depuis `main`). Conventional Commits anglais, scope `db`/`lib`/`api`. Pas de `Co-authored-by`. Merge manuel.
- Avant chaque commit : `npm run format`, `npm run lint`, `npm run test` verts ; `DATABASE_URL=…build npm run build`.
- **[DB — utilisateur]** : `db:migrate` et `db:seed` nécessitent la DB dev du mainteneur.

## Nouvelles signatures `lib/` (userId en 1er param)

- `getCurrentUserId(): Promise<string>` (nouveau, `src/lib/current-user.ts`)
- `listMonthIncomes(userId, month)` · `listMonthExpenses(userId, month)` · `listBudgetsWithSpent(userId)`
- `getMonthlySummary(userId, month)` · `isMonthOpen(userId, month)` · `reconcile(userId, today)`
- `materializeRecurring(userId, month)` · `getOrCreateDefaultSettings(userId)` · `getOnboardingCompleted(userId)` · `buildExport(userId)`
- `deriveNotifications(summary, budgets)` **inchangée** (pure, déjà scopée via ses entrées).

---

## Phase A — Schéma, migration, stub, seed

### Task 1 : Schéma Prisma (User + userId partout)

**Files:** Modify `prisma/schema.prisma`

- [ ] **Step 1 : Ajouter `User`, réécrire `UserSettings`, ajouter `userId`**

Ajouter le modèle `User` et réécrire `UserSettings` :
```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  settings     UserSettings?
  incomes      Income[]
  expenses     Expense[]
  budgets      Budget[]
  periods      MonthlyPeriod[]
  recurring    RecurringExpense[]
  occurrences  RecurringOccurrence[]
}

model UserSettings {
  userId              String  @id
  user                User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  theme               String  @default("light")
  locale              String  @default("fr")
  onboardingCompleted Boolean @default(false)
}
```

Sur **`Income`, `Expense`, `Budget`, `MonthlyPeriod`, `RecurringExpense`, `RecurringOccurrence`**, ajouter :
```prisma
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
```
Sur `MonthlyPeriod` : remplacer `month String @unique` par `month String` + `@@unique([userId, month])`.
(`RecurringOccurrence` garde `@@unique([recurringId, month])`.)

- [ ] **Step 2 : Régénérer le client + typecheck**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: échoue côté **type** dans tout le code qui ne passe pas encore `userId` — **attendu**, corrigé phases B/C. Vérifier que `prisma generate` produit le type `User`.

- [ ] **Step 3 : [DB — utilisateur] Créer la migration destructive**

Run (mainteneur) : `npm run db:migrate -- --name add_users_multitenant`
Prisma signalera une perte de données (colonnes NOT NULL ajoutées sur tables non vides) → accepter le reset en dev. **Éditer le SQL généré** pour préfixer, avant les `ALTER TABLE … ADD COLUMN "userId"`, un :
```sql
TRUNCATE TABLE "RecurringOccurrence","Expense","RecurringExpense","Budget","Income","MonthlyPeriod","UserSettings" RESTART IDENTITY CASCADE;
```
(garantit l'application sans erreur sur prod via `migrate deploy`, prod étant quasi vide).

- [ ] **Step 4 : Commit** (schéma + migration)
```bash
npm run format
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add User model and userId on all data tables"
```

### Task 2 : Dépendance bcrypt + `getCurrentUserId` stub

**Files:** Create `src/lib/current-user.ts` ; Modify `package.json`

- [ ] **Step 1 : Installer bcryptjs**
```bash
npm install bcryptjs && npm install -D @types/bcryptjs
```

- [ ] **Step 2 : Implémenter le stub** — `src/lib/current-user.ts` :
```ts
import { prisma } from "@/lib/prisma";

// Stub temporaire (sous-projet #2) : renvoie l'utilisateur de démo (le 1er créé).
// Remplacé par auth() (Auth.js) au sous-projet #3.
export async function getCurrentUserId(): Promise<string> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("no_current_user");
  return user.id;
}
```

- [ ] **Step 3 : Commit**
```bash
npm run format && npm run lint
git add src/lib/current-user.ts package.json package-lock.json
git commit -m "feat(auth): add bcryptjs and getCurrentUserId stub"
```

### Task 3 : Seed avec utilisateur démo

**Files:** Modify `prisma/seed.ts`

- [ ] **Step 1 : Créer un user démo + attacher `userId` partout**

En tête du `main()`, après les `deleteMany` (ajouter `await prisma.user.deleteMany();` en dernier — cascade) :
```ts
import bcrypt from "bcryptjs";
// …
const demo = await prisma.user.create({
  data: {
    email: "demo@koza.app",
    passwordHash: await bcrypt.hash("demo1234", 10),
    settings: {
      create: {
        theme: "light",
        locale: "fr",
        onboardingCompleted: process.env.DEMO_ONBOARDING !== "fresh",
      },
    },
  },
});
```
Puis ajouter `userId: demo.id` à **chaque** `create`/`createMany` de `income`, `expense`, `budget`, `monthlyPeriod`, `recurringExpense`, `recurringOccurrence`. Supprimer l'ancien bloc `userSettings.upsert({ where: { id: "default" } … })` (les settings sont créées via `demo`). Adapter le `deleteMany` final (les `userSettings.deleteMany` deviennent inutiles — cascade via user).

- [ ] **Step 2 : [DB — utilisateur] Lancer le seed** : `npm run db:seed` → 1 user démo + sa data.

- [ ] **Step 3 : Build (typecheck seed)**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
```
Expected: le seed compile (le reste du build échoue encore sur les libs/routes non scopées — OK).

- [ ] **Step 4 : Commit**
```bash
npm run format
git add prisma/seed.ts
git commit -m "feat(db): seed a demo user owning all demo data"
```

---

## Phase B — Scoping des fonctions `lib/`

> Pour chaque fonction : ajouter `userId: string` en 1er param, ajouter `userId` dans les `where`/`data`. Mettre à jour le test associé (les tests mockent prisma ; ajouter `userId` aux appels et, si l'assertion vérifie le `where`, y inclure `userId`).

### Task 4 : `incomes` / `expenses` / `budgets`

**Files:** Modify `src/lib/incomes.ts`, `src/lib/expenses.ts`, `src/lib/budgets.ts` (+ tests)

- [ ] **Step 1 :**
```ts
// incomes.ts
export function listMonthIncomes(userId: string, month: string): Promise<Income[]> {
  return prisma.income.findMany({ where: { userId, month }, orderBy: { createdAt: "asc" } });
}
// expenses.ts
export function listMonthExpenses(userId: string, month: string): Promise<Expense[]> {
  return prisma.expense.findMany({ where: { userId, month }, orderBy: { date: "desc" } });
}
// budgets.ts : listBudgetsWithSpent(userId) → findMany({ where: { userId }, include: { expenses: { select: { amount: true } } }, … })
```
Adapter `src/lib/incomes.test.ts`, `expenses.test.ts`, `budgets.test.ts` (passer un `userId` factice aux appels ; inclure `userId` dans les `where` attendus si vérifiés).

- [ ] **Step 2 :** `npm run test -- src/lib/incomes src/lib/expenses src/lib/budgets` → PASS. Commit `feat(lib): scope incomes, expenses, budgets by user`.

### Task 5 : `dashboard` / `period-guard`

**Files:** Modify `src/lib/dashboard.ts`, `src/lib/period-guard.ts` (+ tests)

- [ ] **Step 1 :**
```ts
// period-guard.ts
export async function isMonthOpen(userId: string, month: string): Promise<boolean> {
  const period = await prisma.monthlyPeriod.findUnique({
    where: { userId_month: { userId, month } },
  });
  return !period?.closedAt;
}
// dashboard.ts : getMonthlySummary(userId, month)
//   listMonthIncomes(userId, month), listMonthExpenses(userId, month),
//   prisma.monthlyPeriod.findUnique({ where: { userId_month: { userId, month } } })
```
Adapter `dashboard.test.ts` (mock `listMonthIncomes`/`listMonthExpenses` + `monthlyPeriod.findUnique`) et `period-guard.test.ts` (le mock `findUnique` ; l'argument `where` devient `userId_month`).

- [ ] **Step 2 :** `npm run test -- src/lib/dashboard src/lib/period-guard` → PASS. Commit `feat(lib): scope monthly summary and month guard by user`.

### Task 6 : `recurring` / `period`

**Files:** Modify `src/lib/recurring.ts`, `src/lib/period.ts` (+ tests)

- [ ] **Step 1 : `recurring.ts`** — `materializeRecurring(userId, month)` :
  - `recurringExpense.findMany({ where: { userId, active: true } })`
  - `expense.create({ data: { …, userId, recurringId: model.id } })`
  - `recurringOccurrence.create({ data: { userId, recurringId: model.id, month, status, expenseId? } })`
  - (le `findUnique({ where: { recurringId_month } })` reste — recurringId est déjà du user)

- [ ] **Step 2 : `period.ts`** — `reconcile(userId, today)` + `frozenCarryOut(userId, month, carryIn)` :
  - `income.findMany({ where: { userId, month } })`, `expense.findMany({ where: { userId, month } })`
  - `monthlyPeriod.findFirst({ where: { userId }, orderBy: { month: "desc" } })`
  - `monthlyPeriod.create({ data: { userId, month, carryIn } })`
  - `recurringOccurrence.updateMany({ where: { userId, month, status: "PENDING" }, … })`
  - `materializeRecurring(userId, current/next)`

- [ ] **Step 3 :** adapter `recurring.test.ts`, `period.test.ts` (mocks : ajouter `userId` aux appels et aux `where`/`data` attendus). `npm run test -- src/lib/recurring src/lib/period` → PASS. Commit `feat(lib): scope recurring and reconcile by user`.

### Task 7 : `settings` / `export`

**Files:** Modify `src/lib/settings.ts`, `src/lib/export.ts` (+ test export si présent)

- [ ] **Step 1 : `settings.ts`** :
```ts
export async function getOrCreateDefaultSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}
export async function getOnboardingCompleted(userId: string): Promise<boolean> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return settings?.onboardingCompleted ?? false;
}
```

- [ ] **Step 2 : `export.ts`** — `buildExport(userId)` : `income/expense/budget.findMany({ where: { userId }, … })`, `userSettings.findUnique({ where: { userId } })`.

- [ ] **Step 3 :** adapter `export.test.ts` si existant. `npm run test -- src/lib/settings src/lib/export` → PASS. Commit `feat(lib): scope settings and export by user`.

---

## Phase C — Scoping routes / pages / actions

> **Recette :** en tête de chaque handler/page/action server, `const userId = await getCurrentUserId();` (import `@/lib/current-user`). Passer `userId` aux fonctions lib et l'inclure dans les `prisma.*.create({ data: { …, userId } })` directs. Pour les routes `[id]` (update/delete), inclure `userId` dans le `where` (`updateMany`/`deleteMany` scopé, ou `findFirst({ where: { id, userId } })` avant l'action) pour empêcher d'agir sur la data d'autrui → 404 si non trouvé.

### Task 8 : Routes API (12) + tests

**Files:** Modify `src/app/api/{incomes,expenses,budgets,recurring}/route.ts` + `[id]/route.ts`, `recurring/occurrences/[id]/confirm/route.ts`, `settings/route.ts`, `export/route.ts` (+ leurs tests)

- [ ] **Step 1 :** Appliquer la recette à chaque route :
  - **GET/POST collection** : `userId` → passer aux `list*`/`isMonthOpen` ; `create({ data: { …, userId } })`.
  - **PUT/DELETE `[id]`** : scoper par `userId`. Ex. update : `prisma.expense.updateMany({ where: { id, userId }, data })` puis 404 si `count === 0` ; ou `findFirst({ where: { id, userId } })` → 404, sinon `update`. DELETE idem. Charger l'existant pour `isMonthOpen(userId, existing.month)`.
  - **confirm occurrence** : `findUnique({ where: { id }, include: { recurring: true } })` puis vérifier `occurrence.userId === userId` (404 sinon) ; `expense.create({ data: { …, userId } })`.
  - **settings PATCH** : `userSettings.update({ where: { userId }, … })`.
  - **export GET** : `buildExport(userId)`.

- [ ] **Step 2 :** Adapter **tous les tests de routes** : mocker `getCurrentUserId` —
```ts
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: vi.fn().mockResolvedValue("u1") }));
```
et ajouter `userId: "u1"` aux assertions `prisma.*.create` / `where` attendues. Ajouter le mock `prisma.user.findFirst` n'est pas nécessaire (getCurrentUserId est mocké).

- [ ] **Step 3 :** `npm run test -- src/app/api` → PASS. Build. Commit `feat(api): scope all routes by current user`.

### Task 9 : Pages serveur + server actions

**Files:** Modify `src/app/(main)/{dashboard,incomes,expenses,budgets,recurring,settings}/page.tsx`, `src/app/(onboarding)/confirm/page.tsx`, `src/app/(main)/layout.tsx`, `src/app/(onboarding)/layout.tsx`, `src/app/actions/reconcile.ts`, `src/app/actions/locale.ts`

- [ ] **Step 1 :** Recette sur chaque page/action :
  - Pages data (`dashboard`, `incomes`, `expenses`, `budgets`, `recurring`) : `const userId = await getCurrentUserId();` puis `getMonthlySummary(userId, month)`, `listBudgetsWithSpent(userId)`, `listMonth*(userId, month)`, `prisma.recurringExpense.findMany({ where: { userId } })`, `prisma.recurringOccurrence.findMany({ where: { userId, month, status: "PENDING" }, … })`, etc.
  - `(main)/layout.tsx` & `(onboarding)/layout.tsx` : `getOnboardingCompleted(userId)`.
  - `confirm/page.tsx` : `prisma.income.findMany({ where: { userId, month } })`.
  - `actions/reconcile.ts` : `reconcile(await getCurrentUserId(), new Date())`.
  - `actions/locale.ts` : `userSettings.upsert({ where: { userId }, update: { locale }, create: { userId, locale } })` (au lieu de `id: "default"`).
  - `resolveLocale` (`src/i18n/locale.ts`) : remplacer la lecture `userSettings.findUnique({ where: { id: "default" } })` par : si un user courant existe, lire ses settings ; sinon cookie/défaut. **Note #2** : `getCurrentUserId` lève si pas de user → entourer d'un `try/catch` renvoyant le défaut (en #3, basé sur la session). Implémentation #2 :
    ```ts
    try {
      const userId = await getCurrentUserId();
      const settings = await prisma.userSettings.findUnique({ where: { userId } });
      if (isLocale(settings?.locale)) return settings.locale;
    } catch { /* pas de user → défaut */ }
    ```

- [ ] **Step 2 :** Build (typecheck) + `npm run test` complet → PASS. Commit `feat(app): scope pages and actions by current user`.

---

## Phase D — Isolation & vérification

### Task 10 : Test d'isolation + vérif finale

**Files:** Create `src/lib/isolation.test.ts`

- [ ] **Step 1 : Test d'isolation** (prisma mocké) — vérifier qu'un appel `listMonthExpenses("u1", "2026-06")` filtre bien `where: { userId: "u1" }` (un user ne requête jamais sans son `userId`). Exemple :
```ts
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: { expense: { findMany: vi.fn().mockResolvedValue([]) } } }));
import { listMonthExpenses } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
describe("scoping", () => {
  it("filters expenses by userId", async () => {
    await listMonthExpenses("u1", "2026-06");
    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1", month: "2026-06" } }),
    );
  });
});
```

- [ ] **Step 2 : Vérif complète**
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: tout vert.

- [ ] **Step 3 : [DB — utilisateur] Vérif manuelle** : `npm run db:reset` puis `npm run dev` → l'app fonctionne via le user démo (dashboard, CRUD, reconcile) ; tout est rattaché au user démo.

- [ ] **Step 4 : Push & PR**
```bash
git push -u origin feat/multi-tenant-data
gh pr create --base main --head feat/multi-tenant-data \
  --title "feat(db): partition all data by user (multi-tenant layer)" \
  --body "Sous-projet #2 du design auth : ajoute le modèle User + userId sur les 6 modèles de données, migration destructive (TRUNCATE, prod quasi vide), et scope TOUTES les fonctions lib + routes + pages + actions par userId. Le userId courant vient d'un stub getCurrentUserId() (1er user) — remplacé par auth() au sous-projet #3. Seed crée un user démo (demo@koza.app / demo1234, bcrypt). Tests adaptés + test d'isolation. PAS encore d'UI de login."
```
- [ ] **Step 5 :** Ne pas merger — mainteneur.

---

## Self-Review

- §Modèle cible (User, UserSettings per-user, userId ×6, @@unique([userId,month])) → Task 1 ✅
- §Migration propre destructive → Task 1 Step 3 (TRUNCATE) ✅
- §Scoping (userId 1er param, toutes les fonctions) → Tasks 4-7 ✅ ; routes/pages/actions → Tasks 8-9 ✅
- §Stub getCurrentUserId → Task 2 ✅ ; remplacé en #3 (hors scope ici) ✅
- §Tests adaptés + isolation → Tasks 4-9 (tests) + Task 10 ✅
- §Seed user démo (bcrypt, prêt #3) → Task 3 ✅

**Placeholders intentionnels :** Tasks 8-9 (routes/pages) utilisent la **recette** + signatures exactes plutôt que le diff intégral de chaque fichier (mécanique répétitive, chaque fichier est petit). Les signatures lib (Phase B) sont données en entier.

**Cohérence des types :** `userId: string` en 1er param partout (Phase B) ⇔ appels `getCurrentUserId()` (Phase C). `userId_month` (Task 1 `@@unique`) ⇔ `findUnique({ where: { userId_month } })` (Tasks 5, 6). `getCurrentUserId` (Task 2) consommé par toutes les routes/pages (Tasks 8-9) et `resolveLocale` (Task 9).
