# kōza — Logique mensuelle & dépenses récurrentes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter le cœur report mensuel 50/30/20 (base = entrées + carryIn, `reconcile()` paresseux idempotent, mois clôturés en lecture seule) et les dépenses récurrentes (modèles, matérialisation FIXED/VARIABLE, occurrences, confirmation), intégrés au dashboard existant.

**Architecture:** Source de vérité = lignes `Income`/`Expense`. `MonthlyPeriod` ancre la chaîne de report et l'état ouvert/clôturé. Fonctions pures Decimal dans `lib/budget.ts`/`lib/month.ts` ; orchestration serveur dans `lib/period.ts` (`reconcile`) et `lib/recurring.ts` (`materializeRecurring`). `getMonthlySummary` dérive base/targets/carry. Gardes lecture seule (409) via `assertMonthOpen`. UI : report sur le dashboard, lecture seule sur mois clôturés, confirmation des variables, écran de gestion des récurrentes.

**Tech Stack:** Next 16 App Router, React 19, Prisma 7, Zod 4, Tailwind v4, Vitest + Testing Library, decimal via `Prisma.Decimal`.

---

## ⚠️ Dépendance base de données (lire avant d'exécuter)

`prisma migrate dev` et `db:seed` **se connectent à la base dev** (`DATABASE_URL`, gitignoré). L'agent qui exécute ce plan **ne peut pas** lancer ces commandes s'il n'a pas la connection string. Les étapes marquées **[DB — utilisateur]** doivent être lancées par le mainteneur dans sa session (préfixe `!` dans Claude Code), ou par l'agent s'il a `DATABASE_URL`. Tout le reste (édition schéma, `prisma generate` via `npm run build`, tests à prisma mocké, UI) ne nécessite pas de connexion.

## Conventions pour chaque commit

- Branche : **`feat/monthly-logic`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, ≤72 car., scope dans (`db`, `lib`, `api`, `dashboard`, `expenses`, `recurring`).
- Aucun trailer `Co-authored-by`. Merge commit, pas de squash. PR via `gh`, merge manuel.
- Avant chaque commit : `npm run format`, `npm run lint` (0 erreur ; warning `react-hooks/incompatible-library` pré-existant toléré), `npm run test` au vert.
- Code touchant Prisma/TS : `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build` avant de committer (régénère le client + typecheck). Routes/pages Server lisant Prisma : `export const dynamic = "force-dynamic";`.

## File Structure

- `prisma/schema.prisma` (modify) — nouveaux modèles/champs/enums.
- `src/lib/month.ts` (modify) + test — `monthDiff`.
- `src/lib/budget.ts` (modify) + test — `computeBase`, `computeTargets`, `computeCarryOut`, `isTriggerMonth`.
- `src/lib/recurring.ts` (create) + test — `materializeRecurring`.
- `src/lib/period.ts` (create) + test — `reconcile`.
- `src/lib/period-guard.ts` (create) + test — `assertMonthOpen`.
- `src/lib/dashboard.ts` (modify) + test — base/carry/closed.
- `src/lib/expenses.ts` (modify) — requête par `month`.
- `src/lib/validators.ts` (modify) + test — schémas récurrents + confirm.
- `src/app/api/incomes/route.ts`, `incomes/[id]/route.ts` (modify) — `date`, garde 409.
- `src/app/api/expenses/route.ts`, `expenses/[id]/route.ts` (modify) — `month`, garde 409.
- `src/app/api/recurring/route.ts`, `recurring/[id]/route.ts`, `recurring/occurrences/[id]/confirm/route.ts` (create) + tests.
- `src/app/actions/reconcile.ts` (create) — server action.
- `src/components/dashboard/*`, `src/components/expenses/*`, `src/components/recurring/*` — UI.
- `src/app/(main)/dashboard/page.tsx`, `expenses/page.tsx`, `recurring/page.tsx` — pages.
- `prisma/seed.ts` (modify) — seed mis à jour.

---

## Phase 0 — Schéma & migration

### Task 1: Mettre à jour le schéma Prisma

**Files:** Modify `prisma/schema.prisma`

- [ ] **Step 1: Éditer le schéma**

Dans `prisma/schema.prisma` : (a) ajouter les enums en tête (après le bloc `generator`/`datasource`) ; (b) modifier `Income`, `Expense` ; (c) **supprimer `model MonthlyBalance`** ; (d) ajouter `MonthlyPeriod`, `RecurringExpense`, `RecurringOccurrence`.

Enums (ajouter) :
```prisma
enum RecurringType {
  FIXED
  VARIABLE
}

enum Frequency {
  MONTHLY
  QUARTERLY
  YEARLY
}

enum OccurrenceStatus {
  APPLIED
  PENDING
  CONFIRMED
  DROPPED
}
```

`Income` (remplacer le modèle) :
```prisma
model Income {
  id        String   @id @default(cuid())
  source    String
  amount    Decimal  @db.Decimal(12, 2)
  date      DateTime
  month     String // "YYYY-MM"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([month])
}
```

`Expense` (remplacer le modèle) :
```prisma
model Expense {
  id          String            @id @default(cuid())
  amount      Decimal           @db.Decimal(12, 2)
  description String
  date        DateTime
  month       String // "YYYY-MM"
  category    String
  subcategory String
  budgetId    String?
  budget      Budget?           @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  recurringId String?
  recurring   RecurringExpense? @relation(fields: [recurringId], references: [id], onDelete: SetNull)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([month])
}
```

Supprimer entièrement `model MonthlyBalance { … }`. Ajouter :
```prisma
model MonthlyPeriod {
  id        String    @id @default(cuid())
  month     String    @unique // "YYYY-MM"
  carryIn   Decimal   @default(0) @db.Decimal(12, 2)
  carryOut  Decimal?  @db.Decimal(12, 2)
  closedAt  DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model RecurringExpense {
  id          String                @id @default(cuid())
  label       String
  type        RecurringType
  amount      Decimal               @db.Decimal(12, 2)
  category    String
  subcategory String
  frequency   Frequency
  anchorMonth String // "YYYY-MM"
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
```

- [ ] **Step 2: Régénérer le client + typecheck**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: échoue côté **type** dans le code existant qui référence `monthlyBalance` (seed) ou des champs manquants (`Income.date`, `Expense.month`) — c'est attendu, ces fichiers sont corrigés dans les tâches suivantes. Le `prisma generate` doit néanmoins produire les nouveaux types dans `src/generated/prisma`. **Si le build échoue uniquement sur `prisma/seed.ts` et les handlers**, c'est normal ; on les corrige en Tasks 9 et 19. Pour valider que `generate` a réussi : `node -e "const {PrismaClient}=require('./src/generated/prisma/client'); console.log(typeof new PrismaClient().monthlyPeriod)"` → `object`.

> Si l'ordre gêne le build, committer le schéma seul ici et laisser le build complet vert après la Task 9. Le client généré (`src/generated/prisma`) est gitignoré ; seul `schema.prisma` est committé.

- [ ] **Step 3: [DB — utilisateur] Créer et appliquer la migration**

Run (mainteneur, avec `DATABASE_URL` dev) :
```bash
npm run db:migrate -- --name add_monthly_logic
```
La migration doit : ajouter `Income.date` (NOT NULL — Prisma demandera une valeur par défaut ; backfill SQL `UPDATE "Income" SET "date" = to_date("month" || '-01','YYYY-MM-DD')` à insérer manuellement dans le fichier SQL avant `SET NOT NULL`), ajouter `Expense.month` (backfill `UPDATE "Expense" SET "month" = to_char("date",'YYYY-MM')`), `Expense.recurringId`, supprimer `MonthlyBalance`, créer les nouveaux modèles/enums.
Expected: migration appliquée sur `koza-dev`, client régénéré.

- [ ] **Step 4: Commit (schéma)**

