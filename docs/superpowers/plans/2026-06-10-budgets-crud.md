# kōza — Budgets (CRUD + progression + boucle dépense→budget) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le CRUD des budgets avec barre de progression (cumul des dépenses liées vs cible) sur un écran `/budgets`, et fermer la boucle en ajoutant un sélecteur de budget au formulaire de dépense.

**Architecture:** Parallèle aux dépenses. Page `/budgets` Server `force-dynamic` qui lit les budgets + leur `spent` et passe des DTO sérialisables à un Client `BudgetsManager`. La progression s'appuie sur le `ProgressBar` du kit. La boucle dépense→budget étend `expenseCreateSchema`, `ExpenseRowData`, le formulaire et la page de dépense. Mutations via API puis `router.refresh()`. Handlers/logique testés avec `prisma` mocké.

**Tech Stack:** Next 16 App Router, React 19, Prisma 7, Zod 4, React Hook Form 7 (+ `Controller`), Tailwind v4, Vitest + Testing Library.

---

## Conventions pour chaque commit de ce plan

- Branche : **`feat/budgets-crud`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, impératif, minuscules, ≤72 car., scope dans (`api`, `budgets`, `expenses`).
- **Aucun trailer `Co-authored-by`.** Merge commit, pas de squash. PR via `gh`, merge manuel.
- Avant chaque commit : `npm run format`, puis vérifier `npm run lint` (sans `| tail`) et `npm run test` au vert.
- **Code pur-lib / TS : lancer `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build` avant de committer** (Vitest ne type-checke pas ; `noUncheckedIndexedAccess`).
- Pages Server lisant Prisma : `export const dynamic = "force-dynamic";`. Composants client : aucun import **de valeur** depuis `@/generated/prisma`.

## File Structure

- `src/lib/validators.ts` (modify) + test — `budgetCreateSchema`, `expenseCreateSchema` étendu.
- `src/lib/budgets.ts` (+test) — `listBudgetsWithSpent`.
- `src/app/api/budgets/route.ts` (+test) — `GET`, `POST`.
- `src/app/api/budgets/[id]/route.ts` (+test) — `PUT`, `DELETE`.
- `src/components/budgets/budget-card.tsx` (+test).
- `src/components/budgets/budget-form.tsx` (+test).
- `src/components/budgets/budgets-manager.tsx` (+test).
- `src/app/budgets/page.tsx` + `src/app/page.tsx` (modify, lien).
- `src/components/expenses/expense-quick-form.tsx` (modify) + test — picker budget.
- `src/components/expenses/expense-row.tsx`, `expenses-manager.tsx`, `src/app/expenses/page.tsx` (modify) — propagation `budgetId` + budgets.

---

### Task 1: Validators — `budgetCreateSchema` + `expenseCreateSchema` étendu

**Files:** Modify `src/lib/validators.ts`, Create `src/lib/validators.budget.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/validators.budget.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { budgetCreateSchema, expenseCreateSchema } from "@/lib/validators";

const validBudget = { name: "Vacances", targetAmount: "1200.00", category: "leisure" };

describe("budgetCreateSchema", () => {
  it("accepts a valid budget with and without a deadline", () => {
    expect(budgetCreateSchema.safeParse(validBudget).success).toBe(true);
    expect(budgetCreateSchema.safeParse({ ...validBudget, deadline: "2026-08-01" }).success).toBe(
      true,
    );
  });

  it("rejects an empty name and a non-positive target", () => {
    expect(budgetCreateSchema.safeParse({ ...validBudget, name: " " }).success).toBe(false);
    expect(budgetCreateSchema.safeParse({ ...validBudget, targetAmount: "0" }).success).toBe(false);
  });
});

describe("expenseCreateSchema with budgetId", () => {
  const base = {
    amount: "10.00",
    description: "Hotel",
    date: "2026-06-10",
    category: "leisure",
    subcategory: "vacations",
  };

  it("accepts an optional budgetId and works without it", () => {
    expect(expenseCreateSchema.safeParse(base).success).toBe(true);
    expect(expenseCreateSchema.safeParse({ ...base, budgetId: "b1" }).success).toBe(true);
    expect(expenseCreateSchema.safeParse({ ...base, budgetId: null }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/validators.budget.test.ts`
Expected: FAIL — `budgetCreateSchema` n'existe pas / `budgetId` rejeté.

