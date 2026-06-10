# kōza — Dashboard mensuel + navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer l'écran `/dashboard` mensuel (revenus, donut dépenses par catégorie + solde, cartes dépensé/objectif 50/30/20, delta discret vs mois précédent, navigation entre mois) et la vraie coquille de navigation (bottom nav / sidebar) partagée par toutes les pages via un route group `(main)`.

**Architecture:** Route group `(main)` avec `layout.tsx` Server (gate onboarding + `AppNav`). `/dashboard` est un Server Component `force-dynamic` qui lit `?month=`, appelle `getMonthlySummary` (lib testée avec libs mockées) et passe des DTO strings à des composants client (donut Recharts, cartes, delta, wrapper de navigation mois). `/` redirige vers `/dashboard`. Montants en `Decimal`, DTO en strings.

**Tech Stack:** Next 16 App Router, React 19, Prisma 7, Recharts 3 (à installer), Tailwind v4, Vitest + Testing Library, lucide-react.

---

## Conventions pour chaque commit de ce plan

- Branche : **`feat/dashboard-monthly`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, impératif, minuscules, ≤72 car., scope dans (`dashboard`, `nav`, `charts`, `lib`, `api`).
- **Aucun trailer `Co-authored-by`.** Merge commit, pas de squash. PR via `gh`, merge manuel.
- Avant chaque commit : `npm run format`, puis `npm run lint` (0 erreur ; un warning `react-hooks/incompatible-library` pré-existant est toléré) et `npm run test` au vert.
- **Pages Server lisant Prisma + composants pur-lib/TS : lancer `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build` avant de committer** (Vitest ne type-checke pas ; `noUncheckedIndexedAccess`).
- Pages/layouts Server lisant Prisma : `export const dynamic = "force-dynamic";`. Composants client : aucun import **de valeur** depuis `@/generated/prisma`.

## File Structure

- `src/lib/month.ts` (modify) + `src/lib/month.adjacent.test.ts` — `previousMonth`, `nextMonth`.
- `src/lib/formatters.ts` (modify) + `src/lib/formatters.month.test.ts` — `formatMonth`.
- `src/lib/dashboard.ts` (create) + `src/lib/dashboard.test.ts` — `getMonthlySummary`.
- `package.json` (modify) — dépendance `recharts`.
- `src/components/charts/category-donut.tsx` (create) + test.
- `src/components/dashboard/category-progress-card.tsx` (create) + test.
- `src/components/dashboard/prev-month-delta.tsx` (create) + test.
- `src/components/dashboard/dashboard-month-nav.tsx` (create) + test.
- `src/components/nav/app-nav.tsx` (create) + test.
- `src/app/(main)/layout.tsx` (create) ; `src/app/expenses|budgets|incomes` → déplacés sous `src/app/(main)/`.
- `src/app/(main)/dashboard/page.tsx` (create) ; `src/app/page.tsx` (modify, redirect).

---

### Task 1: `previousMonth` + `nextMonth`

**Files:** Modify `src/lib/month.ts`, Create `src/lib/month.adjacent.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/month.adjacent.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { previousMonth, nextMonth } from "@/lib/month";

describe("previousMonth", () => {
  it("decrements and crosses the year boundary", () => {
    expect(previousMonth("2026-06")).toBe("2026-05");
    expect(previousMonth("2026-01")).toBe("2025-12");
  });
});

describe("nextMonth", () => {
  it("increments and crosses the year boundary", () => {
    expect(nextMonth("2026-06")).toBe("2026-07");
    expect(nextMonth("2026-12")).toBe("2027-01");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/month.adjacent.test.ts`
Expected: FAIL — `previousMonth`/`nextMonth` non exportés.

- [ ] **Step 3: Implémenter**

Ajouter à la fin de `src/lib/month.ts` :
```ts
// Mois précédent "YYYY-MM" (gère le passage d'année).
export function previousMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const date = new Date(year, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Mois suivant "YYYY-MM" (gère le passage d'année).
export function nextMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const date = new Date(year, m, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/month.adjacent.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/month.ts src/lib/month.adjacent.test.ts
git commit -m "feat(lib): add previousMonth and nextMonth helpers"
```

---

### Task 2: `formatMonth`

**Files:** Modify `src/lib/formatters.ts`, Create `src/lib/formatters.month.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/formatters.month.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { formatMonth } from "@/lib/formatters";

describe("formatMonth", () => {
  it("formats a YYYY-MM into a long French label", () => {
    const label = formatMonth("2026-06");
    expect(label.toLowerCase()).toContain("juin");
    expect(label).toContain("2026");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/formatters.month.test.ts`
