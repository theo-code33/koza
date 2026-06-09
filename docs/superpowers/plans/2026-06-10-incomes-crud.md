# kōza — Revenus (CRUD complet) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter l'API revenus (GET/PUT/DELETE) et livrer un écran `/incomes` pour gérer les revenus du mois courant (lister, ajouter, modifier, supprimer) avec enveloppes 50/30/20 en direct.

**Architecture:** La page `/incomes` est un Server Component `force-dynamic` qui lit les revenus, calcule les enveloppes et passe des DTO sérialisables (montants en `string`) à un Client `IncomesManager`. Les mutations passent par l'API puis `router.refresh()` revalide le rendu serveur — la liste est toujours rendue depuis les props serveur (pas d'état local). Handlers et logique testés avec `prisma` mocké.

**Tech Stack:** Next 16 App Router, React 19, Prisma 7, Zod 4, React Hook Form 7, Tailwind v4, Vitest + Testing Library.

---

## Conventions pour chaque commit de ce plan

- Branche : **`feat/incomes-crud`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, impératif, minuscules, ≤72 car., scope dans (`api`, `incomes`, `ui`, `refactor`).
- **Aucun trailer `Co-authored-by`.** Merge commit, pas de squash. PR via `gh`, merge manuel.
- Avant chaque commit : `npm run format` puis vérifier `npm run lint` (ne jamais masquer son code retour derrière `| tail`) et `npm run test` au vert.
- Textes **FR en dur**. **Jamais de rouge** : erreurs en ton `warning`/`text-secondary`.
- Toute page Server Component lisant Prisma : `export const dynamic = "force-dynamic";` (sinon build CI cassé avec le `DATABASE_URL` factice).

## File Structure

- `src/lib/month.ts` (+test) — `currentMonth()`.
- `src/lib/incomes.ts` (+test) — `listMonthIncomes(month)`.
- `src/app/api/incomes/route.ts` (modify) + test — ajoute `GET`.
- `src/app/api/incomes/[id]/route.ts` (+test) — `PUT`, `DELETE`.
- `src/components/budget/envelopes-summary.tsx` (+test) — cartes d'enveloppes.
- `src/components/ui/confirm-dialog.tsx` (+test) + barrel — modale de confirmation.
- `src/components/incomes/income-row.tsx` (+test) — ligne de revenu.
- `src/components/incomes/income-form.tsx` (+test) — formulaire ajout/édition.
- `src/components/incomes/incomes-manager.tsx` (+test) — orchestration.
- `src/app/incomes/page.tsx` — écran (Server, force-dynamic).
- Refactors : `src/app/(onboarding)/confirm/page.tsx`, `src/components/onboarding/income-setup-form.tsx`, `src/app/page.tsx`.

---

### Task 1: Extraire `currentMonth` vers `lib/month.ts`

**Files:**
- Create: `src/lib/month.ts`, `src/lib/month.test.ts`
- Modify: `src/app/(onboarding)/confirm/page.tsx`, `src/components/onboarding/income-setup-form.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/month.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { currentMonth } from "@/lib/month";

describe("currentMonth", () => {
  it("returns the current month as YYYY-MM", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(currentMonth()).toBe(expected);
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/month.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/month.ts` :
```ts
// Mois courant au format "YYYY-MM".
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Refactorer les deux usages existants**

Dans `src/components/onboarding/income-setup-form.tsx` : supprimer la fonction locale `currentMonth` et ajouter l'import `import { currentMonth } from "@/lib/month";` (à côté des autres imports).

Dans `src/app/(onboarding)/confirm/page.tsx` : supprimer la fonction locale `currentMonth` et ajouter `import { currentMonth } from "@/lib/month";`.

- [ ] **Step 5: Lancer les tests + build**

Run: `npm run test -- src/lib/month.test.ts src/components/onboarding/income-setup-form.test.tsx && npm run build`
Expected: tests PASS, build OK (les usages refactorés compilent).

- [ ] **Step 6: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/lib/month.ts src/lib/month.test.ts "src/app/(onboarding)/confirm/page.tsx" src/components/onboarding/income-setup-form.tsx
git commit -m "refactor(incomes): extract currentMonth helper"
```