- [ ] **Step 3: Ajouter / étendre les schémas**

Dans `src/lib/validators.ts`, remplacer le bloc `expenseCreateSchema` existant par (ajout de `budgetId`) :
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
    budgetId: z.string().min(1).nullable().optional(),
  })
  .refine((data) => isValidSubcategory(data.category, data.subcategory));
```

Puis ajouter, juste avant la ligne `export type IncomeCreateInput` :
```ts
export const budgetCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0),
  category: z.enum(["essential", "leisure", "savings"]),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});
```

Et ajouter le type avec les autres `export type` :
```ts
export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/validators.budget.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/validators.ts src/lib/validators.budget.test.ts
git commit -m "feat(api): add budget validator and expense budgetId"
```

---

### Task 2: `listBudgetsWithSpent`

**Files:** Create `src/lib/budgets.ts`, `src/lib/budgets.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/budgets.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { budget: { findMany: vi.fn() } },
}));

import { listBudgetsWithSpent } from "@/lib/budgets";
import { prisma } from "@/lib/prisma";

describe("listBudgetsWithSpent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sums the linked expenses into spent", async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      {
        id: "b1",
        name: "Grèce",
        targetAmount: "1200",
        category: "leisure",
        deadline: null,
        expenses: [{ amount: "250" }, { amount: "100" }],
      },
    ] as never);
    const result = await listBudgetsWithSpent();
    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      include: { expenses: { select: { amount: true } } },
      orderBy: { createdAt: "asc" },
    });
    expect(result[0].spent.toString()).toBe("350");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/budgets.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/budgets.ts` :
```ts
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface BudgetWithSpent {
  id: string;
  name: string;
  targetAmount: Prisma.Decimal;
  spent: Prisma.Decimal;
  category: string;
  deadline: Date | null;
}

// Budgets avec le cumul de toutes leurs dépenses liées (tous mois confondus).
export async function listBudgetsWithSpent(): Promise<BudgetWithSpent[]> {
  const budgets = await prisma.budget.findMany({
    include: { expenses: { select: { amount: true } } },
    orderBy: { createdAt: "asc" },
  });
  return budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    targetAmount: budget.targetAmount,
    category: budget.category,
    deadline: budget.deadline,
    spent: budget.expenses.reduce(
      (sum, expense) => sum.plus(expense.amount),
      new Prisma.Decimal(0),
    ),
  }));
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/budgets.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Build, format, lint, commit**

```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/budgets.ts src/lib/budgets.test.ts
git commit -m "feat(budgets): add listBudgetsWithSpent helper"
```

---

### Task 3: `GET` + `POST /api/budgets`

**Files:** Create `src/app/api/budgets/route.ts`, `src/app/api/budgets/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/budgets/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { budget: { create: vi.fn(), findMany: vi.fn() } },
}));

import { GET, POST } from "@/app/api/budgets/route";
import { prisma } from "@/lib/prisma";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/budgets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the budget list", async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([]);
  });
});

describe("POST /api/budgets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a budget with a null deadline by default", async () => {
    vi.mocked(prisma.budget.create).mockResolvedValue({ id: "b1" } as never);
    const res = await POST(
      postRequest({ name: "Vacances", targetAmount: "1200.00", category: "leisure" }),
    );
    expect(res.status).toBe(201);
    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: { name: "Vacances", targetAmount: "1200.00", category: "leisure", deadline: null },
    });
  });

  it("rejects an invalid budget with 400", async () => {
    const res = await POST(postRequest({ name: "", targetAmount: "0", category: "leisure" }));
    expect(res.status).toBe(400);
    expect(prisma.budget.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/app/api/budgets/route.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/budgets/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetCreateSchema } from "@/lib/validators";
import { listBudgetsWithSpent } from "@/lib/budgets";

export async function GET() {
  const budgets = await listBudgetsWithSpent();
  return NextResponse.json(budgets, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = budgetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_budget" }, { status: 400 });
  }
  const { deadline, ...rest } = parsed.data;
  const budget = await prisma.budget.create({
    data: { ...rest, deadline: deadline ? new Date(deadline) : null },
  });
  return NextResponse.json(budget, { status: 201 });
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/app/api/budgets/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/app/api/budgets/route.ts src/app/api/budgets/route.test.ts
git commit -m "feat(api): add budget list and create handlers"
```

