# kōza — Dépenses (CRUD + ajout rapide) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter l'API dépenses (GET/POST/PUT/DELETE) et livrer un écran `/expenses` (mois courant) avec un formulaire d'ajout rapide (montant auto-focus, catégorie en pills, sous-catégorie en chips, date par défaut aujourd'hui), liste anti-chronologique, édition et suppression.

**Architecture:** Parallèle aux Revenus. Page `/expenses` Server Component `force-dynamic` qui lit les dépenses, calcule le total et passe des DTO sérialisables à un Client `ExpensesManager`. Mutations via API puis `router.refresh()`. Logique pure dans `lib/`, handlers testés avec `prisma` mocké. Composants client sans import de valeur Prisma.

**Tech Stack:** Next 16 App Router, React 19, Prisma 7, Zod 4, React Hook Form 7 (+ `Controller`), Tailwind v4, Vitest + Testing Library.

---

## Conventions pour chaque commit de ce plan

- Branche : **`feat/expenses-crud`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, impératif, minuscules, ≤72 car., scope dans (`api`, `expenses`, `i18n`, `db`).
- **Aucun trailer `Co-authored-by`.** Merge commit, pas de squash. PR via `gh`, merge manuel.
- Avant chaque commit : `npm run format`, puis vérifier `npm run lint` (sans `| tail`) et `npm run test` au vert.
- Textes **FR en dur**. **Jamais de rouge** : erreurs en ton `warning`/`text-secondary`.
- Pages Server lisant Prisma : `export const dynamic = "force-dynamic";`. Composants client : aucun import **de valeur** depuis `@/generated/prisma` (sinon bundle client cassé).

## File Structure

- `src/lib/validators.ts` (modify) + test — `expenseCreateSchema`.
- `src/lib/month.ts` (modify) + test — `monthRange`.
- `src/lib/expenses.ts` (+test) — `listMonthExpenses`.
- `src/lib/subcategories.ts` (modify) + test — `subcategoryLabel`.
- `src/lib/formatters.ts` (modify) + test — `formatDate`.
- `src/app/api/expenses/route.ts` (+test) — `GET`, `POST`.
- `src/app/api/expenses/[id]/route.ts` (+test) — `PUT`, `DELETE`.
- `src/components/expenses/subcat-chips.tsx` (+test).
- `src/components/expenses/expense-row.tsx` (+test).
- `src/components/expenses/expense-quick-form.tsx` (+test).
- `src/components/expenses/expenses-manager.tsx` (+test).
- `src/app/expenses/page.tsx` + `src/app/page.tsx` (modify, lien temporaire).

---

### Task 1: `expenseCreateSchema`

**Files:** Modify `src/lib/validators.ts`, Create `src/lib/validators.expense.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/validators.expense.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { expenseCreateSchema } from "@/lib/validators";

const valid = {
  amount: "54.90",
  description: "Courses",
  date: "2026-06-10",
  category: "essential",
  subcategory: "food",
};

describe("expenseCreateSchema", () => {
  it("accepts a valid expense", () => {
    expect(expenseCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-positive amount, a bad date and an empty description", () => {
    expect(expenseCreateSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(expenseCreateSchema.safeParse({ ...valid, date: "2026-06" }).success).toBe(false);
    expect(expenseCreateSchema.safeParse({ ...valid, description: " " }).success).toBe(false);
  });

  it("rejects a subcategory that does not belong to the category", () => {
    expect(expenseCreateSchema.safeParse({ ...valid, category: "leisure" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/validators.expense.test.ts`
Expected: FAIL — `expenseCreateSchema` n'existe pas.

- [ ] **Step 3: Ajouter le schéma**

Dans `src/lib/validators.ts`, modifier l'import du haut et ajouter le schéma + le type.

Remplacer la 1re ligne `import { z } from "zod";` par :
```ts
import { z } from "zod";
import { isValidSubcategory } from "@/lib/subcategories";
```

Ajouter à la fin du fichier :
```ts
export const expenseCreateSchema = z
  .object({
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .refine((value) => Number(value) > 0),
    description: z.string().trim().min(1).max(120),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum(["essential", "leisure", "savings"]),
    subcategory: z.string(),
  })
  .refine((data) => isValidSubcategory(data.category, data.subcategory));

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/validators.expense.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/validators.ts src/lib/validators.expense.test.ts
git commit -m "feat(api): add expense validator with category check"
```