Expected: FAIL — `formatMonth` non exporté.

- [ ] **Step 3: Implémenter**

Ajouter à la fin de `src/lib/formatters.ts` :
```ts
// Formate "YYYY-MM" en libellé long ("juin 2026" en FR).
export function formatMonth(month: string, locale: "fr" | "en" = "fr"): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, m - 1, 1));
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/formatters.month.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/formatters.ts src/lib/formatters.month.test.ts
git commit -m "feat(lib): add formatMonth helper"
```

---

### Task 3: `getMonthlySummary`

**Files:** Create `src/lib/dashboard.ts`, `src/lib/dashboard.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/dashboard.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/incomes", () => ({ listMonthIncomes: vi.fn() }));
vi.mock("@/lib/expenses", () => ({ listMonthExpenses: vi.fn() }));

import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { getMonthlySummary } from "@/lib/dashboard";

describe("getMonthlySummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates income, spend per category, balance and previous total", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([{ amount: "2000" }] as never);
    vi.mocked(listMonthExpenses).mockImplementation(((month: string) =>
      Promise.resolve(
        month === "2026-06"
          ? [
              { amount: "500", category: "essential" },
              { amount: "100", category: "leisure" },
            ]
          : [{ amount: "400", category: "essential" }],
      )) as never);

    const summary = await getMonthlySummary("2026-06");

    expect(summary.income.toString()).toBe("2000");
    expect(summary.totalSpent.toString()).toBe("600");
    expect(summary.balance.toString()).toBe("1400");
    expect(summary.previousTotalSpent.toString()).toBe("400");
    const essential = summary.categories.find((c) => c.category === "essential");
    expect(essential?.spent.toString()).toBe("500");
    expect(essential?.target.toString()).toBe("1000");
  });

  it("returns zero targets when there is no income", async () => {
    vi.mocked(listMonthIncomes).mockResolvedValue([] as never);
    vi.mocked(listMonthExpenses).mockResolvedValue([] as never);

    const summary = await getMonthlySummary("2026-06");

    expect(summary.income.toString()).toBe("0");
    expect(summary.categories[0]?.target.toString()).toBe("0");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/dashboard.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/dashboard.ts` :
```ts
import { Prisma } from "@/generated/prisma/client";
import { listMonthIncomes } from "@/lib/incomes";
import { listMonthExpenses } from "@/lib/expenses";
import { computeEnvelopes } from "@/lib/budget";
import { previousMonth } from "@/lib/month";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface CategorySpend {
  category: CategoryKey;
  spent: Prisma.Decimal;
  target: Prisma.Decimal;
}

export interface MonthlySummary {
  month: string;
  income: Prisma.Decimal;
  totalSpent: Prisma.Decimal;
  balance: Prisma.Decimal;
  categories: CategorySpend[];
  previousTotalSpent: Prisma.Decimal;
}

function sum(amounts: { amount: Prisma.Decimal | string }[]): Prisma.Decimal {
  return amounts.reduce((acc, item) => acc.plus(item.amount), new Prisma.Decimal(0));
}

// Synthèse mensuelle : revenus, dépenses par catégorie vs objectifs 50/30/20, solde, total du mois précédent.
export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const [incomes, expenses, previousExpenses] = await Promise.all([
    listMonthIncomes(month),
    listMonthExpenses(month),
    listMonthExpenses(previousMonth(month)),
  ]);

  const income = sum(incomes);
  const totalSpent = sum(expenses);
  const envelopes = computeEnvelopes(income);

  const categories: CategorySpend[] = CATEGORY_ORDER.map((category) => ({
    category,
    spent: sum(expenses.filter((expense) => expense.category === category)),
    target: envelopes[category],
  }));

  return {
    month,
    income,
    totalSpent,
    balance: income.minus(totalSpent),
    categories,
    previousTotalSpent: sum(previousExpenses),
  };
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/dashboard.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Build, format, lint, commit**

```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/dashboard.ts src/lib/dashboard.test.ts
git commit -m "feat(lib): add getMonthlySummary helper"
```

---

### Task 4: Installer Recharts 3

**Files:** Modify `package.json`, `package-lock.json`

- [ ] **Step 1: Installer**

Run: `npm install recharts@^3`
Expected: `recharts` ajouté dans `dependencies`, exit 0.

- [ ] **Step 2: Vérifier**

Run: `node -e "console.log(require('recharts/package.json').version)"`
Expected: une version `3.x`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add recharts 3"
```

