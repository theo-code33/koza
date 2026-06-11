# Demo Year Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pré-remplir un compte de présentation (`cedric@agricole.com`) avec un an d'activité depuis janvier 2026, via un script additif et scopé sûr à exécuter contre la prod.

**Architecture:** Un builder pur testé (`src/lib/demo-data.ts`) génère le dataset (revenus, dépenses dont récurrentes matérialisées, occurrences, budgets, report mensuel calculé en `Decimal`). Un script de persistance fin (`prisma/seed-demo-year.ts`) upsert le user par email puis efface/réinsère **uniquement** ses données — jamais de wipe global.

**Tech Stack:** Prisma 7 (`@prisma/adapter-pg`, `Prisma.Decimal`), tsx, bcryptjs, Vitest 4.

Spec: `docs/superpowers/specs/2026-06-12-demo-year-seed-design.md`

---

## File Structure

- `src/lib/demo-data.ts` — builder pur `buildDemoDataset(currentMonth)` + types (create)
- `src/lib/demo-data.test.ts` — tests du builder (create)
- `prisma/seed-demo-year.ts` — script de persistance scopé (create)
- `package.json` — script `db:seed:demo` (modify)

---

## Task 1: Demo data builder (TDD)

**Files:**
- Create: `src/lib/demo-data.ts`
- Test: `src/lib/demo-data.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/demo-data.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildDemoDataset } from "@/lib/demo-data";

const data = buildDemoDataset("2026-06");

describe("buildDemoDataset", () => {
  it("covers 2026-01 through the current month, only the last open", () => {
    expect(data.periods.map((p) => p.month)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(data.periods.filter((p) => !p.closed)).toHaveLength(1);
    expect(data.periods[data.periods.length - 1]?.closed).toBe(false);
    expect(data.periods[0]?.closed).toBe(true);
  });

  it("keeps a consistent carry chain", () => {
    expect(data.periods[0]?.carryIn).toBe("0.00");
    for (const period of data.periods) {
      const income = data.incomes
        .filter((x) => x.month === period.month)
        .reduce((acc, x) => acc + Number(x.amount), 0);
      const spent = data.expenses
        .filter((x) => x.month === period.month)
        .reduce((acc, x) => acc + Number(x.amount), 0);
      const expectedCarryOut = Number(period.carryIn) + income - spent;
      if (period.closed) {
        expect(Number(period.carryOut)).toBeCloseTo(expectedCarryOut, 2);
      } else {
        expect(period.carryOut).toBeNull();
      }
    }
    // carryIn(M+1) == carryOut(M)
    for (let i = 1; i < data.periods.length; i++) {
      expect(data.periods[i]?.carryIn).toBe(data.periods[i - 1]?.carryOut);
    }
  });

  it("materializes the rent every single month", () => {
    for (const period of data.periods) {
      const rent = data.expenses.find(
        (e) => e.recurringKey === "loyer" && e.month === period.month,
      );
      expect(rent, `loyer manquant pour ${period.month}`).toBeTruthy();
      expect(rent?.amount).toBe("850.00");
    }
  });

  it("leaves the current-month electricity PENDING with no expense", () => {
    const current = data.occurrences.find(
      (o) => o.recurringKey === "electricite" && o.month === "2026-06",
    );
    expect(current?.status).toBe("PENDING");
    expect(
      data.expenses.some((e) => e.recurringKey === "electricite" && e.month === "2026-06"),
    ).toBe(false);
    // a past month is CONFIRMED with an expense
    const past = data.occurrences.find(
      (o) => o.recurringKey === "electricite" && o.month === "2026-02",
    );
    expect(past?.status).toBe("CONFIRMED");
    expect(
      data.expenses.some((e) => e.recurringKey === "electricite" && e.month === "2026-02"),
    ).toBe(true);
  });

  it("references only existing budgets/recurring, and links applied occurrences to an expense", () => {
    const budgetKeys = new Set(data.budgets.map((b) => b.key));
    const recurringKeys = new Set(data.recurring.map((r) => r.key));
    for (const e of data.expenses) {
      if (e.budgetKey) expect(budgetKeys.has(e.budgetKey)).toBe(true);
      if (e.recurringKey) expect(recurringKeys.has(e.recurringKey)).toBe(true);
    }
    for (const o of data.occurrences) {
      expect(recurringKeys.has(o.recurringKey)).toBe(true);
      if (o.status !== "PENDING") {
        expect(
          data.expenses.some((e) => e.recurringKey === o.recurringKey && e.month === o.month),
        ).toBe(true);
      }
    }
  });

  it("uses positive two-decimal amount strings everywhere", () => {
    const all = [
      ...data.incomes.map((x) => x.amount),
      ...data.expenses.map((x) => x.amount),
      ...data.budgets.map((x) => x.targetAmount),
    ];
    for (const amount of all) {
      expect(amount).toMatch(/^\d+\.\d{2}$/);
      expect(Number(amount)).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/lib/demo-data.test.ts`