---

### Task 2: `monthRange`

**Files:** Modify `src/lib/month.ts`, Create `src/lib/month.range.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/month.range.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { monthRange } from "@/lib/month";

describe("monthRange", () => {
  it("returns the first day of the month and of the next month", () => {
    const { start, end } = monthRange("2026-06");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(5); // juin = index 5
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(6); // juillet
    expect(end.getDate()).toBe(1);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/month.range.test.ts`
Expected: FAIL — `monthRange` n'est pas exporté.

- [ ] **Step 3: Ajouter la fonction**

Ajouter à la fin de `src/lib/month.ts` :
```ts
// Bornes [start, end) d'un mois "YYYY-MM" (premier jour du mois → premier jour du mois suivant).
export function monthRange(month: string): { start: Date; end: Date } {
  const [year, m] = month.split("-").map(Number);
  return { start: new Date(year, m - 1, 1), end: new Date(year, m, 1) };
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/month.range.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/month.ts src/lib/month.range.test.ts
git commit -m "feat(expenses): add monthRange helper"
```

---

### Task 3: `listMonthExpenses`

**Files:** Create `src/lib/expenses.ts`, `src/lib/expenses.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/expenses.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { expense: { findMany: vi.fn() } },
}));

import { listMonthExpenses } from "@/lib/expenses";
import { monthRange } from "@/lib/month";
import { prisma } from "@/lib/prisma";

describe("listMonthExpenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries expenses within the month range ordered by date desc", async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ id: "1" }] as never);
    const result = await listMonthExpenses("2026-06");
    const { start, end } = monthRange("2026-06");
    expect(prisma.expense.findMany).toHaveBeenCalledWith({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    });
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/expenses.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/expenses.ts` :
```ts
import type { Expense } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/month";

// Dépenses d'un mois donné (filtrées par plage de dates), les plus récentes d'abord.
export function listMonthExpenses(month: string): Promise<Expense[]> {
  const { start, end } = monthRange(month);
  return prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: "desc" },
  });
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/expenses.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/expenses.ts src/lib/expenses.test.ts
git commit -m "feat(expenses): add listMonthExpenses helper"
```

---

### Task 4: `subcategoryLabel`

**Files:** Modify `src/lib/subcategories.ts`, Create `src/lib/subcategories.label.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/subcategories.label.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { subcategoryLabel } from "@/lib/subcategories";

describe("subcategoryLabel", () => {
  it("returns the French label of a known subcategory", () => {
    expect(subcategoryLabel("food")).toBe("Alimentation");
    expect(subcategoryLabel("etf")).toBe("ETF");
  });

  it("falls back to the key when unknown", () => {
    expect(subcategoryLabel("does_not_exist")).toBe("does_not_exist");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/subcategories.label.test.ts`
Expected: FAIL — `subcategoryLabel` n'existe pas.

- [ ] **Step 3: Ajouter la fonction**

Ajouter à la fin de `src/lib/subcategories.ts` :
```ts
// Label FR d'une sous-catégorie (repli sur la clé si inconnue).
export function subcategoryLabel(key: string): string {
  return ALL_SUBCATEGORIES.find((sub) => sub.key === key)?.label ?? key;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/subcategories.label.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/subcategories.ts src/lib/subcategories.label.test.ts
git commit -m "feat(expenses): add subcategoryLabel helper"
```

---

### Task 5: `formatDate`

**Files:** Modify `src/lib/formatters.ts`, Create `src/lib/formatters.date.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/formatters.date.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/formatters";

describe("formatDate", () => {
  it("formats an ISO date in French (JJ/MM/AAAA)", () => {
    expect(formatDate("2026-06-10")).toBe("10/06/2026");
  });

  it("formats in English when asked", () => {
    expect(formatDate("2026-06-10", "en")).toBe("6/10/2026");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/formatters.date.test.ts`
Expected: FAIL — `formatDate` n'existe pas.

- [ ] **Step 3: Ajouter la fonction**