---

### Task 2: `lib/incomes.ts` — `listMonthIncomes`

**Files:** Create `src/lib/incomes.ts`, `src/lib/incomes.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/incomes.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { income: { findMany: vi.fn() } },
}));

import { listMonthIncomes } from "@/lib/incomes";
import { prisma } from "@/lib/prisma";

describe("listMonthIncomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries incomes for the month ordered by creation", async () => {
    vi.mocked(prisma.income.findMany).mockResolvedValue([{ id: "1" }] as never);
    const result = await listMonthIncomes("2026-06");
    expect(prisma.income.findMany).toHaveBeenCalledWith({
      where: { month: "2026-06" },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/incomes.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/incomes.ts` :
```ts
import type { Income } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Revenus d'un mois donné, triés par date de création.
export function listMonthIncomes(month: string): Promise<Income[]> {
  return prisma.income.findMany({ where: { month }, orderBy: { createdAt: "asc" } });
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/incomes.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/lib/incomes.ts src/lib/incomes.test.ts
git commit -m "feat(incomes): add listMonthIncomes helper"
```

---

### Task 3: `GET /api/incomes`

**Files:** Modify `src/app/api/incomes/route.ts`, `src/app/api/incomes/route.test.ts`

- [ ] **Step 1: Étendre le test (ajouter GET)**

Remplacer **tout** `src/app/api/incomes/route.test.ts` par :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { income: { create: vi.fn(), findMany: vi.fn() } },
}));