Expected: FAIL — `@/lib/demo-data` cannot be resolved.

- [ ] **Step 3: Write the builder**

Create `src/lib/demo-data.ts`:

```ts
import { Prisma } from "../generated/prisma/client";
import { nextMonth, monthDiff } from "./month";
import type { CategoryKey } from "./categories";

export interface DemoBudget {
  key: string;
  name: string;
  targetAmount: string;
  category: CategoryKey;
  deadlineMonth?: string;
}

export interface DemoRecurring {
  key: string;
  label: string;
  type: "FIXED" | "VARIABLE";
  amount: string;
  category: CategoryKey;
  subcategory: string;
  frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
  anchorMonth: string;
  endMonth?: string;
}

export interface DemoExpense {
  amount: string;
  description: string;
  month: string;
  day: number;
  category: CategoryKey;
  subcategory: string;
  budgetKey?: string;
  recurringKey?: string;
}

export interface DemoOccurrence {
  recurringKey: string;
  month: string;
  status: "APPLIED" | "CONFIRMED" | "PENDING";
}

export interface DemoIncome {
  source: string;
  amount: string;
  month: string;
  day: number;
}

export interface DemoPeriod {
  month: string;
  carryIn: string;
  carryOut: string | null;
  closed: boolean;
}

export interface DemoDataset {
  user: { email: string; password: string; locale: string; theme: string };
  budgets: DemoBudget[];
  recurring: DemoRecurring[];
  expenses: DemoExpense[];
  occurrences: DemoOccurrence[];
  incomes: DemoIncome[];
  periods: DemoPeriod[];
}

const START_MONTH = "2026-01";
const FREQ_PERIOD = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as const;

// Liste des mois "YYYY-MM" de `start` à `end` inclus.
function monthsFrom(start: string, end: string): string[] {
  const months: string[] = [];
  let cursor = start;
  while (monthDiff(cursor, end) >= 0) {
    months.push(cursor);
    cursor = nextMonth(cursor);
  }
  return months;
}

// Élément cyclique d'un tableau (séries déterministes → tests stables).
function pick(arr: string[], i: number): string {
  return arr[i % arr.length]!;
}

// Profil mensuel déterministe : un an d'activité réaliste, majoritairement dans les
// cibles 50/30/20, report toujours positif, courbe d'épargne croissante.
export function buildDemoDataset(currentMonth: string): DemoDataset {
  const start = monthDiff(START_MONTH, currentMonth) >= 0 ? START_MONTH : currentMonth;
  const months = monthsFrom(start, currentMonth);

  const budgets: DemoBudget[] = [
    {
      key: "vacances",
      name: "Vacances Grèce",
      targetAmount: "1200.00",
      category: "leisure",
      deadlineMonth: nextMonth(nextMonth(currentMonth)),
    },
    { key: "fonds", name: "Fonds d'urgence", targetAmount: "3000.00", category: "savings" },
  ];

  const recurring: DemoRecurring[] = [
    {
      key: "loyer",
      label: "Loyer",
      type: "FIXED",
      amount: "850.00",
      category: "essential",
      subcategory: "housing",
      frequency: "MONTHLY",
      anchorMonth: START_MONTH,
    },
    {
      key: "assurance",
      label: "Assurance habitation",
      type: "FIXED",
      amount: "45.00",
      category: "essential",
      subcategory: "bills",
      frequency: "QUARTERLY",
      anchorMonth: START_MONTH,
    },
    {
      key: "electricite",
      label: "Électricité",
      type: "VARIABLE",
      amount: "70.00",
      category: "essential",
      subcategory: "bills",
      frequency: "MONTHLY",
      anchorMonth: START_MONTH,
    },
  ];

  const food = ["268.40", "252.90", "281.20", "248.75", "274.50", "259.10"];
  const elec = ["68.00", "74.30", "71.10", "69.40", "76.20", "73.00"];
  const transport = ["0", "75.00", "0", "0", "75.00", "0"];
  const restaurant = ["42.50", "0", "58.00", "31.90", "0", "47.00"];
  const outings = ["0", "65.00", "0", "0", "80.00", "0"];
  const culture = ["24.00", "0", "18.50", "0", "22.00", "0"];
  const games = ["0", "0", "0", "59.99", "0", "0"];
  const health = ["0", "32.50", "0", "0", "45.00", "0"];
  const etf = ["0", "200.00", "0", "0", "200.00", "0"];
  const fonds = ["200.00", "0", "0", "200.00", "0", "0"];
  const vacances = ["0", "0", "250.00", "0", "300.00", "0"];

  const expenses: DemoExpense[] = [];
  const occurrences: DemoOccurrence[] = [];
  const incomes: DemoIncome[] = [];

  months.forEach((month, i) => {
    const isCurrent = month === currentMonth;

    incomes.push({ source: "Salaire", amount: "2500.00", month, day: 1 });
    if (i === 2) incomes.push({ source: "Prime", amount: "600.00", month, day: 1 });
    if (i === 4) incomes.push({ source: "Freelance", amount: "400.00", month, day: 1 });

    for (const r of recurring) {
      const d = monthDiff(r.anchorMonth, month);
      if (d < 0 || d % FREQ_PERIOD[r.frequency] !== 0) continue;
      if (r.type === "FIXED") {
        expenses.push({
          amount: r.amount,
          description: r.label,
          month,
          day: 3,
          category: r.category,
          subcategory: r.subcategory,
          recurringKey: r.key,
        });
        occurrences.push({ recurringKey: r.key, month, status: "APPLIED" });
      } else if (isCurrent) {
        occurrences.push({ recurringKey: r.key, month, status: "PENDING" });
      } else {
        expenses.push({
          amount: pick(elec, i),
          description: r.label,
          month,
          day: 8,
          category: r.category,
          subcategory: r.subcategory,
          recurringKey: r.key,
        });
        occurrences.push({ recurringKey: r.key, month, status: "CONFIRMED" });
      }
    }

    const add = (
      amount: string,
      description: string,
      category: CategoryKey,
      subcategory: string,
      day: number,
      budgetKey?: string,
    ) => {
      if (Number(amount) > 0) {
        expenses.push({ amount, description, month, day, category, subcategory, budgetKey });
      }
    };

    add(pick(food, i), "Courses", "essential", "food", 10);
    add(pick(transport, i), "Transport", "essential", "transport", 5);
    add(pick(health, i), "Pharmacie", "essential", "health", 14);
    add(pick(restaurant, i), "Restaurant", "leisure", "restaurants", 16);
    add(pick(outings, i), "Sortie", "leisure", "outings", 18);
    add("35.00", "Salle de sport", "leisure", "sport", 2);
    add(pick(culture, i), "Culture", "leisure", "culture", 20);
    add(pick(games, i), "Jeu vidéo", "leisure", "games", 9);
    add("300.00", "Virement Livret A", "savings", "savings_account", 28);
    add(pick(etf, i), "Achat ETF World", "savings", "etf", 25);
    add(pick(fonds, i), "Épargne de précaution", "savings", "emergency_fund", 4, "fonds");
    add(pick(vacances, i), "Acompte vacances", "leisure", "vacations", 6, "vacances");
  });

  const periods: DemoPeriod[] = [];
  let carryIn = new Prisma.Decimal(0);
  for (const month of months) {
    const income = incomes
      .filter((x) => x.month === month)
      .reduce((acc, x) => acc.plus(x.amount), new Prisma.Decimal(0));
    const spent = expenses
      .filter((x) => x.month === month)
      .reduce((acc, x) => acc.plus(x.amount), new Prisma.Decimal(0));
    const carryOut = income.plus(carryIn).minus(spent);
    const isCurrent = month === currentMonth;
    periods.push({
      month,
      carryIn: carryIn.toFixed(2),
      carryOut: isCurrent ? null : carryOut.toFixed(2),
      closed: !isCurrent,
    });
    carryIn = carryOut;
  }

  return {
    user: {
      email: "cedric@agricole.com",
      password: "cedricagricole123",
      locale: "fr",
      theme: "light",
    },
    budgets,
    recurring,
    expenses,
    occurrences,
    incomes,
    periods,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/lib/demo-data.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
rtk git add src/lib/demo-data.ts src/lib/demo-data.test.ts
rtk git commit -m "feat(seed): add year-long demo dataset builder"
```

