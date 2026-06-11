# Annual Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an annual view to the dashboard (global breakdown, monthly trends, savings progress), reachable via a `Mois / Année` toggle.

**Architecture:** A new `lib/annual.ts` aggregates a year of expenses with one Prisma query and `Decimal` math. The `/dashboard` page branches on a `?view=year` searchParam (server-rendered, `force-dynamic` already set). Three sections render: the existing `CategoryDonut` (lightly generalized) for the breakdown, plus two new Recharts client components for trends and savings. Year navigation mirrors the existing month nav.

**Tech Stack:** Next.js 16 App Router (Server Components), Prisma 7 (`Decimal`), Recharts 3, next-intl 4, Vitest 4 + Testing Library.

Spec: `docs/superpowers/specs/2026-06-11-annual-dashboard-design.md`

---

## File Structure

- `src/lib/formatters.ts` — add `formatMonthShort` (modify)
- `src/lib/month.ts` — add `currentYear`, `previousYear`, `nextYear`, `yearOf` (modify)
- `src/lib/annual.ts` — new: `getAnnualSummary` + types (create)
- `src/lib/annual.test.ts` — new: data-layer unit tests (create)
- `src/locales/fr.json`, `src/locales/en.json` — new dashboard + common keys (modify)
- `src/components/charts/category-donut.tsx` — optional center props (modify)
- `src/components/charts/monthly-trend-chart.tsx` — new (create)
- `src/components/charts/savings-progress-chart.tsx` — new (create)
- `src/components/dashboard/dashboard-year-nav.tsx` — new (create)
- `src/components/dashboard/dashboard-view-toggle.tsx` — new (create)
- `src/app/(main)/dashboard/page.tsx` — branch on `view` (modify)
- Component smoke tests alongside each new component (create)

---

## Task 1: `formatMonthShort` formatter

**Files:**
- Modify: `src/lib/formatters.ts`
- Test: `src/lib/formatters.month.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/formatters.month.test.ts`:

```ts
import { formatMonthShort } from "@/lib/formatters";

describe("formatMonthShort", () => {
  it("formats a month as a short localized label in FR", () => {
    expect(formatMonthShort("2026-01", "fr")).toMatch(/janv/i);
  });

  it("formats a month as a short localized label in EN", () => {
    expect(formatMonthShort("2026-01", "en")).toMatch(/jan/i);
  });
});
```

> Note: keep the existing `import { describe, it, expect } from "vitest"` at the top of the file; do not duplicate it. Add only the missing named import and the new `describe` block.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/lib/formatters.month.test.ts`
Expected: FAIL — `formatMonthShort is not a function` / not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/formatters.ts`:

```ts
// Formate "YYYY-MM" en libellé de mois court localisé ("janv." en FR, "Jan" en EN).
export function formatMonthShort(month: string, locale: "fr" | "en" = "fr"): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
  }).format(new Date(year, m - 1, 1));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/lib/formatters.month.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/lib/formatters.ts src/lib/formatters.month.test.ts
rtk git commit -m "feat(formatters): add short localized month label"
```

---

## Task 2: Year helpers in `month.ts`

**Files:**
- Modify: `src/lib/month.ts`
- Test: `src/lib/year.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/lib/year.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { previousYear, nextYear, yearOf } from "@/lib/month";

describe("year helpers", () => {
  it("returns the previous year", () => {
    expect(previousYear("2026")).toBe("2025");
  });

  it("returns the next year", () => {
    expect(nextYear("2026")).toBe("2027");
  });

  it("extracts the year of a YYYY-MM month", () => {
    expect(yearOf("2026-03")).toBe("2026");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/lib/year.test.ts`
Expected: FAIL — helpers not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/month.ts`:

```ts
// Année courante "YYYY".
export function currentYear(): string {
  return String(new Date().getFullYear());
}

// Année précédente / suivante "YYYY".
export function previousYear(year: string): string {
  return String(Number(year) - 1);
}

export function nextYear(year: string): string {
  return String(Number(year) + 1);
}