import { POST, GET } from "@/app/api/incomes/route";
import { prisma } from "@/lib/prisma";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/incomes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/incomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an income and returns 201", async () => {
    vi.mocked(prisma.income.create).mockResolvedValue({ id: "abc" } as never);
    const res = await POST(postRequest({ source: "Salaire", amount: "2500.00", month: "2026-06" }));
    expect(res.status).toBe(201);
    expect(prisma.income.create).toHaveBeenCalledWith({
      data: { source: "Salaire", amount: "2500.00", month: "2026-06" },
    });
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await POST(postRequest({ source: "", amount: "-5", month: "nope" }));
    expect(res.status).toBe(400);
    expect(prisma.income.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/incomes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists incomes for the requested month", async () => {
    vi.mocked(prisma.income.findMany).mockResolvedValue([{ id: "1" }] as never);
    const res = await GET(new Request("http://localhost/api/incomes?month=2026-06"));
    expect(res.status).toBe(200);
    expect(prisma.income.findMany).toHaveBeenCalledWith({
      where: { month: "2026-06" },
      orderBy: { createdAt: "asc" },
    });
    await expect(res.json()).resolves.toEqual([{ id: "1" }]);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/app/api/incomes/route.test.ts`
Expected: FAIL — `GET` n'est pas exporté.

- [ ] **Step 3: Ajouter le GET au handler**

Remplacer **tout** `src/app/api/incomes/route.ts` par :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";
import { listMonthIncomes } from "@/lib/incomes";
import { currentMonth } from "@/lib/month";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? currentMonth();
  const incomes = await listMonthIncomes(month);
  return NextResponse.json(incomes, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = incomeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_income" }, { status: 400 });
  }
  const income = await prisma.income.create({ data: parsed.data });
  return NextResponse.json(income, { status: 201 });
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/app/api/incomes/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/app/api/incomes/route.ts src/app/api/incomes/route.test.ts
git commit -m "feat(api): list incomes by month"
```

---

### Task 4: `PUT` + `DELETE /api/incomes/[id]`

**Files:** Create `src/app/api/incomes/[id]/route.ts`, `src/app/api/incomes/[id]/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/incomes/[id]/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { income: { update: vi.fn(), delete: vi.fn() } },
}));

import { Prisma } from "@/generated/prisma/client";
import { PUT, DELETE } from "@/app/api/incomes/[id]/route";
import { prisma } from "@/lib/prisma";

function putRequest(body: unknown): Request {
  return new Request("http://localhost/api/incomes/abc", {
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

describe("PUT /api/incomes/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates an income and returns 200", async () => {
    vi.mocked(prisma.income.update).mockResolvedValue({ id: "abc" } as never);
    const res = await PUT(putRequest({ source: "Prime", amount: "500.00", month: "2026-06" }), params("abc"));
    expect(res.status).toBe(200);
    expect(prisma.income.update).toHaveBeenCalledWith({
      where: { id: "abc" },
      data: { source: "Prime", amount: "500.00", month: "2026-06" },
    });
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await PUT(putRequest({ source: "", amount: "0", month: "x" }), params("abc"));
    expect(res.status).toBe(400);
    expect(prisma.income.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the income does not exist", async () => {
    vi.mocked(prisma.income.update).mockRejectedValue(notFound);
    const res = await PUT(putRequest({ source: "Prime", amount: "500.00", month: "2026-06" }), params("nope"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/incomes/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an income and returns 200", async () => {
    vi.mocked(prisma.income.delete).mockResolvedValue({ id: "abc" } as never);
    const res = await DELETE(new Request("http://localhost/api/incomes/abc", { method: "DELETE" }), params("abc"));
    expect(res.status).toBe(200);
    expect(prisma.income.delete).toHaveBeenCalledWith({ where: { id: "abc" } });
  });

  it("returns 404 when the income does not exist", async () => {
    vi.mocked(prisma.income.delete).mockRejectedValue(notFound);
    const res = await DELETE(new Request("http://localhost/api/incomes/nope", { method: "DELETE" }), params("nope"));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- "src/app/api/incomes/[id]/route.test.ts"`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/incomes/[id]/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = incomeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_income" }, { status: 400 });
  }
  try {
    const income = await prisma.income.update({ where: { id }, data: parsed.data });
    return NextResponse.json(income, { status: 200 });
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
    await prisma.income.delete({ where: { id } });
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

Run: `npm run test -- "src/app/api/incomes/[id]/route.test.ts"`
Expected: PASS (5 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add "src/app/api/incomes/[id]"
git commit -m "feat(api): add income update and delete handlers"
```

---

### Task 5: `EnvelopesSummary` + refactor du confirm

**Files:**
- Create: `src/components/budget/envelopes-summary.tsx`, `src/components/budget/envelopes-summary.test.tsx`
- Modify: `src/app/(onboarding)/confirm/page.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/budget/envelopes-summary.test.tsx` :
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { computeEnvelopes } from "@/lib/budget";
import { EnvelopesSummary } from "@/components/budget/envelopes-summary";

describe("EnvelopesSummary", () => {
  it("renders the three category envelopes with formatted amounts", () => {
    render(<EnvelopesSummary envelopes={computeEnvelopes("2500")} />);
    expect(screen.getByText("Essentiels")).toBeInTheDocument();
    expect(screen.getByText("Loisirs")).toBeInTheDocument();
    expect(screen.getByText("Épargne")).toBeInTheDocument();
    expect(screen.getByText(/1.?250,00/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/budget/envelopes-summary.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/budget/envelopes-summary.tsx` :
```tsx
import { Card } from "@/components/ui/card";
import { CatDot } from "@/components/ui/cat-dot";
import { formatEUR } from "@/lib/formatters";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import type { Envelopes } from "@/lib/budget";

export function EnvelopesSummary({ envelopes }: { envelopes: Envelopes }) {
  return (
    <div className="flex flex-col gap-3">
      {CATEGORY_ORDER.map((key) => (
        <Card key={key} className={CATEGORIES[key].bgClass} pad="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CatDot category={key} />
              <span className="text-[14px] font-medium text-text">{CATEGORIES[key].label}</span>
            </div>
            <span className="num text-[20px] font-light text-text">{formatEUR(envelopes[key])}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/budget/envelopes-summary.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Refactorer le confirm pour utiliser le composant**

Remplacer **tout** `src/app/(onboarding)/confirm/page.tsx` par :
```tsx
import { Prisma } from "@/generated/prisma/client";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { ConfirmActions } from "@/components/onboarding/confirm-actions";
import { EnvelopesSummary } from "@/components/budget/envelopes-summary";
import { prisma } from "@/lib/prisma";
import { computeEnvelopes } from "@/lib/budget";
import { formatEUR } from "@/lib/formatters";
import { currentMonth } from "@/lib/month";

export const dynamic = "force-dynamic";

export default async function ConfirmPage() {
  const incomes = await prisma.income.findMany({ where: { month: currentMonth() } });
  const total = incomes.reduce((sum, income) => sum.plus(income.amount), new Prisma.Decimal(0));
  const envelopes = computeEnvelopes(total);

  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={3} />
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes enveloppes</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        {total.gt(0)
          ? `Sur ${formatEUR(total)} de revenus, voici ta répartition 50 / 30 / 20.`
          : "Tu pourras ajouter tes revenus quand tu veux. Voici comment kōza les répartira."}
      </p>
      <div className="mt-8">
        <EnvelopesSummary envelopes={envelopes} />
      </div>
      <div className="mt-10">
        <ConfirmActions />
      </div>
    </div>
  );
}
```

> Note : ajout de `export const dynamic = "force-dynamic"` au passage (la page lit Prisma ; oubli du lot onboarding rattrapé ici).

- [ ] **Step 6: Build + tests + format + lint + commit**

Run: `npm run build && npm run test -- src/components/budget/envelopes-summary.test.tsx`
Expected: build OK, test PASS.
```bash
npm run format && npm run lint
git add src/components/budget "src/app/(onboarding)/confirm/page.tsx"
git commit -m "refactor(incomes): extract envelopes summary component"
```

---

### Task 6: `ConfirmDialog` (UI kit)

**Files:**
- Create: `src/components/ui/confirm-dialog.tsx`, `src/components/ui/confirm-dialog.test.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/ui/confirm-dialog.test.tsx` :
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders the title and fires confirm/cancel", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Supprimer ?"
        message="Action définitive"
        confirmLabel="Supprimer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText("Supprimer ?")).toBeInTheDocument();
    expect(screen.getByText("Action définitive")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("cancels when the scrim is clicked", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Supprimer ?" onConfirm={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByTestId("dialog-scrim"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/ui/confirm-dialog.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/ui/confirm-dialog.tsx` :
```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        data-testid="dialog-scrim"
        onClick={onCancel}
        className="scrim-enter absolute inset-0 bg-[rgba(20,20,22,0.34)]"
      />
      <div className="card screen-enter relative w-full max-w-[360px] p-6">
        <h2 className="font-serif text-[20px] text-text">{title}</h2>
        {message ? <p className="mt-2 text-[14px] text-text-secondary">{message}</p> : null}
        <div className="mt-6 flex gap-3">
          <Button variant="surface" full onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button full onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test + ajouter au barrel**

Run: `npm run test -- src/components/ui/confirm-dialog.test.tsx`
Expected: PASS (2 tests).

Ajouter à la fin de `src/components/ui/index.ts` :
```ts
export { ConfirmDialog } from "./confirm-dialog";
```

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/ui/confirm-dialog.tsx src/components/ui/confirm-dialog.test.tsx src/components/ui/index.ts
git commit -m "feat(ui): add confirm dialog primitive"
```

---

### Task 7: `IncomeRow`

**Files:** Create `src/components/incomes/income-row.tsx`, `src/components/incomes/income-row.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/incomes/income-row.test.tsx` :
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncomeRow } from "@/components/incomes/income-row";