---

### Task 5: `CategoryDonut`

**Files:** Create `src/components/charts/category-donut.tsx`, `src/components/charts/category-donut.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/charts/category-donut.test.tsx` :
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryDonut } from "@/components/charts/category-donut";

describe("CategoryDonut", () => {
  it("renders the balance in the center", () => {
    render(
      <CategoryDonut
        slices={[
          { category: "essential", amount: 500 },
          { category: "leisure", amount: 100 },
          { category: "savings", amount: 0 },
        ]}
        balance={1400}
      />,
    );
    expect(screen.getByText(/restant/)).toBeInTheDocument();
    expect(screen.getByText(/1\s?400,00/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/charts/category-donut.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/charts/category-donut.tsx` :
```tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatEUR } from "@/lib/formatters";
import type { CategoryKey } from "@/lib/categories";

interface DonutSlice {
  category: CategoryKey;
  amount: number;
}

interface CategoryDonutProps {
  slices: DonutSlice[];
  balance: number;
}

export function CategoryDonut({ slices, balance }: CategoryDonutProps) {
  const total = slices.reduce((acc, slice) => acc + slice.amount, 0);
  const data =
    total > 0
      ? slices.filter((slice) => slice.amount > 0)
      : [{ category: "empty" as const, amount: 1 }];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            innerRadius="74%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            paddingAngle={total > 0 ? 2 : 0}
          >
            {data.map((slice) => (
              <Cell
                key={slice.category}
                fill={total > 0 ? `var(--color-${slice.category})` : "var(--color-surface-alt)"}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`num text-[28px] font-light ${balance < 0 ? "text-over" : "text-text"}`}>
          {formatEUR(balance)}
        </span>
        <span className="text-[12px] text-text-secondary">restant</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/charts/category-donut.test.tsx`
Expected: PASS (1 test). Recharts peut logger un warning de dimensions en jsdom — sans impact.

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/charts/category-donut.tsx src/components/charts/category-donut.test.tsx
git commit -m "feat(charts): add category donut with center balance"
```

---

### Task 6: `CategoryProgressCard`

**Files:** Create `src/components/dashboard/category-progress-card.tsx`, `src/components/dashboard/category-progress-card.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/dashboard/category-progress-card.test.tsx` :
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryProgressCard } from "@/components/dashboard/category-progress-card";

describe("CategoryProgressCard", () => {
  it("shows label, spent over target and a progress bar", () => {
    render(<CategoryProgressCard category="essential" spent="500.00" target="1000.00" />);
    expect(screen.getByText("Essentiels")).toBeInTheDocument();
    expect(screen.getByText(/500,00/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("uses the soft over tone when spent exceeds target", () => {
    render(<CategoryProgressCard category="leisure" spent="400.00" target="300.00" />);
    const ratio = screen.getByText(/400,00/);
    expect(ratio.className).toContain("text-over");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/dashboard/category-progress-card.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/dashboard/category-progress-card.tsx` :
```tsx
import { CatDot } from "@/components/ui/cat-dot";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatEUR } from "@/lib/formatters";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

interface CategoryProgressCardProps {
  category: CategoryKey;
  spent: string;
  target: string;
}

export function CategoryProgressCard({ category, spent, target }: CategoryProgressCardProps) {
  const config = CATEGORIES[category];
  const over = Number(spent) > Number(target);

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CatDot category={category} />
          <span className="text-[15px] font-medium text-text">{config.label}</span>
        </div>
        <span className={`num text-[13px] ${over ? "text-over" : "text-text-secondary"}`}>
          {formatEUR(spent)} / {formatEUR(target)}
        </span>
      </div>
      <ProgressBar value={Number(spent)} max={Number(target)} fillClass={config.dotClass} />
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/dashboard/category-progress-card.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/dashboard/category-progress-card.tsx src/components/dashboard/category-progress-card.test.tsx
git commit -m "feat(dashboard): add category progress card"
```

---

### Task 7: `PrevMonthDelta`

**Files:** Create `src/components/dashboard/prev-month-delta.tsx`, `src/components/dashboard/prev-month-delta.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/dashboard/prev-month-delta.test.tsx` :
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrevMonthDelta } from "@/components/dashboard/prev-month-delta";

describe("PrevMonthDelta", () => {
  it("says less when spending dropped", () => {
    render(<PrevMonthDelta current="400.00" previous="500.00" />);
    expect(screen.getByText(/de moins que le mois dernier/)).toBeInTheDocument();
  });

  it("says more when spending rose", () => {
    render(<PrevMonthDelta current="600.00" previous="500.00" />);
    expect(screen.getByText(/de plus que le mois dernier/)).toBeInTheDocument();
  });

  it("renders nothing when both totals are zero", () => {
    const { container } = render(<PrevMonthDelta current="0" previous="0" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/dashboard/prev-month-delta.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/dashboard/prev-month-delta.tsx` :
```tsx
import { formatEUR } from "@/lib/formatters";

interface PrevMonthDeltaProps {
  current: string;
  previous: string;
}

export function PrevMonthDelta({ current, previous }: PrevMonthDeltaProps) {
  const diff = Number(current) - Number(previous);
  if (Number(current) === 0 && Number(previous) === 0) return null;
  if (diff === 0) {
    return <p className="text-[13px] text-text-secondary">Autant que le mois dernier.</p>;
  }
  const amount = formatEUR(Math.abs(diff));
  const label =
    diff < 0
      ? `${amount} de moins que le mois dernier`
      : `${amount} de plus que le mois dernier`;
  return <p className="text-[13px] text-text-secondary">{label}</p>;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/dashboard/prev-month-delta.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/dashboard/prev-month-delta.tsx src/components/dashboard/prev-month-delta.test.tsx
git commit -m "feat(dashboard): add previous month delta line"
```

---

### Task 8: `DashboardMonthNav`

**Files:** Create `src/components/dashboard/dashboard-month-nav.tsx`, `src/components/dashboard/dashboard-month-nav.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/dashboard/dashboard-month-nav.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { DashboardMonthNav } from "@/components/dashboard/dashboard-month-nav";
import { currentMonth, previousMonth } from "@/lib/month";

describe("DashboardMonthNav", () => {
  beforeEach(() => push.mockClear());

  it("navigates to the previous month", async () => {
    render(<DashboardMonthNav month="2026-04" />);
    await userEvent.click(screen.getByRole("button", { name: "Mois précédent" }));
    expect(push).toHaveBeenCalledWith(`/dashboard?month=${previousMonth("2026-04")}`);
  });

  it("disables next on the current month", () => {
    render(<DashboardMonthNav month={currentMonth()} />);
    expect(screen.getByRole("button", { name: "Mois suivant" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/dashboard/dashboard-month-nav.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/dashboard/dashboard-month-nav.tsx` :
```tsx
"use client";

import { useRouter } from "next/navigation";
import { MonthNav } from "@/components/ui/month-nav";
import { formatMonth } from "@/lib/formatters";
import { previousMonth, nextMonth, currentMonth } from "@/lib/month";

interface DashboardMonthNavProps {
  month: string;
}

export function DashboardMonthNav({ month }: DashboardMonthNavProps) {
  const router = useRouter();
  const canNext = month < currentMonth();
  return (
    <MonthNav
      title={formatMonth(month)}
      canPrev
      canNext={canNext}
      onPrev={() => router.push(`/dashboard?month=${previousMonth(month)}`)}
      onNext={() => router.push(`/dashboard?month=${nextMonth(month)}`)}
    />
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/dashboard/dashboard-month-nav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/dashboard/dashboard-month-nav.tsx src/components/dashboard/dashboard-month-nav.test.tsx
git commit -m "feat(dashboard): add month navigation wrapper"
```

---

### Task 9: `AppNav`

**Files:** Create `src/components/nav/app-nav.tsx`, `src/components/nav/app-nav.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/nav/app-nav.test.tsx` :
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

import { AppNav } from "@/components/nav/app-nav";

describe("AppNav", () => {
  it("renders the four destinations (sidebar + bottom nav)", () => {
    render(<AppNav />);
    expect(screen.getAllByRole("link", { name: "Tableau de bord" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Dépenses" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Budgets" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Revenus" })).toHaveLength(2);
  });

  it("marks the active destination", () => {
    render(<AppNav />);
    screen
      .getAllByRole("link", { name: "Tableau de bord" })
      .forEach((link) => expect(link).toHaveAttribute("aria-current", "page"));
    screen
      .getAllByRole("link", { name: "Dépenses" })
      .forEach((link) => expect(link).not.toHaveAttribute("aria-current"));
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/nav/app-nav.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/nav/app-nav.tsx` :
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Target, Wallet, type LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/expenses", label: "Dépenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/incomes", label: "Revenus", icon: Wallet },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`tap flex flex-col items-center gap-1 ${active ? "text-accent" : "text-text-secondary"}`}
    >
      <Icon size={22} strokeWidth={1.7} />
      {active ? <span className="text-[11px] font-medium">{item.label}</span> : null}
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed left-0 top-0 z-40 hidden h-screen w-20 flex-col items-center gap-6 border-r border-line bg-surface py-8 lg:flex"
      >
        {ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
      <nav
        aria-label="Navigation principale (mobile)"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-surface py-3 lg:hidden"
      >
        {ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/nav/app-nav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/nav/app-nav.tsx src/components/nav/app-nav.test.tsx
git commit -m "feat(nav): add app navigation shell"
```

---

### Task 10: Route group `(main)` — layout + déplacement des pages

**Files:** Create `src/app/(main)/layout.tsx` ; déplacer `src/app/{expenses,budgets,incomes}` sous `src/app/(main)/`.

- [ ] **Step 1: Déplacer les pages existantes dans le route group**

```bash
mkdir -p "src/app/(main)"
git mv "src/app/expenses" "src/app/(main)/expenses"
git mv "src/app/budgets" "src/app/(main)/budgets"
git mv "src/app/incomes" "src/app/(main)/incomes"
```
(Les URLs `/expenses`, `/budgets`, `/incomes` restent inchangées : les route groups sont invisibles dans l'URL. Les imports sont en alias `@/`, rien à modifier.)

- [ ] **Step 2: Créer le layout partagé**

`src/app/(main)/layout.tsx` :
```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";
import { AppNav } from "@/components/nav/app-nav";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: ReactNode }) {
  if (!(await getOnboardingCompleted())) {
    redirect("/welcome");
  }
  return (
    <div className="lg:pl-20">
      <AppNav />
      <div className="pb-24 lg:pb-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Build avec DATABASE_URL factice**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: build OK, exit 0 ; `/expenses`, `/budgets`, `/incomes` toujours présentes en `ƒ` (Dynamic).

- [ ] **Step 4: Tests de régression + format, lint, commit**

```bash
npm run test
npm run format && npm run lint
git add "src/app/(main)"
git commit -m "feat(nav): add (main) route group with shared nav layout"
```
Expected test : toute la suite au vert (le déplacement ne touche pas les tests, qui importent via `@/`).

---

### Task 11: Écran `/dashboard` + redirection racine

**Files:** Create `src/app/(main)/dashboard/page.tsx`, Modify `src/app/page.tsx`

- [ ] **Step 1: Créer la page dashboard**

`src/app/(main)/dashboard/page.tsx` :
```tsx
import Link from "next/link";
import { Wallet } from "lucide-react";
import { getMonthlySummary } from "@/lib/dashboard";
import { currentMonth } from "@/lib/month";
import { SoftBanner } from "@/components/ui/soft-banner";
import { DashboardMonthNav } from "@/components/dashboard/dashboard-month-nav";
import { PrevMonthDelta } from "@/components/dashboard/prev-month-delta";
import { CategoryDonut } from "@/components/charts/category-donut";
import { CategoryProgressCard } from "@/components/dashboard/category-progress-card";

export const dynamic = "force-dynamic";

function resolveMonth(value: string | undefined): string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const month = resolveMonth(rawMonth);
  const summary = await getMonthlySummary(month);
  const income = Number(summary.income);
  const slices = summary.categories.map((category) => ({
    category: category.category,
    amount: Number(category.spent),
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-8 px-6 py-12">
      <DashboardMonthNav month={month} />

      {income === 0 ? (
        <Link href="/incomes">
          <SoftBanner icon={Wallet} tone="accent">
            Ajoute tes revenus pour voir tes objectifs 50/30/20.
          </SoftBanner>
        </Link>
      ) : (
        <PrevMonthDelta
          current={summary.totalSpent.toString()}
          previous={summary.previousTotalSpent.toString()}
        />
      )}

      <CategoryDonut slices={slices} balance={Number(summary.balance)} />

      <div className="flex flex-col gap-3">
        {summary.categories.map((category) => (
          <CategoryProgressCard
            key={category.category}
            category={category.category}
            spent={category.spent.toString()}
            target={category.target.toString()}
          />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Rediriger la racine vers le dashboard**

Remplacer **tout** `src/app/page.tsx` par :
```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```
(Le gate d'onboarding vit désormais dans `(main)/layout.tsx`, qui protège `/dashboard` et toutes les pages de l'app.)

- [ ] **Step 3: Build avec DATABASE_URL factice**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: build OK, exit 0 ; `/dashboard` listée en `ƒ` (Dynamic) ; `/` en redirection.

- [ ] **Step 4: Format, lint, commit**

```bash
npm run format && npm run lint
git add "src/app/(main)/dashboard/page.tsx" src/app/page.tsx
git commit -m "feat(dashboard): add monthly dashboard screen"
```

---

### Task 12: Vérification finale + PR

- [ ] **Step 1: Lint, build (DB factice), suite complète**

Run:
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: lint clean (hors warning pré-existant), build OK (`/dashboard`, `/expenses`, `/budgets`, `/incomes` en `ƒ`, `/` en redirection), tous les tests au vert.

- [ ] **Step 2: Vérification manuelle**

`npm run dev`, ouvrir `http://localhost:3000` :
- `/` redirige vers `/dashboard` ; le mois courant s'affiche avec le donut (dépenses du seed par catégorie + solde au centre), les 3 cartes dépensé/objectif, le delta vs mois précédent ;
- naviguer vers les mois précédents (chevron gauche) → les données changent ; le chevron droit est désactivé sur le mois courant ;
- la nav (bottom nav mobile `<lg`, sidebar `≥lg`) permet d'aller sur Dépenses / Budgets / Revenus et de revenir ; l'icône active est en `--color-accent` avec son label ;
- vérifier light + dark, mobile + desktop ; aucun rouge vif (dépassements en teinte douce). Arrêter le serveur. Si la base a été modifiée, relancer `npx prisma db seed`.

- [ ] **Step 3: Push et PR**

```bash
git push -u origin feat/dashboard-monthly
gh pr create --base main --head feat/dashboard-monthly \
  --title "feat(dashboard): add monthly dashboard and navigation shell" \
  --body "Ajoute l'écran /dashboard mensuel (donut des dépenses par catégorie + solde au centre, cartes dépensé vs objectifs 50/30/20, delta discret vs mois précédent, navigation entre mois via ?month=) et la vraie coquille de navigation (bottom nav mobile / sidebar desktop) partagée par un route group (main) qui porte aussi le gate d'onboarding. / redirige vers /dashboard. Helpers : getMonthlySummary, previousMonth/nextMonth, formatMonth. Ajout de recharts 3. Vue annuelle, report de surplus/déficit et page Réglages différés."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- Route group `(main)` + layout (gate onboarding + nav) → Task 10 ✅ · `/` → `/dashboard` → Task 11 ✅
- `AppNav` (4 icônes, bottom nav + sidebar, état actif) → Task 9 ✅
- `getMonthlySummary` + `previousMonth`/`nextMonth` + `formatMonth` → Tasks 3/1/2 ✅
- Donut Recharts (dépenses réelles, solde au centre, cas vide) → Tasks 4/5 ✅
- Cartes dépensé/objectif (dépassement doux) → Task 6 ✅ · delta global discret → Task 7 ✅
- Navigation mois via `?month=` + wrapper du `MonthNav` callback-based → Task 8 ✅
- Banner revenus = 0 → `/incomes` → Task 11 ✅
- Tests lib/composants + build DB factice → Tasks 1–11 ✅
- Différé (annuel, carry-over, par-catégorie, Réglages, next-intl) → hors plan, conforme ✅

**Scan placeholders :** aucun TBD/TODO ; code complet ; chaque step a commande + résultat attendu.

**Cohérence des types :**
- `MonthlySummary`/`CategorySpend` (Decimal) de `lib/dashboard` (Task 3) → DTO strings dans la page (Task 11) → `CategoryProgressCard` (`spent`/`target: string`, Task 6) et `CategoryDonut` (`slices: {category, amount:number}`, `balance:number`, Task 5).
- `getMonthlySummary` consomme `computeEnvelopes` (Envelopes indexées par `CategoryKey`) et `CATEGORY_ORDER` existants.
- `DashboardMonthNav` (Task 8) utilise `previousMonth`/`nextMonth` (Task 1), `formatMonth` (Task 2), `currentMonth` existant ; navigue vers `/dashboard?month=` cohérent avec la lecture `searchParams` de la page (Task 11).
- `AppNav` (Task 9) cible `/dashboard|/expenses|/budgets|/incomes` — toutes sous `(main)` (Tasks 10/11), URLs inchangées.
- `SoftBanner` rendu sans prop `action` (présentational pur) enveloppé dans `Link` → compatible Server Component (Task 11).
- `formatEUR` (import `type Prisma` only) sûr en composant client (`CategoryDonut`).