Ajouter à la fin de `src/lib/formatters.ts` :
```ts
// Parse "YYYY-MM-DD" en date locale (évite le décalage de fuseau d'un parse UTC).
function toLocalDate(date: string | Date): Date {
  if (typeof date !== "string") return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Formate une date selon la locale (JJ/MM/AAAA en FR).
export function formatDate(date: string | Date, locale: "fr" | "en" = "fr"): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US").format(toLocalDate(date));
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/formatters.date.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/formatters.ts src/lib/formatters.date.test.ts
git commit -m "feat(i18n): add date formatter"
```

---

### Task 6: `GET` + `POST /api/expenses`

**Files:** Create `src/app/api/expenses/route.ts`, `src/app/api/expenses/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/expenses/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { expense: { create: vi.fn(), findMany: vi.fn() } },
}));

import { GET, POST } from "@/app/api/expenses/route";
import { prisma } from "@/lib/prisma";

const validBody = {
  amount: "54.90",
  description: "Courses",
  date: "2026-06-10",
  category: "essential",
  subcategory: "food",
};

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/expenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an expense and returns 201", async () => {
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: "e1" } as never);
    const res = await POST(postRequest(validBody));
    expect(res.status).toBe(201);
    expect(prisma.expense.create).toHaveBeenCalledWith({
      data: {
        amount: "54.90",
        description: "Courses",
        category: "essential",
        subcategory: "food",
        date: new Date("2026-06-10"),
      },
    });
  });

  it("rejects an inconsistent subcategory with 400", async () => {
    const res = await POST(postRequest({ ...validBody, category: "leisure" }));
    expect(res.status).toBe(400);
    expect(prisma.expense.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/expenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists expenses for the requested month", async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ id: "1" }] as never);
    const res = await GET(new Request("http://localhost/api/expenses?month=2026-06"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "1" }]);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/app/api/expenses/route.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/expenses/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validators";
import { listMonthExpenses } from "@/lib/expenses";
import { currentMonth } from "@/lib/month";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? currentMonth();
  const expenses = await listMonthExpenses(month);
  return NextResponse.json(expenses, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_expense" }, { status: 400 });
  }
  const { date, ...rest } = parsed.data;
  const expense = await prisma.expense.create({ data: { ...rest, date: new Date(date) } });
  return NextResponse.json(expense, { status: 201 });
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/app/api/expenses/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/app/api/expenses/route.ts src/app/api/expenses/route.test.ts
git commit -m "feat(api): add expense list and create handlers"
```

---

### Task 7: `PUT` + `DELETE /api/expenses/[id]`

**Files:** Create `src/app/api/expenses/[id]/route.ts`, `src/app/api/expenses/[id]/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/expenses/[id]/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { expense: { update: vi.fn(), delete: vi.fn() } },
}));

import { Prisma } from "@/generated/prisma/client";
import { PUT, DELETE } from "@/app/api/expenses/[id]/route";
import { prisma } from "@/lib/prisma";

const validBody = {
  amount: "60.00",
  description: "Restaurant",
  date: "2026-06-11",
  category: "leisure",
  subcategory: "restaurants",
};

function putRequest(body: unknown): Request {
  return new Request("http://localhost/api/expenses/e1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const notFound = new Prisma.PrismaClientKnownRequestError("missing", {
  code: "P2025",
  clientVersion: "7",
});

describe("PUT /api/expenses/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates an expense and returns 200", async () => {
    vi.mocked(prisma.expense.update).mockResolvedValue({ id: "e1" } as never);
    const res = await PUT(putRequest(validBody), params("e1"));
    expect(res.status).toBe(200);
    expect(prisma.expense.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: {
        amount: "60.00",
        description: "Restaurant",
        category: "leisure",
        subcategory: "restaurants",
        date: new Date("2026-06-11"),
      },
    });
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await PUT(putRequest({ ...validBody, amount: "0" }), params("e1"));
    expect(res.status).toBe(400);
    expect(prisma.expense.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the expense does not exist", async () => {
    vi.mocked(prisma.expense.update).mockRejectedValue(notFound);
    const res = await PUT(putRequest(validBody), params("nope"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/expenses/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an expense and returns 200", async () => {
    vi.mocked(prisma.expense.delete).mockResolvedValue({ id: "e1" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/expenses/e1", { method: "DELETE" }),
      params("e1"),
    );
    expect(res.status).toBe(200);
    expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: "e1" } });
  });

  it("returns 404 when the expense does not exist", async () => {
    vi.mocked(prisma.expense.delete).mockRejectedValue(notFound);
    const res = await DELETE(
      new Request("http://localhost/api/expenses/nope", { method: "DELETE" }),
      params("nope"),
    );
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- "src/app/api/expenses/[id]/route.test.ts"`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/expenses/[id]/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { expenseCreateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_expense" }, { status: 400 });
  }
  const { date, ...rest } = parsed.data;
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: { ...rest, date: new Date(date) },
    });
    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw error;
  }
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- "src/app/api/expenses/[id]/route.test.ts"`
Expected: PASS (5 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add "src/app/api/expenses/[id]"
git commit -m "feat(api): add expense update and delete handlers"
```