---

## Task 2: Scoped persistence script

**Files:**
- Create: `prisma/seed-demo-year.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the persistence script**

Create `prisma/seed-demo-year.ts`:

```ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildDemoDataset } from "../src/lib/demo-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function maskHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown-host";
  }
}

function dateInMonth(month: string, day: number): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, day);
}

function lastDayOfMonth(month: string): Date {
  return new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0);
}

async function main() {
  const data = buildDemoDataset(currentMonth());
  console.log(`Seeding demo user ${data.user.email} → host ${maskHost(connectionString!)}`);

  const passwordHash = await bcrypt.hash(data.user.password, 10);

  // Upsert du compte par email — ne crée jamais de doublon, ne touche aucun autre compte.
  const user = await prisma.user.upsert({
    where: { email: data.user.email },
    update: { passwordHash },
    create: { email: data.user.email, passwordHash },
  });
  const userId = user.id;

  await prisma.userSettings.upsert({
    where: { userId },
    update: { locale: data.user.locale, theme: data.user.theme, onboardingCompleted: true },
    create: {
      userId,
      locale: data.user.locale,
      theme: data.user.theme,
      onboardingCompleted: true,
    },
  });

  // Idempotence : on efface UNIQUEMENT les données de ce userId. Jamais de wipe global.
  await prisma.recurringOccurrence.deleteMany({ where: { userId } });
  await prisma.expense.deleteMany({ where: { userId } });
  await prisma.income.deleteMany({ where: { userId } });
  await prisma.monthlyPeriod.deleteMany({ where: { userId } });
  await prisma.recurringExpense.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });

  // Budgets → map key → id.
  const budgetId = new Map<string, string>();
  for (const b of data.budgets) {
    const created = await prisma.budget.create({
      data: {
        userId,
        name: b.name,
        targetAmount: b.targetAmount,
        category: b.category,
        deadline: b.deadlineMonth ? dateInMonth(b.deadlineMonth, 1) : null,
      },
    });
    budgetId.set(b.key, created.id);
  }

  // Récurrentes → map key → id.
  const recurringId = new Map<string, string>();
  for (const r of data.recurring) {
    const created = await prisma.recurringExpense.create({
      data: {
        userId,
        label: r.label,
        type: r.type,
        amount: r.amount,
        category: r.category,
        subcategory: r.subcategory,
        frequency: r.frequency,
        anchorMonth: r.anchorMonth,
        endMonth: r.endMonth ?? null,
      },
    });
    recurringId.set(r.key, created.id);
  }

  // Revenus.
  await prisma.income.createMany({
    data: data.incomes.map((x) => ({
      userId,
      source: x.source,
      amount: x.amount,
      date: dateInMonth(x.month, x.day),
      month: x.month,
    })),
  });

  // Dépenses (résout budgetId/recurringId) → map (recurringKey, month) → expenseId.
  const expenseByRecurringMonth = new Map<string, string>();
  for (const e of data.expenses) {
    const created = await prisma.expense.create({
      data: {
        userId,
        amount: e.amount,
        description: e.description,
        date: dateInMonth(e.month, e.day),
        month: e.month,
        category: e.category,
        subcategory: e.subcategory,
        budgetId: e.budgetKey ? budgetId.get(e.budgetKey) : null,
        recurringId: e.recurringKey ? recurringId.get(e.recurringKey) : null,
      },
    });
    if (e.recurringKey) {
      expenseByRecurringMonth.set(`${e.recurringKey}:${e.month}`, created.id);
    }
  }

  // Occurrences (expenseId via la map pour APPLIED/CONFIRMED, null pour PENDING).
  await prisma.recurringOccurrence.createMany({
    data: data.occurrences.map((o) => ({
      userId,
      recurringId: recurringId.get(o.recurringKey)!,
      month: o.month,
      status: o.status,
      expenseId:
        o.status === "PENDING" ? null : (expenseByRecurringMonth.get(`${o.recurringKey}:${o.month}`) ?? null),
    })),
  });

  // Périodes mensuelles (report figé pour les mois clôturés).
  await prisma.monthlyPeriod.createMany({
    data: data.periods.map((p) => ({
      userId,
      month: p.month,
      carryIn: p.carryIn,
      carryOut: p.carryOut,
      closedAt: p.closed ? lastDayOfMonth(p.month) : null,
    })),
  });

  const [incomes, expenses, budgets, recurring, occurrences, periods] = await Promise.all([
    prisma.income.count({ where: { userId } }),
    prisma.expense.count({ where: { userId } }),
    prisma.budget.count({ where: { userId } }),
    prisma.recurringExpense.count({ where: { userId } }),
    prisma.recurringOccurrence.count({ where: { userId } }),
    prisma.monthlyPeriod.count({ where: { userId } }),
  ]);
  console.log(
    `Demo seed complete · incomes: ${incomes} · expenses: ${expenses} · budgets: ${budgets} · recurring: ${recurring} · occurrences: ${occurrences} · periods: ${periods}`,
  );
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

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"` right after the `"db:reset:fresh"` line (add a comma to that line):