```bash
npm run format
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add monthly period and recurring models"
```
(Le dossier `prisma/migrations` n'est ajouté que si la Task 1 Step 3 a été lancée ; sinon committer `schema.prisma` seul et ajouter la migration au commit quand elle existe.)

---

## Phase 1 — Fonctions pures (Decimal, sans DB)

### Task 2: `monthDiff`

**Files:** Modify `src/lib/month.ts`, Create `src/lib/month.diff.test.ts`

- [ ] **Step 1: Test qui échoue** — `src/lib/month.diff.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { monthDiff } from "@/lib/month";

describe("monthDiff", () => {
  it("counts months from a to b, signed", () => {
    expect(monthDiff("2026-01", "2026-01")).toBe(0);
    expect(monthDiff("2026-01", "2026-04")).toBe(3);
    expect(monthDiff("2026-01", "2027-03")).toBe(14);
    expect(monthDiff("2026-05", "2026-02")).toBe(-3);
  });
});
```

- [ ] **Step 2: Lancer** `npm run test -- src/lib/month.diff.test.ts` → FAIL.

- [ ] **Step 3: Implémenter** — ajouter à la fin de `src/lib/month.ts` :
```ts
// Nombre de mois signés de `a` à `b` ("YYYY-MM").
export function monthDiff(a: string, b: string): number {
  const ya = Number(a.slice(0, 4));
  const ma = Number(a.slice(5, 7));
  const yb = Number(b.slice(0, 4));
  const mb = Number(b.slice(5, 7));
  return (yb - ya) * 12 + (mb - ma);
}
```

- [ ] **Step 4: Lancer** → PASS (1 test).

- [ ] **Step 5: Commit**
```bash
npm run format && npm run lint
git add src/lib/month.ts src/lib/month.diff.test.ts
git commit -m "feat(lib): add monthDiff helper"
```

---

### Task 3: `computeBase` / `computeTargets` / `computeCarryOut`

**Files:** Modify `src/lib/budget.ts`, Create `src/lib/budget.monthly.test.ts`

- [ ] **Step 1: Test qui échoue** — `src/lib/budget.monthly.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { computeBase, computeTargets, computeCarryOut } from "@/lib/budget";

const D = (v: string) => new Prisma.Decimal(v);

describe("computeBase", () => {
  it("adds income and carryIn", () => {
    expect(computeBase(D("2500"), D("600")).toString()).toBe("3100");
    expect(computeBase(D("2500"), D("-200")).toString()).toBe("2300");
  });
});

describe("computeTargets", () => {
  it("splits the base 50/30/20", () => {
    const t = computeTargets(D("3100"));
    expect(t.essential.toString()).toBe("1550");
    expect(t.leisure.toString()).toBe("930");
    expect(t.savings.toString()).toBe("620");
  });

  it("returns zeros when base is not positive", () => {
    const t = computeTargets(D("-50"));
    expect(t.essential.toString()).toBe("0");
    expect(t.leisure.toString()).toBe("0");
    expect(t.savings.toString()).toBe("0");
  });
});

describe("computeCarryOut", () => {
  it("is base minus spent, can be negative", () => {
    expect(computeCarryOut(D("2800"), D("2200")).toString()).toBe("600");
    expect(computeCarryOut(D("2800"), D("3000")).toString()).toBe("-200");
  });
});
```

- [ ] **Step 2: Lancer** `npm run test -- src/lib/budget.monthly.test.ts` → FAIL.

- [ ] **Step 3: Implémenter** — ajouter à `src/lib/budget.ts` (sous `computeEnvelopes`) :
```ts
// Base 50/30/20 d'un mois = entrées + report entrant.
export function computeBase(income: Prisma.Decimal, carryIn: Prisma.Decimal): Prisma.Decimal {
  return income.plus(carryIn);
}

// Repères 50/30/20 dérivés de la base ; base ≤ 0 → enveloppes à 0 (jamais de négatif).
export function computeTargets(base: Prisma.Decimal): Envelopes {
  if (base.lte(0)) {
    return { essential: new Prisma.Decimal(0), leisure: new Prisma.Decimal(0), savings: new Prisma.Decimal(0) };
  }
  return computeEnvelopes(base);
}

// Report sortant = base − total dépensé (peut être négatif).
export function computeCarryOut(base: Prisma.Decimal, spent: Prisma.Decimal): Prisma.Decimal {
  return base.minus(spent);
}
```

- [ ] **Step 4: Lancer** → PASS (4 tests).

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/budget.ts src/lib/budget.monthly.test.ts
git commit -m "feat(lib): add base, targets and carryOut computations"
```
> Si le build échoue encore sur seed/handlers (Task 1), committer après la Task 9. Le test Vitest, lui, doit passer.

---

### Task 4: `isTriggerMonth`

**Files:** Modify `src/lib/budget.ts`, Create `src/lib/budget.recurring.test.ts`

- [ ] **Step 1: Test qui échoue** — `src/lib/budget.recurring.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { isTriggerMonth } from "@/lib/budget";

describe("isTriggerMonth", () => {
  it("monthly triggers every month from the anchor", () => {
    const r = { frequency: "MONTHLY" as const, anchorMonth: "2026-01" };
    expect(isTriggerMonth(r, "2026-01")).toBe(true);
    expect(isTriggerMonth(r, "2026-02")).toBe(true);
    expect(isTriggerMonth(r, "2025-12")).toBe(false); // avant l'ancrage
  });

  it("quarterly triggers every 3 months from the anchor", () => {
    const r = { frequency: "QUARTERLY" as const, anchorMonth: "2026-01" };
    expect(isTriggerMonth(r, "2026-01")).toBe(true);
    expect(isTriggerMonth(r, "2026-04")).toBe(true);
    expect(isTriggerMonth(r, "2026-03")).toBe(false);
  });

  it("yearly triggers every 12 months from the anchor", () => {
    const r = { frequency: "YEARLY" as const, anchorMonth: "2026-03" };
    expect(isTriggerMonth(r, "2026-03")).toBe(true);
    expect(isTriggerMonth(r, "2027-03")).toBe(true);
    expect(isTriggerMonth(r, "2026-09")).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — ajouter à `src/lib/budget.ts`, en tête ajouter l'import :
```ts
import { monthDiff } from "@/lib/month";
```
puis :
```ts
const FREQUENCY_PERIOD = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as const;

// Vrai si le mois M est une échéance du modèle (ancré sur anchorMonth, selon la fréquence).
export function isTriggerMonth(
  recurring: { frequency: keyof typeof FREQUENCY_PERIOD; anchorMonth: string },
  month: string,
): boolean {
  const d = monthDiff(recurring.anchorMonth, month);
  if (d < 0) return false;
  return d % FREQUENCY_PERIOD[recurring.frequency] === 0;
}
```

- [ ] **Step 4: Lancer** → PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
npm run format && npm run lint
git add src/lib/budget.ts src/lib/budget.recurring.test.ts
git commit -m "feat(lib): add isTriggerMonth for recurring frequencies"
```

---

## Phase 2 — Matérialisation & réconciliation (prisma mocké)

### Task 5: `materializeRecurring`

**Files:** Create `src/lib/recurring.ts`, `src/lib/recurring.test.ts`

- [ ] **Step 1: Test qui échoue** — `src/lib/recurring.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recurringExpense: { findMany: vi.fn() },
    recurringOccurrence: { findUnique: vi.fn(), create: vi.fn() },
    expense: { create: vi.fn() },
  },
}));

import { Prisma } from "@/generated/prisma/client";
import { materializeRecurring } from "@/lib/recurring";
import { prisma } from "@/lib/prisma";

const fixed = {
  id: "r1",
  label: "Loyer",
  type: "FIXED",
  amount: new Prisma.Decimal("800"),
  category: "essential",
  subcategory: "housing",
  frequency: "MONTHLY",
  anchorMonth: "2026-01",
  endMonth: null,
  active: true,
};
const variable = { ...fixed, id: "r2", label: "Électricité", type: "VARIABLE", subcategory: "bills" };

describe("materializeRecurring", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an APPLIED expense for a FIXED model and a PENDING occurrence for a VARIABLE", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([fixed, variable] as never);
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: "e1" } as never);

    await materializeRecurring("2026-03");

    expect(prisma.expense.create).toHaveBeenCalledTimes(1); // seulement le FIXED
    expect(prisma.recurringOccurrence.create).toHaveBeenCalledTimes(2);
    const statuses = vi
      .mocked(prisma.recurringOccurrence.create)
      .mock.calls.map((c) => (c[0] as { data: { status: string } }).data.status);
    expect(statuses).toContain("APPLIED");
    expect(statuses).toContain("PENDING");
  });

  it("skips a model that already has an occurrence for the month", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([fixed] as never);
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue({ id: "o1" } as never);

    await materializeRecurring("2026-03");

    expect(prisma.expense.create).not.toHaveBeenCalled();
    expect(prisma.recurringOccurrence.create).not.toHaveBeenCalled();
  });

  it("skips a non-trigger month (quarterly off-cycle)", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([
      { ...fixed, frequency: "QUARTERLY" },
    ] as never);
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue(null as never);

    await materializeRecurring("2026-03"); // anchor 2026-01, off-cycle

    expect(prisma.recurringOccurrence.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer** → FAIL (module introuvable).

- [ ] **Step 3: Implémenter** — `src/lib/recurring.ts` :
```ts
import { prisma } from "@/lib/prisma";
import { isTriggerMonth } from "@/lib/budget";

// Premier jour du mois "YYYY-MM" (date locale).
function firstOfMonth(month: string): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
}

// Matérialise les échéances récurrentes du mois M : FIXED → Expense + occurrence APPLIED ;
// VARIABLE → occurrence PENDING (à confirmer). Idempotent grâce à la garde @@unique.
export async function materializeRecurring(month: string): Promise<void> {
  const models = await prisma.recurringExpense.findMany({ where: { active: true } });

  for (const model of models) {
    if (model.anchorMonth > month) continue;
    if (model.endMonth && month > model.endMonth) continue;
    if (!isTriggerMonth(model, month)) continue;

    const existing = await prisma.recurringOccurrence.findUnique({
      where: { recurringId_month: { recurringId: model.id, month } },
    });
    if (existing) continue;

    if (model.type === "FIXED") {
      const expense = await prisma.expense.create({
        data: {
          amount: model.amount,
          description: model.label,
          date: firstOfMonth(month),
          month,
          category: model.category,
          subcategory: model.subcategory,
          recurringId: model.id,
        },
      });
      await prisma.recurringOccurrence.create({
        data: { recurringId: model.id, month, status: "APPLIED", expenseId: expense.id },
      });
    } else {
      await prisma.recurringOccurrence.create({
        data: { recurringId: model.id, month, status: "PENDING" },
      });
    }
  }
}
```

- [ ] **Step 4: Lancer** → PASS (3 tests).

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/recurring.ts src/lib/recurring.test.ts
git commit -m "feat(recurring): add materializeRecurring"
```

---

### Task 6: `reconcile`

**Files:** Create `src/lib/period.ts`, `src/lib/period.test.ts`

- [ ] **Step 1: Test qui échoue** — `src/lib/period.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    monthlyPeriod: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    income: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
    recurringOccurrence: { updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/recurring", () => ({ materializeRecurring: vi.fn() }));

import { Prisma } from "@/generated/prisma/client";
import { reconcile } from "@/lib/period";
import { prisma } from "@/lib/prisma";
import { materializeRecurring } from "@/lib/recurring";

describe("reconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.income.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.expense.findMany).mockResolvedValue([] as never);
  });

  it("creates the current period with carryIn 0 on first run", async () => {
    vi.mocked(prisma.monthlyPeriod.findFirst).mockResolvedValue(null as never);

    await reconcile(new Date("2026-06-10"));

    expect(prisma.monthlyPeriod.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ month: "2026-06" }) }),
    );
    expect(materializeRecurring).toHaveBeenCalledWith("2026-06");
  });

  it("closes the previous month and carries the surplus forward", async () => {
    vi.mocked(prisma.monthlyPeriod.findFirst).mockResolvedValue({
      id: "p5",
      month: "2026-05",
      carryIn: new Prisma.Decimal("0"),
      closedAt: null,
    } as never);
    vi.mocked(prisma.income.findMany).mockResolvedValue([{ amount: "2800" }] as never);
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ amount: "2200" }] as never);

    await reconcile(new Date("2026-06-10"));

    // mai clôturé avec carryOut = 2800 - 2200 = 600
    expect(prisma.monthlyPeriod.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p5" },
        data: expect.objectContaining({ carryOut: expect.anything(), closedAt: expect.any(Date) }),
      }),
    );
    // juin créé avec carryIn 600
    const created = vi.mocked(prisma.monthlyPeriod.create).mock.calls.find(
      (c) => (c[0] as { data: { month: string } }).data.month === "2026-06",
    );
    expect((created?.[0] as { data: { carryIn: Prisma.Decimal } }).data.carryIn.toString()).toBe("600");
    expect(materializeRecurring).toHaveBeenCalledWith("2026-06");
  });

  it("does nothing destructive when the latest period is already the current month", async () => {
    vi.mocked(prisma.monthlyPeriod.findFirst).mockResolvedValue({
      id: "p6",
      month: "2026-06",
      carryIn: new Prisma.Decimal("0"),
      closedAt: null,
    } as never);

    await reconcile(new Date("2026-06-10"));

    expect(prisma.monthlyPeriod.update).not.toHaveBeenCalled();
    expect(prisma.monthlyPeriod.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `src/lib/period.ts` :
```ts
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { currentMonth, nextMonth } from "@/lib/month";
import { computeBase, computeCarryOut } from "@/lib/budget";
import { materializeRecurring } from "@/lib/recurring";

function sum(rows: { amount: Prisma.Decimal | string }[]): Prisma.Decimal {
  return rows.reduce((acc, r) => acc.plus(r.amount), new Prisma.Decimal(0));
}

// carryOut figé d'un mois clôturé = base(M) − dépenses(M), base = entrées(M) + carryIn.
async function frozenCarryOut(month: string, carryIn: Prisma.Decimal): Promise<Prisma.Decimal> {
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ where: { month } }),
    prisma.expense.findMany({ where: { month } }),
  ]);
  return computeCarryOut(computeBase(sum(incomes), carryIn), sum(expenses));
}

// Réconciliation paresseuse idempotente : clôture les mois franchis en cascade,
// propage le report, ouvre le mois courant et matérialise ses récurrentes.
export async function reconcile(today: Date): Promise<void> {
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const latest = await prisma.monthlyPeriod.findFirst({ orderBy: { month: "desc" } });

  if (!latest) {
    await prisma.monthlyPeriod.create({ data: { month: current, carryIn: new Prisma.Decimal(0) } });
    await materializeRecurring(current);
    return;
  }

  let cursorMonth = latest.month;
  let cursorCarryIn = latest.carryIn;
  let cursorId = latest.id;

  while (cursorMonth < current) {
    const carryOut = await frozenCarryOut(cursorMonth, cursorCarryIn);
    await prisma.monthlyPeriod.update({
      where: { id: cursorId },
      data: { carryOut, closedAt: new Date() },
    });
    await prisma.recurringOccurrence.updateMany({
      where: { month: cursorMonth, status: "PENDING" },
      data: { status: "DROPPED" },
    });

    const next = nextMonth(cursorMonth);
    const created = await prisma.monthlyPeriod.create({
      data: { month: next, carryIn: carryOut },
    });
    await materializeRecurring(next);

    cursorMonth = next;
    cursorCarryIn = carryOut;
    cursorId = created.id;
  }
}

export { currentMonth };
```

- [ ] **Step 4: Lancer** → PASS (3 tests).

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/period.ts src/lib/period.test.ts
git commit -m "feat(period): add lazy idempotent reconcile"
```

---

## Phase 3 — Intégration dashboard, lecture seule, dérivation month

### Task 7: `getMonthlySummary` dérive base / carry / closed

**Files:** Modify `src/lib/dashboard.ts`, `src/lib/dashboard.test.ts`

- [ ] **Step 1: Étendre le test** — ajouter au mock de `src/lib/dashboard.test.ts` le modèle period et de nouveaux cas. Remplacer le bloc `vi.mock("@/lib/prisma"...)` par :
```ts
vi.mock("@/lib/incomes", () => ({ listMonthIncomes: vi.fn() }));
vi.mock("@/lib/expenses", () => ({ listMonthExpenses: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { monthlyPeriod: { findUnique: vi.fn() } } }));
```
et ajouter les imports :
```ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
```
Ajouter ce test (dans le `describe` existant) :
```ts
it("derives base, targets and carryOut from the period carryIn", async () => {
  vi.mocked(listMonthIncomes).mockResolvedValue([{ amount: "2500" }] as never);
  vi.mocked(listMonthExpenses).mockResolvedValue([
    { amount: "1000", category: "essential" },
  ] as never);
  vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({
    month: "2026-06",
    carryIn: new Prisma.Decimal("600"),
    carryOut: null,
    closedAt: null,
  } as never);

  const summary = await getMonthlySummary("2026-06");

  expect(summary.carryIn.toString()).toBe("600");
  expect(summary.base.toString()).toBe("3100");
  expect(summary.balance.toString()).toBe("2100"); // base - spent = 3100 - 1000
  expect(summary.closed).toBe(false);
  const essential = summary.categories.find((c) => c.category === "essential");
  expect(essential?.target.toString()).toBe("1550"); // 50% de la base
});
```
Dans les deux tests existants, ajouter aux setups `vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);` (pas de period → carryIn 0) et adapter : avec carryIn 0, `base = income`, `balance = income - spent` (inchangé). Le test « aggregates… » garde ses attentes (carryIn 0).

- [ ] **Step 2: Lancer** `npm run test -- src/lib/dashboard.test.ts` → FAIL (champs `carryIn`/`base`/`closed` absents).

- [ ] **Step 3: Implémenter** — remplacer `src/lib/dashboard.ts` par :
```ts
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { computeBase, computeTargets, computeCarryOut } from "@/lib/budget";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface CategorySpend {
  category: CategoryKey;
  spent: Prisma.Decimal;
  target: Prisma.Decimal;
}

export interface MonthlySummary {
  month: string;
  income: Prisma.Decimal;
  carryIn: Prisma.Decimal;
  base: Prisma.Decimal;
  totalSpent: Prisma.Decimal;
  balance: Prisma.Decimal; // carryOut live = base - totalSpent
  categories: CategorySpend[];
  closed: boolean;
}

function sum(rows: { amount: Prisma.Decimal | string }[]): Prisma.Decimal {
  return rows.reduce((acc, r) => acc.plus(r.amount), new Prisma.Decimal(0));
}

export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const [incomes, expenses, period] = await Promise.all([
    listMonthIncomes(month),
    listMonthExpenses(month),
    prisma.monthlyPeriod.findUnique({ where: { month } }),
  ]);

  const income = sum(incomes);
  const carryIn = period?.carryIn ?? new Prisma.Decimal(0);
  const base = computeBase(income, carryIn);
  const totalSpent = sum(expenses);
  const targets = computeTargets(base);

  const categories: CategorySpend[] = CATEGORY_ORDER.map((category) => ({
    category,
    spent: sum(expenses.filter((e) => e.category === category)),
    target: targets[category],
  }));

  return {
    month,
    income,
    carryIn,
    base,
    totalSpent,
    balance: computeCarryOut(base, totalSpent),
    categories,
    closed: Boolean(period?.closedAt),
  };
}
```
> Note : on retire `previousTotalSpent` ; le composant `PrevMonthDelta` n'est plus alimenté ici. La page dashboard (Task 13) remplace l'affichage du delta par la ligne de report. Le test de `PrevMonthDelta` reste valide (composant inchangé, simplement plus utilisé) — **ne pas** le supprimer.

- [ ] **Step 4: Lancer** → PASS.

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/dashboard.ts src/lib/dashboard.test.ts
git commit -m "feat(dashboard): derive base, carry and closed in summary"
```

---

### Task 8: `assertMonthOpen` + gardes lecture seule

**Files:** Create `src/lib/period-guard.ts`, `src/lib/period-guard.test.ts`

- [ ] **Step 1: Test qui échoue** — `src/lib/period-guard.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { monthlyPeriod: { findUnique: vi.fn() } },
}));

import { isMonthOpen } from "@/lib/period-guard";
import { prisma } from "@/lib/prisma";

describe("isMonthOpen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is open when no period exists", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);
    expect(await isMonthOpen("2026-06")).toBe(true);
  });

  it("is open when the period has no closedAt", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: null } as never);
    expect(await isMonthOpen("2026-06")).toBe(true);
  });

  it("is closed when closedAt is set", async () => {
    vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
    expect(await isMonthOpen("2026-05")).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `src/lib/period-guard.ts` :
```ts
import { prisma } from "@/lib/prisma";

// Vrai si le mois est ouvert (mutations autorisées) : pas de period ou closedAt null.
export async function isMonthOpen(month: string): Promise<boolean> {
  const period = await prisma.monthlyPeriod.findUnique({ where: { month } });
  return !period?.closedAt;
}
```

- [ ] **Step 4: Lancer** → PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
npm run format && npm run lint
git add src/lib/period-guard.ts src/lib/period-guard.test.ts
git commit -m "feat(lib): add month-open guard"
```

---

### Task 9: `date`/`month` à la création + requête par month + gardes 409

**Files:** Modify `src/lib/expenses.ts`, `src/app/api/incomes/route.ts`, `src/app/api/incomes/[id]/route.ts`, `src/app/api/expenses/route.ts`, `src/app/api/expenses/[id]/route.ts`, et leurs tests.

- [ ] **Step 1: Étendre les tests des routes** — dans `src/app/api/expenses/route.test.ts`, ajouter au mock prisma `monthlyPeriod: { findUnique: vi.fn() }` et, dans le `beforeEach`/cas POST, `vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue(null as never);` (mois ouvert). Ajouter ce cas :
```ts
it("rejects a POST on a closed month with 409", async () => {
  vi.mocked(prisma.monthlyPeriod.findUnique).mockResolvedValue({ closedAt: new Date() } as never);
  const res = await POST(
    postRequest({
      amount: "10.00",
      description: "Tardif",
      date: "2026-01-15",
      category: "leisure",
      subcategory: "vacations",
    }),
  );
  expect(res.status).toBe(409);
  expect(prisma.expense.create).not.toHaveBeenCalled();
});
```
Et vérifier que le POST « happy path » assigne `month` : dans l'assertion `prisma.expense.create` attendue, ajouter `month: "2026-06"` cohérent avec la `date` du test (adapter la date du test à `2026-06-10` si besoin pour que `month = "2026-06"`).

- [ ] **Step 2: Lancer** `npm run test -- src/app/api/expenses/route.test.ts` → FAIL.

- [ ] **Step 3: Implémenter les handlers**

`src/lib/expenses.ts` — requête par `month` :
```ts
import type { Expense } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Dépenses d'un mois (clé month), les plus récentes d'abord.
export function listMonthExpenses(month: string): Promise<Expense[]> {
  return prisma.expense.findMany({ where: { month }, orderBy: { date: "desc" } });
}
```

`src/app/api/expenses/route.ts` POST — dériver `month` + garde :
```ts
import { isMonthOpen } from "@/lib/period-guard";
// …
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_expense" }, { status: 400 });
  }
  const { date, ...rest } = parsed.data;
  const month = date.slice(0, 7);
  if (!(await isMonthOpen(month))) {
    return NextResponse.json({ error: "month_closed" }, { status: 409 });
  }
  const expense = await prisma.expense.create({
    data: { ...rest, date: new Date(date), month },
  });
  return NextResponse.json(expense, { status: 201 });
}
```

`src/app/api/expenses/[id]/route.ts` PUT — idem (dériver `month`, garde 409 avant l'update) ; DELETE — garde sur le `month` de la dépense existante :
```ts
// PUT : après parsing, avant update
const { date, ...rest } = parsed.data;
const month = date.slice(0, 7);
if (!(await isMonthOpen(month))) {
  return NextResponse.json({ error: "month_closed" }, { status: 409 });
}
// update data: { ...rest, date: new Date(date), month }
```
Pour DELETE, charger la dépense pour connaître son mois :
```ts
const existing = await prisma.expense.findUnique({ where: { id } });
if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
if (!(await isMonthOpen(existing.month))) {
  return NextResponse.json({ error: "month_closed" }, { status: 409 });
}
await prisma.expense.delete({ where: { id } });
```

`src/app/api/incomes/route.ts` POST — `date` = 1er du mois + garde :
```ts
import { isMonthOpen } from "@/lib/period-guard";
// …
const { month } = parsed.data;
if (!(await isMonthOpen(month))) {
  return NextResponse.json({ error: "month_closed" }, { status: 409 });
}
const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
const income = await prisma.income.create({ data: { ...parsed.data, date } });
```

`src/app/api/incomes/[id]/route.ts` PUT — recalcule `date` depuis `month` + garde ; DELETE — garde sur le mois de l'income existant (même schéma que expense DELETE).

- [ ] **Step 4: Lancer** les tests des 4 routes :
```bash
npm run test -- src/app/api/expenses src/app/api/incomes
```
Expected: PASS (ajuster les attentes `prisma.*.create` pour inclure `month`/`date` ; ajouter le mock `monthlyPeriod.findUnique` dans chaque fichier de test des incomes aussi).

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/expenses.ts "src/app/api/expenses" "src/app/api/incomes"
git commit -m "feat(api): derive month, default income date, guard closed months"
```
> À ce stade le build complet doit être **vert** (le seed reste cassé jusqu'à la Task 19 — voir note ; si `next build` ne compile pas `prisma/seed.ts`, c'est qu'il est hors du `tsconfig` de build : vérifier. Sinon corriger le seed maintenant en Task 19 avancée).

---

## Phase 4 — API récurrents

### Task 10: Validators récurrents + confirmation

**Files:** Modify `src/lib/validators.ts`, Create `src/lib/validators.recurring.test.ts`

- [ ] **Step 1: Test qui échoue** :
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { recurringCreateSchema, occurrenceConfirmSchema } from "@/lib/validators";

const base = {
  label: "Loyer",
  type: "FIXED",
  amount: "800.00",
  category: "essential",
  subcategory: "housing",
  frequency: "MONTHLY",
  anchorMonth: "2026-01",
};

describe("recurringCreateSchema", () => {
  it("accepts a valid model and an optional endMonth", () => {
    expect(recurringCreateSchema.safeParse(base).success).toBe(true);
    expect(recurringCreateSchema.safeParse({ ...base, endMonth: "2026-12" }).success).toBe(true);
  });
  it("rejects a bad type, frequency, amount or anchor", () => {
    expect(recurringCreateSchema.safeParse({ ...base, type: "X" }).success).toBe(false);
    expect(recurringCreateSchema.safeParse({ ...base, frequency: "WEEKLY" }).success).toBe(false);
    expect(recurringCreateSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(recurringCreateSchema.safeParse({ ...base, anchorMonth: "2026-1" }).success).toBe(false);
  });
});

describe("occurrenceConfirmSchema", () => {
  it("requires a positive amount", () => {
    expect(occurrenceConfirmSchema.safeParse({ amount: "42.00" }).success).toBe(true);
    expect(occurrenceConfirmSchema.safeParse({ amount: "0" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — ajouter à `src/lib/validators.ts` :
```ts
const amountString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .refine((value) => Number(value) > 0);
const monthString = z.string().regex(/^\d{4}-\d{2}$/);

export const recurringCreateSchema = z.object({
  label: z.string().trim().min(1).max(80),
  type: z.enum(["FIXED", "VARIABLE"]),
  amount: amountString,
  category: z.enum(["essential", "leisure", "savings"]),
  subcategory: z.string().min(1),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  anchorMonth: monthString,
  endMonth: monthString.nullable().optional(),
  active: z.boolean().optional(),
});

export const occurrenceConfirmSchema = z.object({ amount: amountString });

export type RecurringCreateInput = z.infer<typeof recurringCreateSchema>;
```

- [ ] **Step 4: Lancer** → PASS.

- [ ] **Step 5: Commit**
```bash
npm run format && npm run lint
git add src/lib/validators.ts src/lib/validators.recurring.test.ts
git commit -m "feat(api): add recurring and confirm validators"
```

---

### Task 11: `GET` + `POST /api/recurring`

**Files:** Create `src/app/api/recurring/route.ts`, `src/app/api/recurring/route.test.ts`

- [ ] **Step 1: Test qui échoue** :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { recurringExpense: { findMany: vi.fn(), create: vi.fn() } },
}));

import { GET, POST } from "@/app/api/recurring/route";
import { prisma } from "@/lib/prisma";

const valid = {
  label: "Loyer",
  type: "FIXED",
  amount: "800.00",
  category: "essential",
  subcategory: "housing",
  frequency: "MONTHLY",
  anchorMonth: "2026-01",
};

function postReq(body: unknown) {
  return new Request("http://localhost/api/recurring", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("recurring route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists models", async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([] as never);
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("creates a model with normalised endMonth null", async () => {
    vi.mocked(prisma.recurringExpense.create).mockResolvedValue({ id: "r1" } as never);
    const res = await POST(postReq(valid));
    expect(res.status).toBe(201);
    expect(prisma.recurringExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ endMonth: null }) }),
    );
  });

  it("rejects an invalid model with 400", async () => {
    const res = await POST(postReq({ ...valid, amount: "0" }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `src/app/api/recurring/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recurringCreateSchema } from "@/lib/validators";

export async function GET() {
  const models = await prisma.recurringExpense.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(models, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = recurringCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_recurring" }, { status: 400 });
  }
  const { endMonth, active, ...rest } = parsed.data;
  const model = await prisma.recurringExpense.create({
    data: { ...rest, endMonth: endMonth ?? null, active: active ?? true },
  });
  return NextResponse.json(model, { status: 201 });
}
```

- [ ] **Step 4: Lancer** → PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
npm run format && npm run lint
git add src/app/api/recurring/route.ts src/app/api/recurring/route.test.ts
git commit -m "feat(recurring): add list and create handlers"
```

---

### Task 12: `PUT` + `DELETE /api/recurring/[id]`

**Files:** Create `src/app/api/recurring/[id]/route.ts`, `src/app/api/recurring/[id]/route.test.ts`

- [ ] **Step 1: Test qui échoue** — calqué sur `api/budgets/[id]/route.test.ts` (mêmes patterns 200/400/404 P2025), avec `prisma.recurringExpense.update`/`delete` mockés, body `valid` de la Task 11, et `recurringCreateSchema`. Inclure : update 200, 400 sur payload invalide, 404 sur P2025 ; delete 200, 404 sur P2025.

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: { recurringExpense: { update: vi.fn(), delete: vi.fn() } },
}));
import { Prisma } from "@/generated/prisma/client";
import { PUT, DELETE } from "@/app/api/recurring/[id]/route";
import { prisma } from "@/lib/prisma";