// Année "YYYY" d'un mois "YYYY-MM".
export function yearOf(month: string): string {
  return month.slice(0, 4);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/lib/year.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/lib/month.ts src/lib/year.test.ts
rtk git commit -m "feat(month): add year navigation helpers"
```

---

## Task 3: `getAnnualSummary` data layer (core)

**Files:**
- Create: `src/lib/annual.ts`
- Test: `src/lib/annual.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/annual.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { expense: { findMany: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import { getAnnualSummary } from "@/lib/annual";

function mockExpenses(rows: { amount: string; category: string; month: string }[]) {
  vi.mocked(prisma.expense.findMany).mockResolvedValue(rows as never);
}

describe("getAnnualSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("totals spend per category in CATEGORY_ORDER", async () => {
    mockExpenses([
      { amount: "500", category: "essential", month: "2026-01" },
      { amount: "200", category: "leisure", month: "2026-02" },
      { amount: "300", category: "savings", month: "2026-03" },
      { amount: "100", category: "essential", month: "2026-04" },
    ]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.totals.map((t) => t.category)).toEqual(["essential", "leisure", "savings"]);
    expect(summary.totals[0]?.spent.toString()).toBe("600");
    expect(summary.totals[1]?.spent.toString()).toBe("200");
    expect(summary.totals[2]?.spent.toString()).toBe("300");
    expect(summary.totalSpent.toString()).toBe("1100");
  });

  it("produces 12 monthly points with zeros for empty months", async () => {
    mockExpenses([{ amount: "150", category: "leisure", month: "2026-03" }]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.monthly).toHaveLength(12);
    expect(summary.monthly[0]?.month).toBe("2026-01");
    expect(summary.monthly[11]?.month).toBe("2026-12");
    expect(summary.monthly[0]?.leisure.toString()).toBe("0");
    expect(summary.monthly[2]?.leisure.toString()).toBe("150");
  });

  it("accumulates savings cumulatively across 12 months", async () => {
    mockExpenses([
      { amount: "100", category: "savings", month: "2026-01" },
      { amount: "50", category: "savings", month: "2026-03" },
      { amount: "999", category: "essential", month: "2026-02" },
    ]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.savingsCumulative).toHaveLength(12);
    expect(summary.savingsCumulative[0]?.cumulative.toString()).toBe("100");
    expect(summary.savingsCumulative[1]?.cumulative.toString()).toBe("100");
    expect(summary.savingsCumulative[2]?.cumulative.toString()).toBe("150");
    expect(summary.savingsCumulative[11]?.cumulative.toString()).toBe("150");
  });

  it("returns all zeros for an empty year", async () => {
    mockExpenses([]);

    const summary = await getAnnualSummary("u1", "2026");

    expect(summary.totalSpent.toString()).toBe("0");
    expect(summary.totals.every((t) => t.spent.toString() === "0")).toBe(true);
    expect(summary.monthly).toHaveLength(12);
    expect(summary.savingsCumulative[11]?.cumulative.toString()).toBe("0");
  });

  it("scopes the query by userId and year prefix", async () => {
    mockExpenses([]);

    await getAnnualSummary("u1", "2026");

    expect(prisma.expense.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", month: { startsWith: "2026" } },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/lib/annual.test.ts`
Expected: FAIL — `@/lib/annual` cannot be resolved.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/annual.ts`:

```ts
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface AnnualCategoryTotal {
  category: CategoryKey;
  spent: Prisma.Decimal;
}

export interface AnnualMonthlyPoint {
  month: string; // "YYYY-MM"
  essential: Prisma.Decimal;
  leisure: Prisma.Decimal;
  savings: Prisma.Decimal;
}

export interface AnnualSavingsPoint {
  month: string; // "YYYY-MM"
  cumulative: Prisma.Decimal;
}

export interface AnnualSummary {
  year: string;
  totals: AnnualCategoryTotal[];
  totalSpent: Prisma.Decimal;
  monthly: AnnualMonthlyPoint[];
  savingsCumulative: AnnualSavingsPoint[];
}

interface ExpenseRow {
  amount: Prisma.Decimal | string;
  category: string;
  month: string;
}

const ZERO = () => new Prisma.Decimal(0);

// Synthèse annuelle : totaux par catégorie, série mensuelle (12 points) et cumul d'épargne.
// Une seule requête (mois stockés "YYYY-MM" → filtre startsWith année), agrégation Decimal.
export async function getAnnualSummary(userId: string, year: string): Promise<AnnualSummary> {
  const expenses = (await prisma.expense.findMany({
    where: { userId, month: { startsWith: year } },
  })) as ExpenseRow[];

  const months = Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  );

  const byMonth = new Map<string, Record<CategoryKey, Prisma.Decimal>>(
    months.map((m) => [m, { essential: ZERO(), leisure: ZERO(), savings: ZERO() }]),
  );

  for (const row of expenses) {
    const bucket = byMonth.get(row.month);
    if (!bucket) continue;
    if (row.category === "essential" || row.category === "leisure" || row.category === "savings") {
      bucket[row.category] = bucket[row.category].plus(row.amount);
    }
  }

  const monthly: AnnualMonthlyPoint[] = months.map((month) => {
    const b = byMonth.get(month)!;
    return { month, essential: b.essential, leisure: b.leisure, savings: b.savings };
  });

  const totals: AnnualCategoryTotal[] = CATEGORY_ORDER.map((category) => ({
    category,
    spent: monthly.reduce((acc, p) => acc.plus(p[category]), ZERO()),
  }));

  const totalSpent = totals.reduce((acc, t) => acc.plus(t.spent), ZERO());

  let running = ZERO();
  const savingsCumulative: AnnualSavingsPoint[] = monthly.map((point) => {
    running = running.plus(point.savings);
    return { month: point.month, cumulative: running };
  });

  return { year, totals, totalSpent, monthly, savingsCumulative };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/lib/annual.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
rtk git add src/lib/annual.ts src/lib/annual.test.ts
rtk git commit -m "feat(dashboard): add annual summary aggregation"
```

---

## Task 4: i18n keys (dashboard + common)

**Files:**
- Modify: `src/locales/fr.json`
- Modify: `src/locales/en.json`
- Test: `src/locales/parity.test.ts` (existing — guards key parity)

- [ ] **Step 1: Add the FR keys**

In `src/locales/fr.json`, inside the `"dashboard"` object, add after `"remaining": "restant"` (add a comma to the existing line):

```json
    "viewMonth": "Mois",
    "viewYear": "Année",
    "annualTitle": "Répartition de l'année",
    "annualTotalSpent": "dépensé",
    "trendTitle": "Tendances mensuelles",
    "savingsTitle": "Épargne accumulée"
```

In `src/locales/fr.json`, inside the `"common"` object, add after `"nextMonth": "Mois suivant"` (add a comma to the existing line):

```json
    "prevYear": "Année précédente",
    "nextYear": "Année suivante"
```

- [ ] **Step 2: Add the matching EN keys**

In `src/locales/en.json`, inside the `"dashboard"` object, add the same keys with English values:

```json
    "viewMonth": "Month",
    "viewYear": "Year",
    "annualTitle": "Year breakdown",
    "annualTotalSpent": "spent",
    "trendTitle": "Monthly trends",
    "savingsTitle": "Savings accrued"
```

In `src/locales/en.json`, inside the `"common"` object, add:

```json
    "prevYear": "Previous year",
    "nextYear": "Next year"
```

- [ ] **Step 3: Run the parity test to verify keys match**

Run: `rtk npx vitest run src/locales/parity.test.ts`
Expected: PASS — fr and en expose the exact same key set.

- [ ] **Step 4: Commit**

```bash
rtk git add src/locales/fr.json src/locales/en.json
rtk git commit -m "feat(i18n): add annual dashboard strings"
```

---

## Task 5: Generalize `CategoryDonut` with optional center props

**Files:**
- Modify: `src/components/charts/category-donut.tsx`
- Test: `src/components/charts/category-donut.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/charts/category-donut.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { CategoryDonut } from "@/components/charts/category-donut";

describe("CategoryDonut", () => {
  it("defaults the center to the balance and the remaining label", () => {
    renderWithIntl(
      <CategoryDonut slices={[{ category: "essential", amount: 100 }]} balance={50} />,
    );
    expect(screen.getByText(/50,00/)).toBeInTheDocument();
    expect(screen.getByText("restant")).toBeInTheDocument();
  });

  it("uses custom center value and label when provided", () => {
    renderWithIntl(
      <CategoryDonut
        slices={[{ category: "essential", amount: 100 }]}
        balance={0}
        centerValue={1100}
        centerLabel="dépensé"
      />,
    );
    expect(screen.getByText(/1 100,00/)).toBeInTheDocument();
    expect(screen.getByText("dépensé")).toBeInTheDocument();
  });
});
```

> Note: ` ` is the narrow no-break space used by the FR Intl currency formatter for thousands.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/components/charts/category-donut.test.tsx`
Expected: FAIL — the second test fails (custom center not yet supported).

- [ ] **Step 3: Modify the component**

In `src/components/charts/category-donut.tsx`, update the props interface and the center render. Replace the `interface CategoryDonutProps { ... }` block with:

```tsx
interface CategoryDonutProps {
  slices: DonutSlice[];
  balance: number;
  centerValue?: number;
  centerLabel?: string;
}
```

Update the function signature line to destructure the new props:

```tsx
export function CategoryDonut({ slices, balance, centerValue, centerLabel }: CategoryDonutProps) {
```

Just below the existing `const t = useTranslations("dashboard");` line, add:

```tsx
  const value = centerValue ?? balance;
  const label = centerLabel ?? t("remaining");
```

Replace the center `<div>` block (the one rendering the amount and `t("remaining")`) with:

```tsx
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`num text-[28px] font-light ${value < 0 ? "text-over" : "text-text"}`}>
          {formatEUR(value, locale)}
        </span>
        <span className="text-[12px] text-text-secondary">{label}</span>
      </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/components/charts/category-donut.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/charts/category-donut.tsx src/components/charts/category-donut.test.tsx
rtk git commit -m "feat(charts): allow custom donut center value and label"
```

---

## Task 6: `MonthlyTrendChart` component

**Files:**
- Create: `src/components/charts/monthly-trend-chart.tsx`
- Test: `src/components/charts/monthly-trend-chart.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/charts/monthly-trend-chart.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import frMessages from "@/locales/fr.json";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";

const points = Array.from({ length: 12 }, (_, i) => ({
  month: `2026-${String(i + 1).padStart(2, "0")}`,
  essential: i * 10,
  leisure: i * 5,
  savings: i * 2,
}));

describe("MonthlyTrendChart", () => {
  it("renders inside a responsive container without crashing", () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={frMessages}>
        <div style={{ width: 600, height: 300 }}>
          <MonthlyTrendChart points={points} />
        </div>
      </NextIntlClientProvider>,
    );
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/components/charts/monthly-trend-chart.test.tsx`
Expected: FAIL — component module not found.

- [ ] **Step 3: Write the component**

Create `src/components/charts/monthly-trend-chart.tsx`:

```tsx
"use client";

import { useLocale } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { formatEUR, formatMonthShort } from "@/lib/formatters";
import { CATEGORY_ORDER } from "@/lib/categories";

export interface MonthlyTrendPoint {
  month: string;
  essential: number;
  leisure: number;
  savings: number;
}

interface MonthlyTrendChartProps {
  points: MonthlyTrendPoint[];
}

function TrendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const locale = useLocale() as "fr" | "en";
  if (!active || !payload?.length || typeof label !== "string") return null;
  return (
    <div className="rounded-[10px] border border-line bg-surface/80 px-3 py-2 text-[12px] shadow-card backdrop-blur-sm">
      <div className="mb-1 capitalize text-text-secondary">{formatMonthShort(label, locale)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="num text-text">
          {formatEUR(Number(entry.value ?? 0), locale)}
        </div>
      ))}
    </div>
  );
}

export function MonthlyTrendChart({ points }: MonthlyTrendChartProps) {
  const locale = useLocale() as "fr" | "en";
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="month"
            tickFormatter={(month: string) => formatMonthShort(month, locale)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            interval="preserveStartEnd"
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--color-line)" }} />
          {CATEGORY_ORDER.map((category) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stackId="spend"
              stroke={`var(--color-${category})`}
              fill={`var(--color-${category}-bg)`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/components/charts/monthly-trend-chart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/charts/monthly-trend-chart.tsx src/components/charts/monthly-trend-chart.test.tsx
rtk git commit -m "feat(charts): add stacked monthly trend chart"
```

---

## Task 7: `SavingsProgressChart` component

**Files:**
- Create: `src/components/charts/savings-progress-chart.tsx`
- Test: `src/components/charts/savings-progress-chart.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/charts/savings-progress-chart.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import frMessages from "@/locales/fr.json";
import { SavingsProgressChart } from "@/components/charts/savings-progress-chart";

const points = Array.from({ length: 12 }, (_, i) => ({
  month: `2026-${String(i + 1).padStart(2, "0")}`,
  cumulative: i * 100,
}));

describe("SavingsProgressChart", () => {
  it("renders inside a responsive container without crashing", () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={frMessages}>
        <div style={{ width: 600, height: 300 }}>
          <SavingsProgressChart points={points} />
        </div>
      </NextIntlClientProvider>,
    );
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/components/charts/savings-progress-chart.test.tsx`
Expected: FAIL — component module not found.

- [ ] **Step 3: Write the component**

Create `src/components/charts/savings-progress-chart.tsx`:

```tsx
"use client";

import { useLocale } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { formatEUR, formatMonthShort } from "@/lib/formatters";

export interface SavingsProgressPoint {
  month: string;
  cumulative: number;
}

interface SavingsProgressChartProps {
  points: SavingsProgressPoint[];
}

function SavingsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const locale = useLocale() as "fr" | "en";
  if (!active || !payload?.length || typeof label !== "string") return null;
  return (
    <div className="rounded-[10px] border border-line bg-surface/80 px-3 py-2 text-[12px] shadow-card backdrop-blur-sm">
      <div className="mb-1 capitalize text-text-secondary">{formatMonthShort(label, locale)}</div>
      <div className="num text-text">{formatEUR(Number(payload[0]?.value ?? 0), locale)}</div>
    </div>
  );
}

export function SavingsProgressChart({ points }: SavingsProgressChartProps) {
  const locale = useLocale() as "fr" | "en";
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="month"
            tickFormatter={(month: string) => formatMonthShort(month, locale)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            interval="preserveStartEnd"
          />
          <Tooltip content={<SavingsTooltip />} cursor={{ stroke: "var(--color-line)" }} />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="var(--color-savings)"
            fill="var(--color-savings-bg)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/components/charts/savings-progress-chart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/charts/savings-progress-chart.tsx src/components/charts/savings-progress-chart.test.tsx
rtk git commit -m "feat(charts): add cumulative savings progress chart"
```

---

## Task 8: `DashboardYearNav` and `DashboardViewToggle`

**Files:**
- Create: `src/components/dashboard/dashboard-year-nav.tsx`
- Create: `src/components/dashboard/dashboard-view-toggle.tsx`
- Test: `src/components/dashboard/dashboard-view-toggle.test.tsx`

- [ ] **Step 1: Write the failing test (toggle)**

Create `src/components/dashboard/dashboard-view-toggle.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { DashboardViewToggle } from "@/components/dashboard/dashboard-view-toggle";

describe("DashboardViewToggle", () => {
  it("renders both view labels and marks the active one", () => {
    renderWithIntl(<DashboardViewToggle view="year" />);
    const month = screen.getByRole("link", { name: "Mois" });
    const year = screen.getByRole("link", { name: "Année" });
    expect(month).toHaveAttribute("href", "/dashboard");
    expect(year).toHaveAttribute("href", "/dashboard?view=year");
    expect(year.getAttribute("aria-current")).toBe("page");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npx vitest run src/components/dashboard/dashboard-view-toggle.test.tsx`
Expected: FAIL — component module not found.

- [ ] **Step 3: Write the toggle component**

Create `src/components/dashboard/dashboard-view-toggle.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";

interface DashboardViewToggleProps {
  view: "month" | "year";
}

const PILL = "rounded-pill px-4 py-1.5 text-[13px] transition-colors";

export function DashboardViewToggle({ view }: DashboardViewToggleProps) {
  const t = useTranslations("dashboard");
  return (
    <div className="mx-auto flex w-fit gap-1 rounded-pill bg-surface-alt p-1">
      <Link
        href="/dashboard"
        aria-current={view === "month" ? "page" : undefined}
        className={`${PILL} ${view === "month" ? "bg-accent-soft text-accent" : "text-text-secondary"}`}
      >
        {t("viewMonth")}
      </Link>
      <Link
        href="/dashboard?view=year"
        aria-current={view === "year" ? "page" : undefined}
        className={`${PILL} ${view === "year" ? "bg-accent-soft text-accent" : "text-text-secondary"}`}
      >
        {t("viewYear")}
      </Link>
    </div>
  );
}
```

> `useTranslations` works in Server Components with next-intl 4, so this stays a Server Component (no `"use client"`). The `renderWithIntl` test renders it under the client provider, which also works.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npx vitest run src/components/dashboard/dashboard-view-toggle.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the year nav component**

Create `src/components/dashboard/dashboard-year-nav.tsx`. It mirrors `DashboardMonthNav` but navigates years and preserves `?view=year`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { IconButton } from "@/components/ui/icon-button";
import { previousYear, nextYear, currentYear } from "@/lib/month";

interface DashboardYearNavProps {
  year: string;
}

export function DashboardYearNav({ year }: DashboardYearNavProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const canNext = year < currentYear();
  const go = (target: string) => router.push(`/dashboard?view=year&year=${target}`);
  return (
    <div className="flex items-center justify-between">
      <IconButton icon={ChevronLeft} label={t("prevYear")} onClick={() => go(previousYear(year))} />
      <div className="whitespace-nowrap font-serif text-[28px] leading-none">{year}</div>
      <IconButton
        icon={ChevronRight}
        label={t("nextYear")}
        onClick={() => go(nextYear(year))}
        disabled={!canNext}
      />
    </div>
  );
}
```

> `IconButton` signature confirmed in `src/components/ui/month-nav.tsx`: props `icon`, `label`, `onClick`, `disabled`.

- [ ] **Step 6: Commit**

```bash
rtk git add src/components/dashboard/dashboard-view-toggle.tsx src/components/dashboard/dashboard-view-toggle.test.tsx src/components/dashboard/dashboard-year-nav.tsx
rtk git commit -m "feat(dashboard): add year nav and month/year view toggle"
```

---

## Task 9: Wire the annual branch into the dashboard page

**Files:**
- Modify: `src/app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/app/(main)/dashboard/page.tsx`, add these imports alongside the existing ones:

```tsx
import { getAnnualSummary } from "@/lib/annual";
import { currentYear } from "@/lib/month";
import { DashboardViewToggle } from "@/components/dashboard/dashboard-view-toggle";
import { DashboardYearNav } from "@/components/dashboard/dashboard-year-nav";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { SavingsProgressChart } from "@/components/charts/savings-progress-chart";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
```

- [ ] **Step 2: Resolve `view` and `year` from searchParams**

Replace the existing `searchParams` type and destructuring at the top of `DashboardPage`. Change:

```tsx
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const month = resolveMonth(rawMonth);
```

to:

```tsx
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; year?: string }>;
}) {
  const { month: rawMonth, view: rawView, year: rawYear } = await searchParams;
  const view = rawView === "year" ? "year" : "month";
  const month = resolveMonth(rawMonth);
  const year = typeof rawYear === "string" && /^\d{4}$/.test(rawYear) ? rawYear : currentYear();
```

- [ ] **Step 3: Add the annual render branch**

Immediately after the `reconcile(...)` call and `const t = await getTranslations("dashboard");` line, add an early annual branch (before the monthly `Promise.all`):

```tsx
  if (view === "year") {
    const annual = await getAnnualSummary(userId, year);
    const slices = annual.totals.map((total) => ({
      category: total.category,
      amount: Number(total.spent),
    }));
    const trend = annual.monthly.map((point) => ({
      month: point.month,
      essential: Number(point.essential),
      leisure: Number(point.leisure),
      savings: Number(point.savings),
    }));
    const savings = annual.savingsCumulative.map((point) => ({
      month: point.month,
      cumulative: Number(point.cumulative),
    }));
    return (
      <main className="mx-auto flex max-w-[720px] flex-col gap-8 px-6 py-12">
        <DashboardViewToggle view="year" />
        <DashboardYearNav year={year} />

        <section className="flex flex-col gap-4">
          <CategoryDonut
            slices={slices}
            balance={0}
            centerValue={Number(annual.totalSpent)}
            centerLabel={t("annualTotalSpent")}
          />
          <div className="flex flex-col gap-2">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="flex items-center justify-between text-[14px]">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-pill ${CATEGORIES[category].dotClass}`} />
                  {tc(category)}
                </span>
                <span className="num text-text-secondary">
                  {formatEUR(Number(annual.totals.find((x) => x.category === category)?.spent ?? 0), locale)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-[20px]">{t("trendTitle")}</h2>
          <MonthlyTrendChart points={trend} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-[20px]">{t("savingsTitle")}</h2>
          <SavingsProgressChart points={savings} />
        </section>
      </main>
    );
  }
```

This branch uses `tc`, `locale`, and `formatEUR`. Add the needed lookups right before the `if (view === "year")` block:

```tsx
  const locale = await getLocale();
  const tc = await getTranslations("categories");
```

And add these imports at the top (next to the existing `getTranslations` import from `next-intl/server`):

```tsx
import { getLocale } from "next-intl/server";
import { formatEUR } from "@/lib/formatters";
```

> `getTranslations` is already imported from `next-intl/server`; only add `getLocale` from the same module. `CategoryDonut` is already imported in the file.

- [ ] **Step 4: Add the toggle to the monthly branch**

In the existing monthly `return`, add the toggle as the first child of `<main>`, just before `<DashboardMonthNav month={month} />`:

```tsx
      <DashboardViewToggle view="month" />
      <DashboardMonthNav month={month} />
```

- [ ] **Step 5: Verify the build (type check + compile)**

Run: `rtk npm run build`
Expected: build succeeds, no TypeScript errors. (Vitest does not typecheck — the build is the gate for `noUncheckedIndexedAccess` and prop mismatches.)

- [ ] **Step 6: Run the full unit suite**

Run: `rtk npm run test`
Expected: all tests pass (existing 224 + new ones).

- [ ] **Step 7: Commit**

```bash
rtk git add "src/app/(main)/dashboard/page.tsx"
rtk git commit -m "feat(dashboard): render annual view behind month/year toggle"
```

---

## Task 10: Manual verification (mobile + desktop, light + dark)

**Files:** none (verification only)

- [ ] **Step 1: Seed and run the app**

Run:
```bash
rtk npm run db:reset
rtk npm run dev
```

- [ ] **Step 2: Verify the annual view**

Open `http://localhost:3000/dashboard?view=year` and confirm:
- Toggle switches between `Mois` and `Année`, active pill uses the accent color.
- Year nav arrows change the year; the next arrow is disabled on the current year.
- Donut shows the annual breakdown with the total spent in its center.
- The three category totals lines render with the correct dot colors and amounts.
- Trends chart shows stacked areas across all 12 months; tooltip shows a localized short month + amounts.
- Savings chart shows a rising cumulative curve.
- Check at mobile width (≤ 720px) and desktop (≥ 1024px), in both light and dark mode (Settings → theme). No red anywhere.
- Switch language to EN (Settings) and confirm chart labels and section titles are translated.

- [ ] **Step 3: Final commit (only if any fix was needed)**

If a fix was required during verification, commit it with an appropriate `fix(dashboard): ...` message. Otherwise nothing to commit.

---

## Self-Review Notes

- **Spec coverage:** breakdown donut (Task 5+9), monthly trends (Task 6+9), savings progress (Task 3+7+9), `?view=year` toggle (Task 8+9), year nav (Task 8+9), `lib/annual.ts` single-query aggregation (Task 3), i18n keys + parity (Task 4), `formatMonthShort` (Task 1). All spec sections mapped.
- **Type consistency:** `AnnualSummary` field names (`totals`, `totalSpent`, `monthly`, `savingsCumulative`) used identically in Task 3 and Task 9. `MonthlyTrendPoint` / `SavingsProgressPoint` shapes match the `Number(...)`-mapped objects built in the page. `CategoryDonut` center props (`centerValue`/`centerLabel`) consistent between Task 5 and Task 9.
- **No placeholders:** every code step shows full content.
```