---

### Task 4: `PUT` + `DELETE /api/budgets/[id]`

**Files:** Create `src/app/api/budgets/[id]/route.ts`, `src/app/api/budgets/[id]/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/budgets/[id]/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { budget: { update: vi.fn(), delete: vi.fn() } },
}));

import { Prisma } from "@/generated/prisma/client";
import { PUT, DELETE } from "@/app/api/budgets/[id]/route";
import { prisma } from "@/lib/prisma";

const validBody = { name: "Vacances", targetAmount: "1500.00", category: "leisure" };

function putRequest(body: unknown): Request {
  return new Request("http://localhost/api/budgets/b1", {
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

describe("PUT /api/budgets/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a budget and returns 200", async () => {
    vi.mocked(prisma.budget.update).mockResolvedValue({ id: "b1" } as never);
    const res = await PUT(putRequest(validBody), params("b1"));
    expect(res.status).toBe(200);
    expect(prisma.budget.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { name: "Vacances", targetAmount: "1500.00", category: "leisure", deadline: null },
    });
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await PUT(putRequest({ ...validBody, targetAmount: "0" }), params("b1"));
    expect(res.status).toBe(400);
    expect(prisma.budget.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the budget does not exist", async () => {
    vi.mocked(prisma.budget.update).mockRejectedValue(notFound);
    const res = await PUT(putRequest(validBody), params("nope"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/budgets/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a budget and returns 200", async () => {
    vi.mocked(prisma.budget.delete).mockResolvedValue({ id: "b1" } as never);
    const res = await DELETE(
      new Request("http://localhost/api/budgets/b1", { method: "DELETE" }),
      params("b1"),
    );
    expect(res.status).toBe(200);
    expect(prisma.budget.delete).toHaveBeenCalledWith({ where: { id: "b1" } });
  });

  it("returns 404 when the budget does not exist", async () => {
    vi.mocked(prisma.budget.delete).mockRejectedValue(notFound);
    const res = await DELETE(
      new Request("http://localhost/api/budgets/nope", { method: "DELETE" }),
      params("nope"),
    );
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- "src/app/api/budgets/[id]/route.test.ts"`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/budgets/[id]/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { budgetCreateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = budgetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_budget" }, { status: 400 });
  }
  const { deadline, ...rest } = parsed.data;
  try {
    const budget = await prisma.budget.update({
      where: { id },
      data: { ...rest, deadline: deadline ? new Date(deadline) : null },
    });
    return NextResponse.json(budget, { status: 200 });
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
    await prisma.budget.delete({ where: { id } });
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

Run: `npm run test -- "src/app/api/budgets/[id]/route.test.ts"`
Expected: PASS (5 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add "src/app/api/budgets/[id]"
git commit -m "feat(api): add budget update and delete handlers"
```

---

### Task 5: `BudgetCard`

**Files:** Create `src/components/budgets/budget-card.tsx`, `src/components/budgets/budget-card.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/budgets/budget-card.test.tsx` :
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetCard } from "@/components/budgets/budget-card";

const budget = {
  id: "1",
  name: "Vacances Grèce",
  targetAmount: "1200.00",
  spent: "350.00",
  category: "leisure" as const,
  deadline: "2026-08-01",
};

describe("BudgetCard", () => {
  it("shows the name, amounts, progress and deadline", () => {
    render(<BudgetCard budget={budget} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Vacances Grèce")).toBeInTheDocument();
    expect(screen.getByText(/350,00/)).toBeInTheDocument();
    expect(screen.getByText(/Échéance/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "350");
    expect(bar).toHaveAttribute("aria-valuemax", "1200");
  });

  it("fires edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<BudgetCard budget={budget} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Modifier le budget" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le budget" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/budgets/budget-card.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/budgets/budget-card.tsx` :
```tsx
import { Pencil, Trash2 } from "lucide-react";
import { CatDot } from "@/components/ui/cat-dot";
import { IconButton } from "@/components/ui/icon-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatEUR, formatDate } from "@/lib/formatters";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

export interface BudgetCardData {
  id: string;
  name: string;
  targetAmount: string;
  spent: string;
  category: CategoryKey;
  deadline: string | null;
}

interface BudgetCardProps {
  budget: BudgetCardData;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CatDot category={budget.category} />
          <span className="text-[15px] font-medium text-text">{budget.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton icon={Pencil} label="Modifier le budget" onClick={onEdit} />
          <IconButton icon={Trash2} label="Supprimer le budget" onClick={onDelete} />
        </div>
      </div>
      <ProgressBar
        value={Number(budget.spent)}
        max={Number(budget.targetAmount)}
        fillClass={CATEGORIES[budget.category].dotClass}
      />
      <div className="flex items-center justify-between text-[13px] text-text-secondary">
        <span className="num">
          {formatEUR(budget.spent)} sur {formatEUR(budget.targetAmount)}
        </span>
        {budget.deadline ? <span>Échéance {formatDate(budget.deadline)}</span> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/budgets/budget-card.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/budgets/budget-card.tsx src/components/budgets/budget-card.test.tsx
git commit -m "feat(budgets): add budget card with progress"
```

---

### Task 6: `BudgetForm`

**Files:** Create `src/components/budgets/budget-form.tsx`, `src/components/budgets/budget-form.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/budgets/budget-form.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetForm } from "@/components/budgets/budget-form";

describe("BudgetForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a budget via POST in add mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<BudgetForm onSuccess={onSuccess} onCancel={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Vacances d'été"), "Apport immo");
    await userEvent.type(screen.getByPlaceholderText("1200"), "20000");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates a budget via PUT in edit mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <BudgetForm
        budget={{
          id: "1",
          name: "Vacances Grèce",
          targetAmount: "1200.00",
          category: "leisure",
          deadline: null,
        }}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/budgets/budget-form.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/budgets/budget-form.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CatSelect } from "@/components/ui/cat-select";

const formSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Montant invalide")
    .refine((value) => Number(value) > 0, "Montant positif requis"),
  category: z.enum(["essential", "leisure", "savings"]),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface BudgetFormProps {
  budget?: {
    id: string;
    name: string;
    targetAmount: string;
    category: FormValues["category"];
    deadline: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: budget?.name ?? "",
      targetAmount: budget?.targetAmount ?? "",
      category: budget?.category ?? "essential",
      deadline: budget?.deadline ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(budget ? `/api/budgets/${budget.id}` : "/api/budgets", {
        method: budget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          targetAmount: values.targetAmount,
          category: values.category,
          deadline: values.deadline === "" ? null : values.deadline,
        }),
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
        {budget ? "Modifier le budget" : "Nouveau budget"}
      </h2>
      <Field label="Nom" hint={errors.name?.message}>
        <input
          {...register("name")}
          placeholder="Vacances d'été"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label="Montant cible" hint={errors.targetAmount?.message}>
        <input
          {...register("targetAmount")}
          inputMode="decimal"
          placeholder="1200"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Controller
        control={control}
        name="category"
        render={({ field }) => <CatSelect value={field.value} onChange={field.onChange} />}
      />
      <Field label="Échéance (optionnel)" hint={errors.deadline?.message}>
        <input
          {...register("deadline")}
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
          {budget ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/budgets/budget-form.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/budgets/budget-form.tsx src/components/budgets/budget-form.test.tsx
git commit -m "feat(budgets): add budget add/edit form"
```

---

### Task 7: `BudgetsManager`

**Files:** Create `src/components/budgets/budgets-manager.tsx`, `src/components/budgets/budgets-manager.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/budgets/budgets-manager.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { BudgetsManager } from "@/components/budgets/budgets-manager";

const budgets = [
  {
    id: "1",
    name: "Vacances Grèce",
    targetAmount: "1200.00",
    spent: "350.00",
    category: "leisure" as const,
    deadline: null,
  },
];

describe("BudgetsManager", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("opens the add overlay", async () => {
    render(<BudgetsManager budgets={budgets} />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter un budget" }));
    expect(screen.getByText("Nouveau budget")).toBeInTheDocument();
  });

  it("deletes a budget then refreshes", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<BudgetsManager budgets={budgets} />);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le budget" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an empty state when there is no budget", () => {
    render(<BudgetsManager budgets={[]} />);
    expect(screen.getByText(/Aucun budget/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/budgets/budgets-manager.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/budgets/budgets-manager.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetCard, type BudgetCardData } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";

interface BudgetsManagerProps {
  budgets: BudgetCardData[];
}

type OverlayState = { mode: "add" } | { mode: "edit"; budget: BudgetCardData } | null;

export function BudgetsManager({ budgets }: BudgetsManagerProps) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleting, setDeleting] = useState<BudgetCardData | null>(null);
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
      const res = await fetch(`/api/budgets/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      refresh();
    } catch {
      setActionError("Suppression impossible. Réessaie dans un instant.");
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {budgets.length === 0 ? (
        <p className="text-[15px] text-text-secondary">
          Aucun budget pour l'instant. Crée ton premier objectif.
        </p>
      ) : (
        budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={() => setOverlay({ mode: "edit", budget })}
            onDelete={() => setDeleting(budget)}
          />
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      <button
        type="button"
        onClick={() => setOverlay({ mode: "add" })}
        className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> Ajouter un budget
      </button>

      {overlay ? (
        <Overlay mode="sheet" onClose={() => setOverlay(null)}>
          <BudgetForm
            budget={overlay.mode === "edit" ? overlay.budget : undefined}
            onSuccess={refresh}
            onCancel={() => setOverlay(null)}
          />
        </Overlay>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer ce budget ?"
          message={`« ${deleting.name} » sera supprimé. Les dépenses liées seront déliées, pas supprimées.`}
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

Run: `npm run test -- src/components/budgets/budgets-manager.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/budgets/budgets-manager.tsx src/components/budgets/budgets-manager.test.tsx
git commit -m "feat(budgets): add budgets manager"
```

---

### Task 8: Écran `/budgets` + lien temporaire

**Files:** Create `src/app/budgets/page.tsx`, Modify `src/app/page.tsx`

- [ ] **Step 1: Créer la page**

`src/app/budgets/page.tsx` :
```tsx
import { BudgetsManager } from "@/components/budgets/budgets-manager";
import { listBudgetsWithSpent } from "@/lib/budgets";
import type { CategoryKey } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const budgets = await listBudgetsWithSpent();
  const rows = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    targetAmount: budget.targetAmount.toString(),
    spent: budget.spent.toString(),
    category: budget.category as CategoryKey,
    deadline: budget.deadline ? budget.deadline.toISOString().slice(0, 10) : null,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes budgets</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        Tes objectifs d&apos;épargne et de dépense.
      </p>
      <div className="mt-8">
        <BudgetsManager budgets={rows} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Ajouter le lien temporaire**

Dans `src/app/page.tsx`, après le `Link` vers `/expenses` (avant `</main>`), ajouter :
```tsx
      <Link href="/budgets" className="text-[14px] font-medium text-accent">
        Gérer mes budgets
      </Link>
```

- [ ] **Step 3: Build avec DATABASE_URL factice**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: build OK, exit 0 ; `/budgets` listée en `ƒ` (Dynamic).

- [ ] **Step 4: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/app/budgets/page.tsx src/app/page.tsx
git commit -m "feat(budgets): add budgets management screen"
```

---

### Task 9: Sélecteur de budget dans le formulaire de dépense

**Files:** Modify `src/components/expenses/expense-quick-form.tsx`, `src/components/expenses/expense-quick-form.test.tsx`

- [ ] **Step 1: Étendre le test (picker budget)**

Ajouter ces imports en tête de `src/components/expenses/expense-quick-form.test.tsx` (remplacer la ligne d'import testing-library) :
```tsx
import { render, screen, waitFor, within } from "@testing-library/react";
```

Ajouter ce test à l'intérieur du `describe("ExpenseQuickForm", ...)` :
```tsx
  it("only lists budgets of the selected category and submits budgetId", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    const budgets = [
      { id: "b1", name: "Vacances", category: "leisure" as const },
      { id: "b2", name: "Fonds", category: "savings" as const },
    ];
    render(<ExpenseQuickForm budgets={budgets} onSuccess={onSuccess} onCancel={() => {}} />);
    const select = screen.getByLabelText("Budget (optionnel)");
    // catégorie par défaut = Essentiels → aucun budget proposé
    expect(within(select).queryByRole("option", { name: "Vacances" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Loisirs" }));
    expect(within(select).getByRole("option", { name: "Vacances" })).toBeInTheDocument();
    await userEvent.selectOptions(select, "b1");
    await userEvent.type(screen.getByLabelText("Montant"), "50");
    await userEvent.type(screen.getByPlaceholderText("Courses, restaurant…"), "Hotel");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses",
      expect.objectContaining({ body: expect.stringContaining('"budgetId":"b1"') }),
    );
  });
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/expenses/expense-quick-form.test.tsx`
Expected: FAIL — `budgets` prop / champ « Budget (optionnel) » absent.

- [ ] **Step 3: Réécrire le formulaire avec le picker**

Remplacer **tout** `src/components/expenses/expense-quick-form.tsx` par :
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
import { defaultSubcategory } from "@/lib/subcategories";

const formSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Montant invalide")
    .refine((value) => Number(value) > 0, "Montant positif requis"),
  description: z.string().trim().min(1, "Description requise").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
  category: z.enum(["essential", "leisure", "savings"]),
  subcategory: z.string().min(1),
  budgetId: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export interface BudgetOption {
  id: string;
  name: string;
  category: FormValues["category"];
}

interface ExpenseQuickFormProps {
  expense?: {
    id: string;
    amount: string;
    description: string;
    date: string;
    category: FormValues["category"];
    subcategory: string;
    budgetId: string | null;
  };
  budgets?: BudgetOption[];
  onSuccess: () => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ExpenseQuickForm({
  expense,
  budgets = [],
  onSuccess,
  onCancel,
}: ExpenseQuickFormProps) {
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
      budgetId: expense?.budgetId ?? "",
    },
  });
  const category = watch("category");
  const categoryBudgets = budgets.filter((budget) => budget.category === category);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", {
        method: expense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,
          description: values.description,
          date: values.date,
          category: values.category,
          subcategory: values.subcategory,
          budgetId: values.budgetId === "" ? null : values.budgetId,
        }),
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
              setValue("subcategory", defaultSubcategory(next));
              setValue("budgetId", "");
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
      <Field label="Budget (optionnel)">
        <select
          {...register("budgetId")}
          aria-label="Budget (optionnel)"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        >
          <option value="">Aucun</option>
          {categoryBudgets.map((budget) => (
            <option key={budget.id} value={budget.id}>
              {budget.name}
            </option>
          ))}
        </select>
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
Expected: PASS (4 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/expenses/expense-quick-form.tsx src/components/expenses/expense-quick-form.test.tsx
git commit -m "feat(expenses): add optional budget picker to quick form"
```

---

### Task 10: Propager `budgetId` + budgets dans la chaîne dépense

**Files:** Modify `src/components/expenses/expense-row.tsx`, `src/components/expenses/expenses-manager.tsx`, `src/app/expenses/page.tsx`

- [ ] **Step 1: Ajouter `budgetId` à `ExpenseRowData`**

Dans `src/components/expenses/expense-row.tsx`, dans l'interface `ExpenseRowData`, ajouter le champ après `subcategory` :
```ts
  budgetId: string | null;
```

- [ ] **Step 2: Passer `budgets` du manager au formulaire**

Remplacer **tout** `src/components/expenses/expenses-manager.tsx` par :
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpenseRow, type ExpenseRowData } from "@/components/expenses/expense-row";
import {
  ExpenseQuickForm,
  type BudgetOption,
} from "@/components/expenses/expense-quick-form";

interface ExpensesManagerProps {
  expenses: ExpenseRowData[];
  budgets?: BudgetOption[];
}

type OverlayState = { mode: "add" } | { mode: "edit"; expense: ExpenseRowData } | null;

export function ExpensesManager({ expenses, budgets = [] }: ExpensesManagerProps) {
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
            budgets={budgets}
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

- [ ] **Step 3: Charger les budgets + `budgetId` dans la page `/expenses`**

Remplacer **tout** `src/app/expenses/page.tsx` par :
```tsx
import { Prisma } from "@/generated/prisma/client";
import { ExpensesManager } from "@/components/expenses/expenses-manager";
import { listMonthExpenses } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { formatEUR } from "@/lib/formatters";
import { currentMonth } from "@/lib/month";
import type { CategoryKey } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [expenses, budgets] = await Promise.all([
    listMonthExpenses(currentMonth()),
    prisma.budget.findMany({ select: { id: true, name: true, category: true } }),
  ]);
  const total = expenses.reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
  const rows = expenses.map((expense) => ({
    id: expense.id,
    amount: expense.amount.toString(),
    description: expense.description,
    date: expense.date.toISOString().slice(0, 10),
    category: expense.category as CategoryKey,
    subcategory: expense.subcategory,
    budgetId: expense.budgetId,
  }));
  const budgetOptions = budgets.map((budget) => ({
    id: budget.id,
    name: budget.name,
    category: budget.category as CategoryKey,
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
        <ExpensesManager expenses={rows} budgets={budgetOptions} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Tests dépense + build**

Run: `npm run test -- src/components/expenses && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: tests dépense PASS (row/manager/form), build OK exit 0.

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/expenses/expense-row.tsx src/components/expenses/expenses-manager.tsx src/app/expenses/page.tsx
git commit -m "feat(expenses): link expenses to budgets"
```

---

### Task 11: Vérification finale + PR

- [ ] **Step 1: Lint, build (DB factice), suite complète**

Run:
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: lint clean, build OK (routes `/budgets`, `/api/budgets`, `/api/budgets/[id]`), tous les tests au vert.

- [ ] **Step 2: Vérification manuelle**

`npm run dev`, ouvrir `http://localhost:3000` :
- « Gérer mes budgets » → `/budgets` : 2 budgets du seed avec progression (Vacances Grèce ~250/1200, Fonds d'urgence ~200/3000) ; ajouter / modifier / supprimer un budget ;
- « Suivre mes dépenses » → `/expenses` : ajouter une dépense Loisirs et la rattacher au budget « Vacances Grèce » → retourner sur `/budgets`, la progression du budget a augmenté ;
- vérifier light + dark, mobile + desktop ; aucun rouge vif. Arrêter le serveur. Si la base a été modifiée, relancer `npx prisma db seed`.

- [ ] **Step 3: Push et PR**

```bash
git push -u origin feat/budgets-crud
gh pr create --base main --head feat/budgets-crud \
  --title "feat(budgets): add budget management and expense linking" \
  --body "Ajoute le CRUD des budgets (GET/POST/PUT/DELETE, 404 sur P2025) et l'écran /budgets avec barre de progression (cumul des dépenses liées vs cible). Ferme la boucle : le formulaire de dépense gagne un sélecteur de budget optionnel filtré par catégorie, et expenseCreateSchema/ExpenseRowData/la page dépense propagent budgetId. Helpers : listBudgetsWithSpent, budgetCreateSchema. Lien temporaire vers /budgets depuis le placeholder racine. Dashboard/nav réelle et navigation entre mois différés (#7)."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- `budgetCreateSchema` + `expenseCreateSchema` étendu → Task 1 ✅ · `listBudgetsWithSpent` → Task 2 ✅
- `GET`/`POST /api/budgets` → Task 3 ✅ · `PUT`/`DELETE` + 404 → Task 4 ✅
- `BudgetCard` (progression) → Task 5 ✅ · `BudgetForm` (deadline optionnelle) → Task 6 ✅ · `BudgetsManager` → Task 7 ✅ · page `/budgets` + lien → Task 8 ✅
- Boucle : picker dans le form → Task 9 ✅ · propagation `budgetId`/budgets (row/manager/page) → Task 10 ✅
- Tests lib/API/composants → toutes les tasks ✅ · build DB factice → Tasks 2/8/10/11 ✅
- Différé (dashboard, nav, affichage budget sur ligne, mois passés, E2E) → hors plan, conforme ✅

**Scan placeholders :** aucun TBD/TODO ; code complet ; chaque step a commande + résultat attendu.

**Cohérence des types :**
- `BudgetCardData` (`id`/`name`/`targetAmount: string`/`spent: string`/`category: CategoryKey`/`deadline: string|null`) défini en Task 5, consommé par `BudgetsManager` (Task 7) et la page (Task 8).
- `BudgetWithSpent` (Decimal) de `lib/budgets` (Task 2) → DTO string dans la page (Task 8).
- `BudgetOption` (`id`/`name`/`category`) exporté par le form (Task 9), consommé par le manager (Task 10) et la page (Task 10).
- `ExpenseRowData` gagne `budgetId: string|null` (Task 10) ; le form `expense.budgetId` (Task 9) est structurellement compatible.
- `budgetCreateSchema` réutilisé par POST (Task 3) et PUT (Task 4) ; `deadline` → `Date|null`.
- `expenseCreateSchema.budgetId` optionnel (Task 1) traversé par les handlers dépense existants (spread `...rest`).
- Libellés distincts : carte budget suppression = « Supprimer le budget », confirm dialog = « Supprimer ».
```