const income = { id: "1", source: "Salaire", amount: "2500.00", month: "2026-06" };

describe("IncomeRow", () => {
  it("shows the source and formatted amount", () => {
    render(<IncomeRow income={income} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Salaire")).toBeInTheDocument();
    expect(screen.getByText(/2.?500,00/)).toBeInTheDocument();
  });

  it("fires edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<IncomeRow income={income} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Modifier le revenu" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le revenu" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/incomes/income-row.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/incomes/income-row.tsx` :
```tsx
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { formatEUR } from "@/lib/formatters";

export interface IncomeRowData {
  id: string;
  source: string;
  amount: string;
  month: string;
}

interface IncomeRowProps {
  income: IncomeRowData;
  onEdit: () => void;
  onDelete: () => void;
}

export function IncomeRow({ income, onEdit, onDelete }: IncomeRowProps) {
  return (
    <div className="card flex items-center justify-between p-4">
      <div>
        <div className="text-[15px] font-medium text-text">{income.source}</div>
        <div className="num text-[13px] text-text-secondary">{formatEUR(income.amount)}</div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton icon={Pencil} label="Modifier le revenu" onClick={onEdit} />
        <IconButton icon={Trash2} label="Supprimer le revenu" onClick={onDelete} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/incomes/income-row.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/incomes/income-row.tsx src/components/incomes/income-row.test.tsx
git commit -m "feat(incomes): add income row component"
```

---

### Task 8: `IncomeForm`

**Files:** Create `src/components/incomes/income-form.tsx`, `src/components/incomes/income-form.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/incomes/income-form.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncomeForm } from "@/components/incomes/income-form";

describe("IncomeForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates an income via POST in add mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<IncomeForm month="2026-06" onSuccess={onSuccess} onCancel={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Salaire"), "Prime");
    await userEvent.type(screen.getByPlaceholderText("2500"), "500");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/incomes", expect.objectContaining({ method: "POST" }));
  });

  it("updates an income via PUT in edit mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <IncomeForm
        month="2026-06"
        income={{ id: "1", source: "Salaire", amount: "2500.00" }}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/incomes/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/incomes/income-form.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/incomes/income-form.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const formSchema = z.object({
  source: z.string().trim().min(1, "Source requise"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Montant invalide")
    .refine((value) => Number(value) > 0, "Montant positif requis"),
});

type FormValues = z.infer<typeof formSchema>;

interface IncomeFormProps {
  month: string;
  income?: { id: string; source: string; amount: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export function IncomeForm({ month, income, onSuccess, onCancel }: IncomeFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { source: income?.source ?? "", amount: income?.amount ?? "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch(income ? `/api/incomes/${income.id}` : "/api/incomes", {
        method: income ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, month }),
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
        {income ? "Modifier le revenu" : "Nouveau revenu"}
      </h2>
      <Field label="Source" hint={errors.source?.message}>
        <input
          {...register("source")}
          placeholder="Salaire"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      <Field label="Montant" hint={errors.amount?.message}>
        <input
          {...register("amount")}
          inputMode="decimal"
          placeholder="2500"
          className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
        />
      </Field>
      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}
      <div className="flex gap-3">
        <Button variant="surface" full onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" full disabled={isSubmitting}>
          {income ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/incomes/income-form.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/incomes/income-form.tsx src/components/incomes/income-form.test.tsx
git commit -m "feat(incomes): add income add/edit form"
```

---

### Task 9: `IncomesManager`

**Files:** Create `src/components/incomes/incomes-manager.tsx`, `src/components/incomes/incomes-manager.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/incomes/incomes-manager.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { IncomesManager } from "@/components/incomes/incomes-manager";

const incomes = [{ id: "1", source: "Salaire", amount: "2500.00", month: "2026-06" }];

describe("IncomesManager", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("opens the add overlay", async () => {
    render(<IncomesManager incomes={incomes} month="2026-06" />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter un revenu" }));
    expect(screen.getByText("Nouveau revenu")).toBeInTheDocument();
  });

  it("deletes an income then refreshes", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<IncomesManager incomes={incomes} month="2026-06" />);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le revenu" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/incomes/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an empty state when there is no income", () => {
    render(<IncomesManager incomes={[]} month="2026-06" />);
    expect(screen.getByText(/Aucun revenu/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/incomes/incomes-manager.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/incomes/incomes-manager.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IncomeRow, type IncomeRowData } from "@/components/incomes/income-row";
import { IncomeForm } from "@/components/incomes/income-form";

interface IncomesManagerProps {
  incomes: IncomeRowData[];
  month: string;
}

type OverlayState = { mode: "add" } | { mode: "edit"; income: IncomeRowData } | null;

export function IncomesManager({ incomes, month }: IncomesManagerProps) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [deleting, setDeleting] = useState<IncomeRowData | null>(null);
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
      const res = await fetch(`/api/incomes/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      refresh();
    } catch {
      setActionError("Suppression impossible. Réessaie dans un instant.");
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {incomes.length === 0 ? (
        <p className="text-[15px] text-text-secondary">
          Aucun revenu pour ce mois. Ajoute ta première source pour voir tes enveloppes.
        </p>
      ) : (
        incomes.map((income) => (
          <IncomeRow
            key={income.id}
            income={income}
            onEdit={() => setOverlay({ mode: "edit", income })}
            onDelete={() => setDeleting(income)}
          />
        ))
      )}

      {actionError ? <p className="text-[13px] text-warning">{actionError}</p> : null}

      <button
        type="button"
        onClick={() => setOverlay({ mode: "add" })}
        className="tap mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> Ajouter un revenu
      </button>

      {overlay ? (
        <Overlay mode="sheet" onClose={() => setOverlay(null)}>
          <IncomeForm
            month={month}
            income={overlay.mode === "edit" ? overlay.income : undefined}
            onSuccess={refresh}
            onCancel={() => setOverlay(null)}
          />
        </Overlay>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer ce revenu ?"
          message={`« ${deleting.source} » sera retiré de ce mois.`}
          confirmLabel="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
```

> Note : l'`Overlay` est en mode `sheet` (bottom sheet) sur toutes tailles ; le mode `panel` desktop est un raffinement différé (l'`Overlay` le supporte déjà, seul le switch responsive manque).

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/incomes/incomes-manager.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/incomes/incomes-manager.tsx src/components/incomes/incomes-manager.test.tsx
git commit -m "feat(incomes): add incomes manager"
```

---

### Task 10: Écran `/incomes` + lien temporaire

**Files:**
- Create: `src/app/incomes/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Créer la page**

`src/app/incomes/page.tsx` :
```tsx
import { Prisma } from "@/generated/prisma/client";
import { EnvelopesSummary } from "@/components/budget/envelopes-summary";
import { IncomesManager } from "@/components/incomes/incomes-manager";
import { listMonthIncomes } from "@/lib/incomes";
import { computeEnvelopes } from "@/lib/budget";
import { formatEUR } from "@/lib/formatters";
import { currentMonth } from "@/lib/month";

export const dynamic = "force-dynamic";

export default async function IncomesPage() {
  const month = currentMonth();
  const incomes = await listMonthIncomes(month);
  const total = incomes.reduce((sum, income) => sum.plus(income.amount), new Prisma.Decimal(0));
  const envelopes = computeEnvelopes(total);
  const rows = incomes.map((income) => ({
    id: income.id,
    source: income.source,
    amount: income.amount.toString(),
    month: income.month,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes revenus</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        {total.gt(0)
          ? `${formatEUR(total)} ce mois-ci, répartis en 50 / 30 / 20.`
          : "Ajoute tes sources de revenu pour voir tes enveloppes."}
      </p>
      <div className="mt-8">
        <EnvelopesSummary envelopes={envelopes} />
      </div>
      <div className="mt-10">
        <IncomesManager incomes={rows} month={month} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Ajouter le lien temporaire sur le placeholder racine**

Remplacer **tout** `src/app/page.tsx` par :
```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await getOnboardingCompleted())) {
    redirect("/welcome");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center gap-4 px-6">
      <h1 className="font-serif text-[40px] leading-none text-text">kōza</h1>
      <p className="text-base text-text-secondary">Tableau de bord à venir.</p>
      <Link href="/incomes" className="text-[14px] font-medium text-accent">
        Gérer mes revenus
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Build avec DATABASE_URL factice (comme la CI)**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: build OK, exit 0 ; `/incomes` listée en `ƒ` (Dynamic), pas d'erreur de prérendu.

- [ ] **Step 4: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/app/incomes/page.tsx src/app/page.tsx
git commit -m "feat(incomes): add incomes management screen"
```

---

### Task 11: Vérification finale + PR

- [ ] **Step 1: Lint, build (DB factice), suite complète**

Run:
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: lint clean, build OK (routes `/incomes`, `/api/incomes`, `/api/incomes/[id]`), tous les tests au vert.

- [ ] **Step 2: Vérification manuelle**

`npm run dev`, ouvrir `http://localhost:3000` → cliquer « Gérer mes revenus » → `/incomes` :
- liste les revenus du mois (seed : Salaire 2 500 €, Freelance 400 €) + enveloppes (2 900 € → 1 450 / 870 / 580) ;
- ajouter un revenu (overlay) → la liste et les enveloppes se mettent à jour ;
- modifier un revenu → montant mis à jour ;
- supprimer un revenu → modale de confirmation → retrait + enveloppes recalculées ;
- vérifier light + dark, mobile + desktop ; aucun rouge. Arrêter le serveur. Si la base a été modifiée, relancer `npx prisma db seed`.

- [ ] **Step 3: Push et PR**

```bash
git push -u origin feat/incomes-crud
gh pr create --base main --head feat/incomes-crud \
  --title "feat(incomes): add income management with full crud" \
  --body "Complète l'API revenus (GET liste, PUT update, DELETE) et ajoute l'écran /incomes (mois courant) : liste, ajout/édition via overlay, suppression via modale de confirmation, enveloppes 50/30/20 en direct. Refactors DRY : currentMonth (lib/month), EnvelopesSummary (réutilisé par le confirm onboarding), ConfirmDialog ajouté au UI kit. Lien temporaire vers /incomes depuis le placeholder racine (en attendant la nav du dashboard). E2E Playwright différé."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge sur GitHub une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- `GET` liste par mois → Task 3 ✅ · `PUT`/`DELETE` + 404 `P2025` → Task 4 ✅
- `lib/month` + refactor usages → Task 1 ✅ · `lib/incomes` → Task 2 ✅
- `EnvelopesSummary` + refactor confirm → Task 5 ✅ · `ConfirmDialog` + barrel → Task 6 ✅
- `IncomeRow` → Task 7 ✅ · `IncomeForm` (add POST / edit PUT) → Task 8 ✅ · `IncomesManager` (overlay + delete + refresh + empty) → Task 9 ✅
- Page `/incomes` force-dynamic + DTO sérialisables → Task 10 ✅ · lien temporaire racine → Task 10 ✅
- Tests API/lib/composants → toutes les tasks ✅ · build DB factice → Tasks 10/11 ✅
- Différé (E2E, shell nav, mois passés, panel desktop responsive) → hors plan, conforme/documenté ✅

**Scan placeholders :** aucun TBD/TODO ; code complet partout ; chaque step a commande + résultat attendu.

**Cohérence des types :**
- `IncomeRowData` (`id`/`source`/`amount: string`/`month`) défini en Task 7, consommé par `IncomesManager` (Task 9) et la page (Task 10, via `.map` + `amount.toString()`).
- `IncomeForm.income?` = `{ id; source; amount }` (sous-ensemble de `IncomeRowData`) — compatible structurellement.
- `incomeCreateSchema` réutilisé pour POST (Task 3) et PUT (Task 4).
- `EnvelopesSummary({ envelopes: Envelopes })` (Task 5) — `Envelopes` de `lib/budget`, alimenté par `computeEnvelopes` dans le confirm et la page `/incomes`.
- `listMonthIncomes(month)` (Task 2) consommé par `GET` (Task 3) et la page (Task 10).
- Routes : statuts 200/201/400/404 cohérents entre handlers et tests.
- Libellés boutons distincts pour la suppression : `IconButton` ligne = « Supprimer le revenu », confirm dialog = « Supprimer » (pas de collision de `getByRole`).
```