const valid = {
  label: "Loyer", type: "FIXED", amount: "850.00", category: "essential",
  subcategory: "housing", frequency: "MONTHLY", anchorMonth: "2026-01",
};
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const notFound = new Prisma.PrismaClientKnownRequestError("missing", { code: "P2025", clientVersion: "7" });
const putReq = (b: unknown) => new Request("http://localhost/api/recurring/r1", {
  method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
});

describe("PUT /api/recurring/[id]", () => {
  beforeEach(() => vi.clearAllMocks());
  it("updates and returns 200", async () => {
    vi.mocked(prisma.recurringExpense.update).mockResolvedValue({ id: "r1" } as never);
    expect((await PUT(putReq(valid), params("r1"))).status).toBe(200);
  });
  it("returns 400 on invalid", async () => {
    expect((await PUT(putReq({ ...valid, amount: "0" }), params("r1"))).status).toBe(400);
  });
  it("returns 404 on P2025", async () => {
    vi.mocked(prisma.recurringExpense.update).mockRejectedValue(notFound);
    expect((await PUT(putReq(valid), params("x"))).status).toBe(404);
  });
});

describe("DELETE /api/recurring/[id]", () => {
  beforeEach(() => vi.clearAllMocks());
  it("deletes and returns 200", async () => {
    vi.mocked(prisma.recurringExpense.delete).mockResolvedValue({ id: "r1" } as never);
    const res = await DELETE(new Request("http://localhost/api/recurring/r1", { method: "DELETE" }), params("r1"));
    expect(res.status).toBe(200);
  });
  it("returns 404 on P2025", async () => {
    vi.mocked(prisma.recurringExpense.delete).mockRejectedValue(notFound);
    const res = await DELETE(new Request("http://localhost/api/recurring/x", { method: "DELETE" }), params("x"));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `src/app/api/recurring/[id]/route.ts` (calqué sur budgets/[id]) :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recurringCreateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };
function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = recurringCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_recurring" }, { status: 400 });
  }
  const { endMonth, active, ...rest } = parsed.data;
  try {
    const model = await prisma.recurringExpense.update({
      where: { id },
      data: { ...rest, endMonth: endMonth ?? null, active: active ?? true },
    });
    return NextResponse.json(model, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.recurringExpense.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    throw error;
  }
}
```

- [ ] **Step 4: Lancer** → PASS (5 tests).

- [ ] **Step 5: Commit**
```bash
npm run format && npm run lint
git add "src/app/api/recurring/[id]"
git commit -m "feat(recurring): add update and delete handlers"
```

---

### Task 13: `POST /api/recurring/occurrences/[id]/confirm`

**Files:** Create `src/app/api/recurring/occurrences/[id]/confirm/route.ts` + test

- [ ] **Step 1: Test qui échoue** :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    recurringOccurrence: { findUnique: vi.fn(), update: vi.fn() },
    expense: { create: vi.fn() },
  },
}));
import { Prisma } from "@/generated/prisma/client";
import { POST } from "@/app/api/recurring/occurrences/[id]/confirm/route";
import { prisma } from "@/lib/prisma";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (b: unknown) => new Request("http://localhost/x", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
});

describe("confirm occurrence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the expense and marks the occurrence CONFIRMED", async () => {
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue({
      id: "o1", month: "2026-06", status: "PENDING", expenseId: null,
      recurring: { amount: new Prisma.Decimal("90"), category: "essential", subcategory: "bills", label: "Élec" },
    } as never);
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: "e9" } as never);

    const res = await POST(req({ amount: "104.30" }), params("o1"));
    expect(res.status).toBe(200);
    expect(prisma.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ month: "2026-06", recurringId: undefined }) }),
    );
    expect(prisma.recurringOccurrence.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "o1" }, data: expect.objectContaining({ status: "CONFIRMED", expenseId: "e9" }) }),
    );
  });

  it("returns 400 on a bad amount", async () => {
    const res = await POST(req({ amount: "0" }), params("o1"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the occurrence is missing", async () => {
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue(null as never);
    const res = await POST(req({ amount: "10" }), params("x"));
    expect(res.status).toBe(404);
  });

  it("returns 409 when already confirmed", async () => {
    vi.mocked(prisma.recurringOccurrence.findUnique).mockResolvedValue({ status: "CONFIRMED" } as never);
    const res = await POST(req({ amount: "10" }), params("o1"));
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { occurrenceConfirmSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

function firstOfMonth(month: string): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = occurrenceConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  const occurrence = await prisma.recurringOccurrence.findUnique({
    where: { id },
    include: { recurring: true },
  });
  if (!occurrence) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (occurrence.status !== "PENDING") {
    return NextResponse.json({ error: "not_pending" }, { status: 409 });
  }
  const expense = await prisma.expense.create({
    data: {
      amount: parsed.data.amount,
      description: occurrence.recurring.label,
      date: firstOfMonth(occurrence.month),
      month: occurrence.month,
      category: occurrence.recurring.category,
      subcategory: occurrence.recurring.subcategory,
      recurringId: occurrence.recurringId,
    },
  });
  await prisma.recurringOccurrence.update({
    where: { id },
    data: { status: "CONFIRMED", expenseId: expense.id },
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
```
> Note test : le test mocke `recurring` sans `recurringId` ; ajuster l'assertion `recurringId` à `occurrence.recurringId` (undefined dans le mock) — ou ajouter `recurringId: "r1"` au mock et attendre `"r1"`. Garder cohérent.

- [ ] **Step 4: Lancer** → PASS (4 tests).

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add "src/app/api/recurring/occurrences"
git commit -m "feat(recurring): add variable occurrence confirmation"
```

---

## Phase 5 — Server action & UI

### Task 14: Server action `reconcileAction` + déclenchement au montage

**Files:** Create `src/app/actions/reconcile.ts`, `src/components/dashboard/reconcile-on-mount.tsx` + test

- [ ] **Step 1: Server action** — `src/app/actions/reconcile.ts` :
```ts
"use server";

import { reconcile } from "@/lib/period";

export async function reconcileAction(): Promise<void> {
  await reconcile(new Date());
}
```

- [ ] **Step 2: Test du client island** — `src/components/dashboard/reconcile-on-mount.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const refresh = vi.fn();
const reconcileAction = vi.fn().mockResolvedValue(undefined);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/reconcile", () => ({ reconcileAction }));

import { ReconcileOnMount } from "@/components/dashboard/reconcile-on-mount";

describe("ReconcileOnMount", () => {
  beforeEach(() => {
    refresh.mockClear();
    reconcileAction.mockClear();
  });

  it("runs reconcile once then refreshes", async () => {
    render(<ReconcileOnMount />);
    await waitFor(() => expect(reconcileAction).toHaveBeenCalledOnce());
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
```

- [ ] **Step 3: Lancer** `npm run test -- src/components/dashboard/reconcile-on-mount.test.tsx` → FAIL.

- [ ] **Step 4: Implémenter le client island** — `src/components/dashboard/reconcile-on-mount.tsx` :
```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { reconcileAction } from "@/app/actions/reconcile";

// Déclenche la réconciliation paresseuse au chargement du dashboard, une seule fois,
// puis rafraîchit pour afficher l'état à jour. Rendu invisible.
export function ReconcileOnMount() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void reconcileAction().then(() => router.refresh());
  }, [router]);

  return null;
}
```

- [ ] **Step 5: Lancer** → PASS. Puis build, commit :
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/app/actions/reconcile.ts src/components/dashboard/reconcile-on-mount.tsx src/components/dashboard/reconcile-on-mount.test.tsx
git commit -m "feat(dashboard): trigger lazy reconcile on mount"
```

---

### Task 15: Ligne de report + état lecture seule sur le dashboard

**Files:** Create `src/components/dashboard/carry-line.tsx` + test ; Modify `src/app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Test `CarryLine`** — `src/components/dashboard/carry-line.test.tsx` :
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarryLine } from "@/components/dashboard/carry-line";

describe("CarryLine", () => {
  it("shows a positive carry from last month", () => {
    render(<CarryLine carryIn="600.00" />);
    expect(screen.getByText(/report du mois dernier/i)).toBeInTheDocument();
    expect(screen.getByText(/600,00/)).toBeInTheDocument();
  });
  it("renders nothing when carry is zero", () => {
    const { container } = render(<CarryLine carryIn="0" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `src/components/dashboard/carry-line.tsx` :
```tsx
import { formatEUR } from "@/lib/formatters";

interface CarryLineProps {
  carryIn: string;
}

export function CarryLine({ carryIn }: CarryLineProps) {
  const value = Number(carryIn);
  if (value === 0) return null;
  const label =
    value > 0
      ? `Report du mois dernier : +${formatEUR(value)}`
      : `Report du mois dernier : ${formatEUR(value)} à absorber`;
  return <p className="text-[13px] text-text-secondary">{label}</p>;
}
```

- [ ] **Step 4: Lancer** → PASS. Puis mettre à jour `src/app/(main)/dashboard/page.tsx` : importer `ReconcileOnMount`, `CarryLine` ; retirer `PrevMonthDelta` (plus alimenté) ; remplacer le bloc conditionnel revenus/delta par : revenus = 0 → banner inchangé ; sinon `<CarryLine carryIn={summary.carryIn.toString()} />`. Ajouter `<ReconcileOnMount />` en tête du `main`. Ajouter, si `summary.closed`, un bandeau lecture seule :
```tsx
import { ReconcileOnMount } from "@/components/dashboard/reconcile-on-mount";
import { CarryLine } from "@/components/dashboard/carry-line";
// … dans le JSX, début du <main> :
<ReconcileOnMount />
<DashboardMonthNav month={month} />
{summary.closed ? (
  <p className="text-[13px] text-muted">Mois clôturé — lecture seule.</p>
) : null}
{income === 0 ? (
  <Link href="/incomes">…banner inchangé…</Link>
) : (
  <CarryLine carryIn={summary.carryIn.toString()} />
)}
<CategoryDonut … />
// … cartes inchangées
```
Supprimer l'import et l'usage de `PrevMonthDelta` dans la page (le composant + son test restent dans le repo, simplement plus importés ici).

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/components/dashboard/carry-line.tsx src/components/dashboard/carry-line.test.tsx "src/app/(main)/dashboard/page.tsx"
git commit -m "feat(dashboard): show carry line and read-only state"
```

---

### Task 16: Lecture seule sur l'écran Dépenses (mois clôturé)

**Files:** Modify `src/components/expenses/expenses-manager.tsx`, `src/app/(main)/expenses/page.tsx`, `src/components/expenses/expenses-manager.test.tsx`

- [ ] **Step 1: Étendre le test du manager** — ajouter à `expenses-manager.test.tsx` :
```tsx
it("hides the add action and row controls when the month is closed", () => {
  render(<ExpensesManager expenses={expenses} readOnly />);
  expect(screen.queryByRole("button", { name: "Ajouter une dépense" })).not.toBeInTheDocument();
});
```
(Le tableau `expenses` du fichier de test doit déjà fournir des `ExpenseRowData` ; conserver l'existant.)

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `ExpensesManager` : ajouter `readOnly?: boolean` aux props ; si `readOnly`, ne pas rendre le bouton « Ajouter une dépense », ni passer `onEdit`/`onDelete` aux `ExpenseRow` (passer des handlers `undefined` et masquer les `IconButton` côté `ExpenseRow` si non fournis — vérifier que `ExpenseRow` rend les boutons seulement si `onEdit`/`onDelete` sont définis ; sinon adapter `ExpenseRow` pour rendre les contrôles optionnels). Mettre à jour `src/app/(main)/expenses/page.tsx` pour calculer `readOnly` via `getMonthlySummary(currentMonth()).closed` (ou `isMonthOpen`) et le passer au manager. Afficher un `<p>` « Mois clôturé — lecture seule. » si `readOnly`.

> Détail `ExpenseRow` : rendre `onEdit`/`onDelete` optionnels ; n'afficher les `IconButton` que s'ils sont fournis. Adapter le test existant de `ExpenseRow` si nécessaire (les cas actuels passent les deux handlers, donc inchangés).

- [ ] **Step 4: Lancer** `npm run test -- src/components/expenses` → PASS.

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/components/expenses "src/app/(main)/expenses/page.tsx"
git commit -m "feat(expenses): lock controls on closed months"
```

---

### Task 17: Confirmation des récurrentes variables (UI)

**Files:** Create `src/components/recurring/pending-confirmations.tsx` + test ; Modify `src/app/(main)/dashboard/page.tsx` (ou expenses) pour afficher la liste.

- [ ] **Step 1: Test** — `pending-confirmations.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { PendingConfirmations } from "@/components/recurring/pending-confirmations";

const items = [{ id: "o1", label: "Électricité", estimate: "90.00" }];

describe("PendingConfirmations", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("confirms a variable occurrence with the real amount", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    render(<PendingConfirmations items={items} />);
    await userEvent.type(screen.getByLabelText("Montant réel pour Électricité"), "104.30");
    await userEvent.click(screen.getByRole("button", { name: "Confirmer Électricité" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recurring/occurrences/o1/confirm",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("renders nothing when there is no pending item", () => {
    const { container } = render(<PendingConfirmations items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `src/components/recurring/pending-confirmations.tsx` (client) :
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SoftBanner } from "@/components/ui/soft-banner";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

export interface PendingItem {
  id: string;
  label: string;
  estimate: string;
}

export function PendingConfirmations({ items }: { items: PendingItem[] }) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  if (items.length === 0) return null;

  async function confirm(item: PendingItem) {
    const amount = amounts[item.id] ?? "";
    const res = await fetch(`/api/recurring/occurrences/${item.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <SoftBanner icon={BellRing} tone="accent">
        Des dépenses récurrentes variables sont à confirmer.
      </SoftBanner>
      {items.map((item) => (
        <div key={item.id} className="card flex items-center gap-3 p-4">
          <span className="flex-1 text-[15px] text-text">{item.label}</span>
          <input
            inputMode="decimal"
            aria-label={`Montant réel pour ${item.label}`}
            placeholder={item.estimate}
            value={amounts[item.id] ?? ""}
            onChange={(e) => setAmounts((a) => ({ ...a, [item.id]: e.target.value }))}
            className="h-10 w-28 rounded-input bg-surface-alt px-3 text-[15px] text-text outline-none"
          />
          <Button onClick={() => confirm(item)}>Confirmer {item.label}</Button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Lancer** → PASS. Puis dans `src/app/(main)/dashboard/page.tsx`, charger les occurrences `PENDING` du mois courant et rendre `<PendingConfirmations items={…} />` (mapper `{ id, label: occurrence.recurring.label, estimate: occurrence.recurring.amount.toString() }`). Charger via `prisma.recurringOccurrence.findMany({ where: { month, status: "PENDING" }, include: { recurring: true } })`.

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/components/recurring/pending-confirmations.tsx src/components/recurring/pending-confirmations.test.tsx "src/app/(main)/dashboard/page.tsx"
git commit -m "feat(recurring): add pending variable confirmation ui"
```

---

### Task 18: Écran de gestion des récurrentes (CRUD)

**Files:** Create `src/components/recurring/recurring-form.tsx`, `src/components/recurring/recurring-manager.tsx`, `src/app/(main)/recurring/page.tsx` (+ tests pour form & manager). Modify `src/components/nav/app-nav.tsx` est **hors scope** (la nav reste à 4) — l'accès se fait via un lien depuis l'écran Dépenses.

- [ ] **Step 1: Tests** — `recurring-form.test.tsx` (création via POST, édition via PUT, calqué sur `budget-form.test.tsx`) et `recurring-manager.test.tsx` (ouverture overlay, suppression + refresh, état vide, calqué sur `budgets-manager.test.tsx`). Réutiliser `Overlay`, `ConfirmDialog`, `CatSelect`, `Field`, `Button`, `Segmented` (pour type/fréquence).

- [ ] **Step 2: Lancer** → FAIL.

- [ ] **Step 3: Implémenter** — `RecurringForm` (champs : label, type via `Segmented` FIXED/VARIABLE, montant, catégorie via `CatSelect`, sous-catégorie via `SubcatChips`, fréquence via `Segmented` MONTHLY/QUARTERLY/YEARLY, anchorMonth `<input type="month">`, endMonth optionnel, active via `Toggle`) ; POST `/api/recurring` ou PUT `/api/recurring/[id]`. `RecurringManager` (liste de cartes label + montant + fréquence + état, overlay add/edit, confirm delete → `/api/recurring/[id]` DELETE, `router.refresh()`). `src/app/(main)/recurring/page.tsx` (Server, `force-dynamic`) : `prisma.recurringExpense.findMany` → DTO strings → `<RecurringManager models={…} />`. Ajouter dans `src/app/(main)/expenses/page.tsx` un lien « Gérer les dépenses récurrentes » → `/recurring`.

> Le code complet de ces composants suit les patterns **exacts** de `budget-form.tsx`/`budgets-manager.tsx`/`budgets/page.tsx` (mêmes imports kit, même structure overlay/confirm). Reproduire ces patterns en remplaçant les champs budget par les champs récurrents listés ci-dessus.

- [ ] **Step 4: Lancer** `npm run test -- src/components/recurring` → PASS. Build.

- [ ] **Step 5: Commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/components/recurring "src/app/(main)/recurring" "src/app/(main)/expenses/page.tsx"
git commit -m "feat(recurring): add recurring models management screen"
```

---

## Phase 6 — Seed & vérification

### Task 19: [DB — utilisateur] Mettre à jour le seed

**Files:** Modify `prisma/seed.ts`

- [ ] **Step 1: Adapter le seed** — remplacer `prisma.monthlyBalance.deleteMany()` par `prisma.monthlyPeriod.deleteMany()`, `prisma.recurringOccurrence.deleteMany()`, `prisma.recurringExpense.deleteMany()` (dans le bon ordre de dépendances : occurrences → recurring → expenses → budgets → income → periods). Ajouter `date` à chaque `income` (1er du mois) et `month` à chaque `expense` (déduit de sa `date`). Remplacer la création des `MonthlyBalance` par des `MonthlyPeriod` clôturés cohérents : pour les 2 mois précédents, `{ month, carryIn, carryOut, closedAt: new Date() }` avec des reports légers ; pour le mois courant `{ month: currentMonth(), carryIn: <carryOut du mois précédent> }` (ouvert). Ajouter 2-3 `RecurringExpense` de démo (ex. Loyer FIXED MONTHLY, Électricité VARIABLE MONTHLY, Assurance FIXED QUARTERLY) et, pour le mois courant, leurs `RecurringOccurrence` (FIXED→APPLIED avec l'Expense liée, VARIABLE→PENDING).

- [ ] **Step 2: [DB — utilisateur] Lancer le seed**

Run (mainteneur) : `npm run db:seed`
Expected: seed OK ; le dashboard montre des reports et au moins une variable à confirmer.

- [ ] **Step 3: Vérifier le typecheck du seed**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: build vert (le seed compile avec les nouveaux modèles).

- [ ] **Step 4: Commit**
```bash
npm run format && npm run lint
git add prisma/seed.ts
git commit -m "feat(db): update seed for monthly periods and recurring"
```

---

### Task 20: Vérification finale + PR

- [ ] **Step 1: Lint, build, suite complète**
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: lint clean, build OK (routes `/recurring`, `/api/recurring*`, dashboard), tous les tests au vert.

- [ ] **Step 2: [DB — utilisateur] Vérification manuelle**

`npm run dev`, ouvrir `http://localhost:3000` :
- au chargement du dashboard, `reconcile` s'exécute (les mois passés se clôturent, le report se propage) ;
- la ligne « Report du mois dernier : +X » apparaît ; les objectifs reflètent la base (revenus + report) ;
- naviguer vers un mois passé → bandeau « Mois clôturé — lecture seule », pas d'ajout/édition ;
- une dépense récurrente **variable** apparaît « à confirmer » → saisir le montant → elle compte ;
- écran `/recurring` (lien depuis Dépenses) : créer/éditer/mettre en pause/supprimer un modèle ;
- vérifier light + dark, mobile + desktop, aucun rouge vif (déficits en teinte douce). Arrêter le serveur.

- [ ] **Step 3: Mettre à jour le CLAUDE.md**

Répercuter (section « Modèle de données » + « Fonctionnalités MVP ») : récurrentes dans le MVP ; `MonthlyBalance` → `MonthlyPeriod` + `RecurringExpense`/`RecurringOccurrence` + enums ; nouvelles routes. Commit :
```bash
git add CLAUDE.md
git commit -m "docs(claude): update model and scope for monthly logic"
```

- [ ] **Step 4: Push et PR**
```bash
git push -u origin feat/monthly-logic
gh pr create --base main --head feat/monthly-logic \
  --title "feat(monthly): add monthly carry-over and recurring expenses" \
  --body "Implémente le cœur report mensuel 50/30/20 (MonthlyPeriod, reconcile() paresseux idempotent, base = entrées + carryIn, objectifs dérivés, mois clôturés en lecture seule + garde 409) et les dépenses récurrentes (modèles CRUD, matérialisation FIXED/VARIABLE, occurrences, confirmation des variables). Intègre le report au dashboard, déclenche reconcile au montage. Migration : MonthlyBalance → MonthlyPeriod, Income.date, Expense.month/recurringId, RecurringExpense/Occurrence. Seed mis à jour. Notifications laissées en sous-projet."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- Modèle (§5) → Task 1 ✅ · backfill/migration → Task 1 Step 3 ✅ · seed → Task 19 ✅
- Base/targets/carryOut, isTriggerMonth, monthDiff (§2, §6) → Tasks 2/3/4 ✅
- `materializeRecurring` (§4.2) → Task 5 ✅ · `reconcile` cascade/idempotence (§3) → Task 6 ✅
- `getMonthlySummary` base/carry/closed (§6, §8) → Task 7 ✅
- Lecture seule 409 + UI (§2.2.5, §7, §8) → Tasks 8/9/15/16 ✅
- Dérivation `date`/`month` (§5) → Task 9 ✅
- API récurrents + confirm (§7) → Tasks 10/11/12/13 ✅ · cycle de vie pause/fin/suppression (§4.4) → Tasks 12/18 ✅
- Server action reconcile (§3) → Task 14 ✅ · UI report/lecture seule/confirmation/CRUD (§8) → Tasks 15/16/17/18 ✅
- Tests cibles (§11) → chaque task ✅ · impacts CLAUDE.md (§12) → Task 20 Step 3 ✅
- Hors périmètre : notifications, vue annuelle, i18n → non couverts, conforme ✅

**Placeholders :** les Tasks 16 et 18 décrivent des composants « calqués sur des patterns existants exacts » plutôt que du code intégral (budget-form/budgets-manager) — c'est volontaire pour éviter la duplication massive, mais l'exécutant **doit** ouvrir ces fichiers de référence. Tous les autres steps ont du code complet + commandes + résultats attendus.

**Cohérence des types :**
- `MonthlySummary` gagne `carryIn`/`base`/`closed`, perd `previousTotalSpent` (Task 7) → page dashboard (Task 15) consomme `carryIn`/`closed`, n'utilise plus `PrevMonthDelta`.
- `isMonthOpen` (Task 8) consommé par les handlers (Task 9) et implicitement la logique UI (Tasks 15/16 via `closed`).
- `materializeRecurring`/`isTriggerMonth` (Tasks 4/5) consommés par `reconcile` (Task 6).
- `recurringCreateSchema`/`occurrenceConfirmSchema` (Task 10) consommés par les routes (Tasks 11/12/13).
- `monthDiff` (Task 2) consommé par `isTriggerMonth` (Task 4).
- Garde `@@unique([recurringId, month])` (Task 1) ⇒ accès `findUnique({ where: { recurringId_month: { recurringId, month } } })` (Task 5).

**Dépendance DB :** Tasks 1 (Step 3), 19, 20 (Step 2) nécessitent `DATABASE_URL` dev → exécutées par le mainteneur. Le reste est faisable à prisma mocké + `prisma generate`.