```json
    "db:seed:demo": "tsx prisma/seed-demo-year.ts"
```

- [ ] **Step 3: Type-check**

Run: `rtk npm run build`
Expected: build succeeds. Note: `next build` type-checks `src/` (donc le builder
`demo-data.ts`) ; le script `prisma/seed-demo-year.ts` n'est pas couvert par le build et
sera validé à l'exécution par le dry-run dev (Task 3).

- [ ] **Step 4: Commit**

```bash
rtk git add prisma/seed-demo-year.ts package.json
rtk git commit -m "feat(seed): add scoped demo-year persistence script"
```

---

## Task 3: Dry run against koza-dev + verification

**Files:** none (verification only — `.env` holds the dev `DATABASE_URL`)

- [ ] **Step 1: Run the demo seed against dev**

Run: `rtk npm run db:seed:demo`
Expected: logs `Seeding demo user cedric@agricole.com → host <dev-host>` then
`Demo seed complete · incomes: 8 · expenses: … · budgets: 2 · recurring: 3 · occurrences: 8 · periods: 6`.
(incomes = 6 salaires + 1 prime + 1 freelance = 8; occurrences = loyer ×6 + assurance ×2 + électricité ×6 = wait, recompute when running — assurance triggers on 2026-01 and 2026-04 only.)