---

### Task 8: `SubcatChips`

**Files:** Create `src/components/expenses/subcat-chips.tsx`, `src/components/expenses/subcat-chips.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/expenses/subcat-chips.test.tsx` :
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubcatChips } from "@/components/expenses/subcat-chips";

describe("SubcatChips", () => {
  it("renders the subcategories of the active category and marks the selected one", () => {
    render(<SubcatChips category="essential" value="housing" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Logement" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Alimentation" })).toBeInTheDocument();
  });

  it("calls onChange with the chosen subcategory key", async () => {
    const onChange = vi.fn();
    render(<SubcatChips category="essential" value="housing" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Alimentation" }));
    expect(onChange).toHaveBeenCalledWith("food");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/expenses/subcat-chips.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/expenses/subcat-chips.tsx` :
```tsx
import { SUBCATEGORIES } from "@/lib/subcategories";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/cn";

interface SubcatChipsProps {
  category: CategoryKey;
  value: string;
  onChange: (key: string) => void;
}

export function SubcatChips({ category, value, onChange }: SubcatChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUBCATEGORIES[category].map((sub) => {
        const active = sub.key === value;
        return (
          <button
            key={sub.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(sub.key)}
            className={cn(
              "tap rounded-pill px-3 py-1.5 text-[13px] font-medium transition",
              active
                ? cn(CATEGORIES[category].bgClass, CATEGORIES[category].textClass)
                : "bg-surface-alt text-text-secondary",
            )}
          >
            {sub.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/expenses/subcat-chips.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/expenses/subcat-chips.tsx src/components/expenses/subcat-chips.test.tsx
git commit -m "feat(expenses): add subcategory chips"
```

---

### Task 9: `ExpenseRow`

**Files:** Create `src/components/expenses/expense-row.tsx`, `src/components/expenses/expense-row.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/expenses/expense-row.test.tsx` :
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseRow } from "@/components/expenses/expense-row";

const expense = {
  id: "1",
  amount: "54.90",
  description: "Courses",
  date: "2026-06-10",
  category: "essential" as const,
  subcategory: "food",
};

describe("ExpenseRow", () => {
  it("shows description, subcategory label, amount and date", () => {
    render(<ExpenseRow expense={expense} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText(/Alimentation/)).toBeInTheDocument();
    expect(screen.getByText(/54,90/)).toBeInTheDocument();
    expect(screen.getByText(/10\/06\/2026/)).toBeInTheDocument();
  });

  it("fires edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ExpenseRow expense={expense} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Modifier la dépense" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer la dépense" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/expenses/expense-row.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/expenses/expense-row.tsx` :
```tsx
import { Pencil, Trash2 } from "lucide-react";
import { CatDot } from "@/components/ui/cat-dot";
import { IconButton } from "@/components/ui/icon-button";
import { formatEUR, formatDate } from "@/lib/formatters";
import { subcategoryLabel } from "@/lib/subcategories";
import type { CategoryKey } from "@/lib/categories";

export interface ExpenseRowData {
  id: string;
  amount: string;
  description: string;
  date: string;
  category: CategoryKey;
  subcategory: string;
}

interface ExpenseRowProps {
  expense: ExpenseRowData;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  return (
    <div className="card flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <CatDot category={expense.category} />
        <div>
          <div className="text-[15px] font-medium text-text">{expense.description}</div>
          <div className="text-[13px] text-text-secondary">
            {subcategoryLabel(expense.subcategory)} · {formatDate(expense.date)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="num mr-1 text-[15px] text-text">{formatEUR(expense.amount)}</span>
        <IconButton icon={Pencil} label="Modifier la dépense" onClick={onEdit} />
        <IconButton icon={Trash2} label="Supprimer la dépense" onClick={onDelete} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/expenses/expense-row.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/expenses/expense-row.tsx src/components/expenses/expense-row.test.tsx
git commit -m "feat(expenses): add expense row component"
```

---

### Task 10: `ExpenseQuickForm`

**Files:** Create `src/components/expenses/expense-quick-form.tsx`, `src/components/expenses/expense-quick-form.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/expenses/expense-quick-form.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseQuickForm } from "@/components/expenses/expense-quick-form";

describe("ExpenseQuickForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates an expense via POST in add mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<ExpenseQuickForm onSuccess={onSuccess} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText("Montant"), "20");
    await userEvent.type(screen.getByPlaceholderText("Courses, restaurant…"), "Pain");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resets the subcategory when the category changes", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 201 }));
    render(<ExpenseQuickForm onSuccess={() => {}} onCancel={() => {}} />);
    // catégorie par défaut = Essentiels (sous-cat Logement visible)
    expect(screen.getByRole("button", { name: "Logement" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Loisirs" }));
    // les chips deviennent celles de Loisirs ; Restaurants sélectionnée par défaut
    expect(screen.getByRole("button", { name: "Restaurants" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("updates an expense via PUT in edit mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <ExpenseQuickForm
        expense={{
          id: "1",
          amount: "54.90",
          description: "Courses",
          date: "2026-06-10",
          category: "essential",
          subcategory: "food",
        }}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/expenses/expense-quick-form.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/expenses/expense-quick-form.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CatSelect } from "@/components/ui/cat-select";
import { SubcatChips } from "@/components/expenses/subcat-chips";
import { SUBCATEGORIES } from "@/lib/subcategories";

const formSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Montant invalide")
    .refine((value) => Number(value) > 0, "Montant positif requis"),
  description: z.string().trim().min(1, "Description requise").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
  category: z.enum(["essential", "leisure", "savings"]),
  subcategory: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseQuickFormProps {
  expense?: {
    id: string;
    amount: string;
    description: string;
    date: string;
    category: FormValues["category"];
    subcategory: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ExpenseQuickForm({ expense, onSuccess, onCancel }: ExpenseQuickFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: expense?.amount ?? "",
      description: expense?.description ?? "",
      date: expense?.date ?? today(),
      category: expense?.category ?? "essential",
      subcategory: expense?.subcategory ?? "housing",
    },
  });
  const category = watch("category");

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", {
        method: expense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("save_failed");
      onSuccess();
    } catch {
      setSubmitError("Un souci est survenu. Réessaie dans un instant.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
      <h2 className="font-serif text-[24px] text-text">
        {expense ? "Modifier la dépense" : "Nouvelle dépense"}
      </h2>
      <input
        {...register("amount")}
        inputMode="decimal"
        autoFocus
        placeholder="0"
        aria-label="Montant"
        className="w-full bg-transparent text-center text-[40px] font-light text-text outline-none"
      />
      {errors.amount ? (
        <p className="text-center text-[13px] text-warning">{errors.amount.message}</p>
      ) : null}
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <CatSelect
            value={field.value}
            onChange={(next) => {
              field.onChange(next);
              setValue("subcategory", SUBCATEGORIES[next][0].key);
            }}
          />
        )}
      />
      <Controller
        control={control}
        name="subcategory"
        render={({ field }) => (
          <SubcatChips category={category} value={field.value} onChange={field.onChange} />
        )}
      />
      <Field label="Description" hint={errors.description?.message}>
        <input
          {...register("description")}
          placeholder="Courses, restaurant…"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label="Date">
        <input
          {...register("date")}
          type="date"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}
      <div className="flex gap-3">
        <Button variant="surface" full onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" full disabled={isSubmitting}>
          {expense ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/expenses/expense-quick-form.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/expenses/expense-quick-form.tsx src/components/expenses/expense-quick-form.test.tsx
git commit -m "feat(expenses): add quick add/edit form"
```

---

### Task 11: `ExpensesManager`

**Files:** Create `src/components/expenses/expenses-manager.tsx`, `src/components/expenses/expenses-manager.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/expenses/expenses-manager.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ExpensesManager } from "@/components/expenses/expenses-manager";

const expenses = [
  {
    id: "1",
    amount: "54.90",
    description: "Courses",
    date: "2026-06-10",
    category: "essential" as const,
    subcategory: "food",
  },
];

describe("ExpensesManager", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("opens the add overlay", async () => {
    render(<ExpensesManager expenses={expenses} />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter une dépense" }));
    expect(screen.getByText("Nouvelle dépense")).toBeInTheDocument();
  });

  it("deletes an expense then refreshes", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<ExpensesManager expenses={expenses} />);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer la dépense" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an empty state when there is no expense", () => {
    render(<ExpensesManager expenses={[]} />);
    expect(screen.getByText(/Aucune dépense/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/expenses/expenses-manager.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/expenses/expenses-manager.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpenseRow, type ExpenseRowData } from "@/components/expenses/expense-row";
import { ExpenseQuickForm } from "@/components/expenses/expense-quick-form";

interface ExpensesManagerProps {
  expenses: ExpenseRowData[];
}

type OverlayState = { mode: "add" } | { mode: "edit"; expense: ExpenseRowData } | null;

export function ExpensesManager({ expenses }: ExpensesManagerProps) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleting, setDeleting] = useState<ExpenseRowData | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    setOverlay(null);
    setDeleting(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/expenses/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      refresh();
    } catch {
      setActionError("Suppression impossible. Réessaie dans un instant.");
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {expenses.length === 0 ? (
        <p className="text-[15px] text-text-secondary">
          Aucune dépense ce mois. Ajoute ta première dépense.
        </p>
      ) : (
        expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            onEdit={() => setOverlay({ mode: "edit", expense })}
            onDelete={() => setDeleting(expense)}
          />
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      <button
        type="button"
        onClick={() => setOverlay({ mode: "add" })}
        className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> Ajouter une dépense
      </button>

      {overlay ? (
        <Overlay mode="sheet" onClose={() => setOverlay(null)}>
          <ExpenseQuickForm
            expense={overlay.mode === "edit" ? overlay.expense : undefined}
            onSuccess={refresh}
            onCancel={() => setOverlay(null)}
          />
        </Overlay>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer cette dépense ?"
          message={`« ${deleting.description} » sera retirée de ce mois.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/expenses/expenses-manager.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/expenses/expenses-manager.tsx src/components/expenses/expenses-manager.test.tsx
git commit -m "feat(expenses): add expenses manager"
```

---

### Task 12: Écran `/expenses` + lien temporaire

**Files:** Create `src/app/expenses/page.tsx`, Modify `src/app/page.tsx`

- [ ] **Step 1: Créer la page**

`src/app/expenses/page.tsx` :
```tsx
import { Prisma } from "@/generated/prisma/client";
import { ExpensesManager } from "@/components/expenses/expenses-manager";
import { listMonthExpenses } from "@/lib/expenses";
import { formatEUR } from "@/lib/formatters";
import { currentMonth } from "@/lib/month";
import type { CategoryKey } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await listMonthExpenses(currentMonth());
  const total = expenses.reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
  const rows = expenses.map((expense) => ({
    id: expense.id,
    amount: expense.amount.toString(),
    description: expense.description,
    date: expense.date.toISOString().slice(0, 10),
    category: expense.category as CategoryKey,
    subcategory: expense.subcategory,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes dépenses</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        {total.gt(0)
          ? `${formatEUR(total)} dépensés ce mois-ci.`
          : "Aucune dépense pour l'instant ce mois-ci."}
      </p>
      <div className="mt-8">
        <ExpensesManager expenses={rows} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Ajouter le lien temporaire sur le placeholder racine**

Dans `src/app/page.tsx`, juste après le `Link` vers `/incomes` (avant la fermeture `</main>`), ajouter :
```tsx
      <Link href="/expenses" className="text-[14px] font-medium text-accent">
        Suivre mes dépenses
      </Link>
```

- [ ] **Step 3: Build avec DATABASE_URL factice (comme la CI)**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: build OK, exit 0 ; `/expenses` listée en `ƒ` (Dynamic), pas d'erreur de prérendu ni de chunk client (pas d'import de valeur Prisma dans les composants).

- [ ] **Step 4: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/app/expenses/page.tsx src/app/page.tsx
git commit -m "feat(expenses): add expenses management screen"
```

---

### Task 13: Vérification finale + PR

- [ ] **Step 1: Lint, build (DB factice), suite complète**

Run:
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: lint clean, build OK (routes `/expenses`, `/api/expenses`, `/api/expenses/[id]`), tous les tests au vert.

- [ ] **Step 2: Vérification manuelle**

`npm run dev`, ouvrir `http://localhost:3000` → « Suivre mes dépenses » → `/expenses` :
- liste les dépenses du mois (seed : ~6 dépenses ce mois) + total ;
- ajout rapide (overlay) : montant auto-focus, catégorie pills, sous-cat chips qui suivent, date du jour par défaut → la liste et le total se mettent à jour ;
- modifier une dépense ; supprimer (modale de confirmation) → retrait + total recalculé ;
- vérifier light + dark, mobile + desktop ; aucun rouge. Arrêter le serveur. Si la base a été modifiée, relancer `npx prisma db seed`.

- [ ] **Step 3: Push et PR**

```bash
git push -u origin feat/expenses-crud
gh pr create --base main --head feat/expenses-crud \
  --title "feat(expenses): add expense tracking with quick add" \
  --body "Complète l'API dépenses (GET/POST/PUT/DELETE, 404 sur P2025) et ajoute l'écran /expenses (mois courant) : liste anti-chronologique, total, ajout rapide (< 10 s : montant auto-focus, catégorie pills, sous-catégorie en chips, date du jour), édition via overlay, suppression via modale. Validation Zod avec cohérence catégorie/sous-catégorie. Helpers : monthRange, listMonthExpenses, subcategoryLabel, formatDate. Lien temporaire vers /expenses depuis le placeholder racine. budgetId différé à #6 ; E2E Playwright différé."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- `expenseCreateSchema` + refine cross-champ → Task 1 ✅ · `monthRange` → Task 2 ✅ · `listMonthExpenses` → Task 3 ✅ · `subcategoryLabel` → Task 4 ✅ · `formatDate` → Task 5 ✅
- `GET`/`POST` → Task 6 ✅ · `PUT`/`DELETE` + 404 → Task 7 ✅
- `SubcatChips` → Task 8 ✅ · `ExpenseRow` → Task 9 ✅ · `ExpenseQuickForm` (montant auto-focus, pills, chips, date défaut, reset sous-cat) → Task 10 ✅ · `ExpensesManager` (overlay/delete/refresh/empty) → Task 11 ✅
- Page `/expenses` force-dynamic + DTO + lien temporaire → Task 12 ✅
- Build DB factice + tests → Tasks 12/13 ✅
- Différé (budgetId, dashboard, nav, mois passés, E2E) → hors plan, conforme ✅

**Scan placeholders :** aucun TBD/TODO ; code complet ; chaque step a commande + résultat attendu.

**Cohérence des types :**
- `ExpenseRowData` (`id`/`amount: string`/`description`/`date: string`/`category: CategoryKey`/`subcategory`) défini en Task 9, consommé par `ExpensesManager` (Task 11) et la page (Task 12).
- `ExpenseQuickForm.expense?` reprend la même forme (sans dépendre de `ExpenseRowData` pour rester découplé) ; `category` typé `FormValues["category"]` = `CategoryKey`.
- `expenseCreateSchema` réutilisé par POST (Task 6) et PUT (Task 7) ; côté handler, `date` converti en `Date`, le reste passé tel quel.
- `SubcatChips({ category: CategoryKey, value, onChange })` (Task 8) consommé par le form (Task 10) avec `category = watch("category")`.
- `monthRange` (Task 2) consommé par `listMonthExpenses` (Task 3) et son test.
- `formatDate`/`formatEUR`/`subcategoryLabel` (client-safe) consommés par `ExpenseRow` (Task 9).
- Libellés distincts : `ExpenseRow` suppression = « Supprimer la dépense », confirm dialog = « Supprimer » (pas de collision `getByRole`).
```