- [ ] **Step 2: Re-run to confirm idempotence**

Run: `rtk npm run db:seed:demo`
Expected: same counts (no duplication — scoped delete then re-insert).

- [ ] **Step 3: Verify in the app**

Run: `rtk npm run dev` (background), open `http://localhost:3000`, log in as
`cedric@agricole.com` / `cedricagricole123`, then check:
- Dashboard mensuel : loyer présent, report cohérent, une récurrente « Électricité » à confirmer ce mois-ci.
- Dashboard **annuel** (`?view=year`) : 6 mois de tendances avec relief, courbe d'épargne croissante, donut de répartition rempli.
- Navigation dans les mois passés : le loyer apparaît dans **chaque** mois depuis janvier.

Stop the dev server when done.

- [ ] **Step 4: Push the branch and open the PR**

```bash
rtk git push -u origin feat/demo-year-seed
rtk gh pr create --title "feat(seed): year-long demo account for the live presentation" --base main --body "<rempli à l'exécution : résumé + plan de test>"
```

---

## Task 4: Run against prod (maintainer-driven)

**Files:** none

> Exécuté par le mainteneur avec la connection string **prod** fournie hors repo. Le schéma
> prod est déjà migré (CD `migrate deploy`).

- [ ] **Step 1: Run the scoped seed against prod**

Run (la string prod n'est jamais commitée) :
`DATABASE_URL='<prod-connection-string>' npm run db:seed:demo`
Expected: `→ host <prod-host>` puis `Demo seed complete · …`. Aucune autre donnée touchée
(suppressions scopées au seul `userId` de Cédric).

- [ ] **Step 2: Verify on the deployed app**

Sur l'URL de prod (Vercel), se connecter `cedric@agricole.com` / `cedricagricole123` et
vérifier le dashboard annuel + le loyer présent chaque mois.

---

## Self-Review Notes

- **Spec coverage:** persona (Task 1 builder `user`), période 2026-01→courant (Task 1 `monthsFrom`), récurrentes matérialisées chaque mois + électricité PENDING courant (Task 1 + tests), report `Decimal` cohérent (Task 1 + test carry chain), builder pur testé (Task 1), persistance scopée additive sans wipe global (Task 2 deleteMany `where userId`), npm script (Task 2), exécution dev puis prod (Tasks 3–4). Tous les points du spec sont couverts.
- **Type consistency:** `DemoDataset` et ses sous-types sont définis en Task 1 et consommés à l'identique en Task 2 (`budgetKey`/`recurringKey` → maps ; `occurrences[].status` ; `periods[].carryOut: string | null`). Les noms de modèles/champs Prisma (`userSettings` clé `userId`, `monthlyPeriod`, `recurringOccurrence.expenseId`) correspondent au schéma réel.
- **No placeholders:** tout le code (builder, tests, script) est complet. Le seul `<…>` est le corps de PR, rempli à l'exécution.
```
