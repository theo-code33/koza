# kōza — Onboarding (flow 3 étapes) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire le flow d'onboarding en 3 étapes (Bienvenue → Revenus → Confirmation) comme premier slice vertical : écrans `(onboarding)`, gate à la racine, Route Handlers `POST /api/incomes` et `PATCH /api/settings` validés par Zod, et la première logique 50/30/20.

**Architecture:** Server Components pour les pages (lecture Prisma + redirections), Client Components pour les formulaires interactifs (React Hook Form). La logique pure vit dans `src/lib/` (budget, formatters, validators, settings) et est testée unitairement ; les handlers sont testés avec `prisma` mocké (pas de DB en CI unit). Les montants sont des `Decimal` Prisma, jamais des floats.

**Tech Stack:** Next 16 App Router, React 19, Prisma 7, Zod 4, React Hook Form 7 + `@hookform/resolvers`, Tailwind v4, Vitest + Testing Library.

---

## Conventions pour chaque commit de ce plan

- Branche : **`feat/onboarding`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, impératif, minuscules, sans point final, ≤72 car., scope dans (`onboarding`, `api`, `db`, `deps`).
- **Aucun trailer `Co-authored-by`.** Merge commit, pas de squash. PR via `gh`, merge manuel par le mainteneur.
- `npm run lint` + `npm run test` au vert avant chaque commit (`npm run format` si prettier râle). **Attention :** ne pas masquer le code retour du lint derrière un `| tail` avant de committer.
- Textes **FR en dur** (i18n différé). **Jamais de rouge** : erreurs en ton `warning`/`text-secondary`.

## File Structure

- `src/lib/validators.ts` (+test) — schémas Zod partagés.
- `src/lib/budget.ts` (+test) — `computeEnvelopes`.
- `src/lib/formatters.ts` (+test) — `formatEUR`.
- `src/lib/settings.ts` (+test) — helpers UserSettings.
- `src/app/api/incomes/route.ts` (+test) — `POST`.
- `src/app/api/settings/route.ts` (+test) — `PATCH`.
- `src/app/page.tsx` (réécriture) + `src/app/page.test.tsx` (réécriture) — gate racine.
- `src/components/onboarding/step-indicator.tsx` (+test).
- `src/app/(onboarding)/layout.tsx`, `welcome/page.tsx`, `setup/page.tsx`, `confirm/page.tsx`.
- `src/components/onboarding/income-setup-form.tsx` (+test) — Client, RHF.
- `src/components/onboarding/confirm-actions.tsx` (+test) — Client.

---

### Task 1: Installer les dépendances

**Files:** Modify `package.json`

- [ ] **Step 1: Installer zod, react-hook-form, @hookform/resolvers**

Run:
```bash
npm install zod react-hook-form @hookform/resolvers
```
Expected: les 3 ajoutées à `dependencies`.

- [ ] **Step 2: Vérifier que le projet build toujours**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add zod, react-hook-form and resolvers"
```

---

### Task 2: Validators Zod

**Files:** Create `src/lib/validators.ts`, `src/lib/validators.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/validators.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { incomeCreateSchema, settingsUpdateSchema } from "@/lib/validators";

describe("incomeCreateSchema", () => {
  it("accepts a valid income", () => {
    const result = incomeCreateSchema.safeParse({
      source: "Salaire",
      amount: "2500.00",
      month: "2026-06",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive amount, a bad month and an empty source", () => {
    expect(incomeCreateSchema.safeParse({ source: "X", amount: "0", month: "2026-06" }).success).toBe(false);
    expect(incomeCreateSchema.safeParse({ source: "X", amount: "10", month: "2026/06" }).success).toBe(false);
    expect(incomeCreateSchema.safeParse({ source: "  ", amount: "10", month: "2026-06" }).success).toBe(false);
  });
});

describe("settingsUpdateSchema", () => {
  it("accepts an onboarding flag update", () => {
    expect(settingsUpdateSchema.safeParse({ onboardingCompleted: true }).success).toBe(true);
  });

  it("rejects an empty object", () => {
    expect(settingsUpdateSchema.safeParse({}).success).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: FAIL — module `@/lib/validators` introuvable.

- [ ] **Step 3: Implémenter les schémas**

`src/lib/validators.ts` :
```ts
import { z } from "zod";

export const incomeCreateSchema = z.object({
  source: z.string().trim().min(1).max(80),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const settingsUpdateSchema = z
  .object({
    onboardingCompleted: z.boolean().optional(),
    theme: z.enum(["light", "dark"]).optional(),
    locale: z.enum(["fr", "en"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0);

export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Lint + commit**

Run: `npm run lint`
Expected: clean.
```bash
git add src/lib/validators.ts src/lib/validators.test.ts
git commit -m "feat(api): add zod validators for income and settings"
```

---

### Task 3: Logique 50/30/20

**Files:** Create `src/lib/budget.ts`, `src/lib/budget.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/budget.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { computeEnvelopes } from "@/lib/budget";

describe("computeEnvelopes", () => {
  it("splits a total into 50 / 30 / 20", () => {
    const envelopes = computeEnvelopes("2500");
    expect(envelopes.essential.toString()).toBe("1250");
    expect(envelopes.leisure.toString()).toBe("750");
    expect(envelopes.savings.toString()).toBe("500");
  });

  it("returns zeros for a zero total", () => {
    const envelopes = computeEnvelopes(0);
    expect(envelopes.essential.toString()).toBe("0");
    expect(envelopes.leisure.toString()).toBe("0");
    expect(envelopes.savings.toString()).toBe("0");
  });

  it("keeps the envelopes summing to the total", () => {
    const envelopes = computeEnvelopes(new Prisma.Decimal("3200.50"));
    const sum = envelopes.essential.plus(envelopes.leisure).plus(envelopes.savings);
    expect(sum.toString()).toBe("3200.5");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/budget.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/budget.ts` :
```ts
import { Prisma } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/categories";

export interface Envelopes {
  essential: Prisma.Decimal;
  leisure: Prisma.Decimal;
  savings: Prisma.Decimal;
}

// Répartit un total mensuel selon les parts 50 / 30 / 20 (Decimal, jamais de float).
export function computeEnvelopes(total: Prisma.Decimal | string | number): Envelopes {
  const value = new Prisma.Decimal(total);
  return {
    essential: value.mul(CATEGORIES.essential.share),
    leisure: value.mul(CATEGORIES.leisure.share),
    savings: value.mul(CATEGORIES.savings.share),
  };
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/budget.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Lint + commit**

```bash
git add src/lib/budget.ts src/lib/budget.test.ts
git commit -m "feat(db): add 50/30/20 envelope computation"
```

---

### Task 4: Formatter monétaire

**Files:** Create `src/lib/formatters.ts`, `src/lib/formatters.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/formatters.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { formatEUR } from "@/lib/formatters";

describe("formatEUR", () => {
  it("formats euros in French by default", () => {
    expect(formatEUR(1250).replace(/\s/g, " ")).toBe("1 250,00 €");
  });

  it("formats euros in English when asked", () => {
    expect(formatEUR(1250, "en")).toBe("€1,250.00");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/formatters.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/formatters.ts` :
```ts
import { Prisma } from "@/generated/prisma/client";

// Formate un montant en euros selon la locale (devise toujours EUR).
export function formatEUR(
  amount: Prisma.Decimal | string | number,
  locale: "fr" | "en" = "fr",
): string {
  const value = amount instanceof Prisma.Decimal ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/formatters.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
git add src/lib/formatters.ts src/lib/formatters.test.ts
git commit -m "feat(i18n): add euro amount formatter"
```

---

### Task 5: Helper UserSettings

**Files:** Create `src/lib/settings.ts`, `src/lib/settings.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/settings.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { userSettings: { findUnique: vi.fn() } },
}));

import { getOnboardingCompleted } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

describe("getOnboardingCompleted", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the stored flag", async () => {
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue({ onboardingCompleted: true } as never);
    expect(await getOnboardingCompleted()).toBe(true);
  });

  it("returns false when there is no settings row", async () => {
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue(null as never);
    expect(await getOnboardingCompleted()).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/settings.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/settings.ts` :
```ts
import { prisma } from "@/lib/prisma";

const DEFAULT_ID = "default";

// Garantit l'existence de la ligne de réglages unique du MVP.
export async function getOrCreateDefaultSettings() {
  return prisma.userSettings.upsert({
    where: { id: DEFAULT_ID },
    update: {},
    create: { id: DEFAULT_ID },
  });
}

// Vrai si l'onboarding a déjà été terminé (false si aucune ligne).
export async function getOnboardingCompleted(): Promise<boolean> {
  const settings = await prisma.userSettings.findUnique({ where: { id: DEFAULT_ID } });
  return settings?.onboardingCompleted ?? false;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/settings.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
git add src/lib/settings.ts src/lib/settings.test.ts
git commit -m "feat(db): add user settings helpers"
```

---

### Task 6: Route Handler POST /api/incomes

**Files:** Create `src/app/api/incomes/route.ts`, `src/app/api/incomes/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/incomes/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { income: { create: vi.fn() } },
}));

import { POST } from "@/app/api/incomes/route";
import { prisma } from "@/lib/prisma";

function request(body: unknown): Request {
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
    const res = await POST(request({ source: "Salaire", amount: "2500.00", month: "2026-06" }));
    expect(res.status).toBe(201);
    expect(prisma.income.create).toHaveBeenCalledWith({
      data: { source: "Salaire", amount: "2500.00", month: "2026-06" },
    });
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await POST(request({ source: "", amount: "-5", month: "nope" }));
    expect(res.status).toBe(400);
    expect(prisma.income.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/app/api/incomes/route.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/incomes/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { incomeCreateSchema } from "@/lib/validators";

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
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
git add src/app/api/incomes
git commit -m "feat(api): add income creation route handler"
```

---

### Task 7: Route Handler PATCH /api/settings

**Files:** Create `src/app/api/settings/route.ts`, `src/app/api/settings/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/settings/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { userSettings: { upsert: vi.fn() } },
}));

import { PATCH } from "@/app/api/settings/route";
import { prisma } from "@/lib/prisma";

function request(body: unknown): Request {
  return new Request("http://localhost/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/settings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the settings and returns 200", async () => {
    vi.mocked(prisma.userSettings.upsert).mockResolvedValue({ onboardingCompleted: true } as never);
    const res = await PATCH(request({ onboardingCompleted: true }));
    expect(res.status).toBe(200);
    expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
      where: { id: "default" },
      update: { onboardingCompleted: true },
      create: { id: "default", onboardingCompleted: true },
    });
  });

  it("rejects an empty payload with 400", async () => {
    const res = await PATCH(request({}));
    expect(res.status).toBe(400);
    expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/app/api/settings/route.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/settings/route.ts` :
```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsUpdateSchema } from "@/lib/validators";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_settings" }, { status: 400 });
  }
  const settings = await prisma.userSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });
  return NextResponse.json(settings, { status: 200 });
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/app/api/settings/route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
git add src/app/api/settings
git commit -m "feat(api): add settings update route handler"
```

---

### Task 8: Gate à la racine

**Files:** Modify `src/app/page.tsx`, `src/app/page.test.tsx`

- [ ] **Step 1: Réécrire le test**

Remplacer **tout** `src/app/page.test.tsx` par :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/settings", () => ({ getOnboardingCompleted: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import Home from "@/app/page";
import { getOnboardingCompleted } from "@/lib/settings";
import { redirect } from "next/navigation";

describe("Home gate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to /welcome when onboarding is not complete", async () => {
    vi.mocked(getOnboardingCompleted).mockResolvedValue(false);
    await Home();
    expect(redirect).toHaveBeenCalledWith("/welcome");
  });

  it("renders the placeholder when onboarding is complete", async () => {
    vi.mocked(getOnboardingCompleted).mockResolvedValue(true);
    render(await Home());
    expect(screen.getByRole("heading", { name: "kōza" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/app/page.test.tsx`
Expected: FAIL — `getOnboardingCompleted` n'existe pas encore / `Home` ne redirige pas.

- [ ] **Step 3: Réécrire la page**

Remplacer **tout** `src/app/page.tsx` par :
```tsx
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";

export default async function Home() {
  if (!(await getOnboardingCompleted())) {
    redirect("/welcome");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center gap-4 px-6">
      <h1 className="font-serif text-[40px] leading-none text-text">kōza</h1>
      <p className="text-base text-text-secondary">Tableau de bord à venir.</p>
    </main>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/app/page.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
git add src/app/page.tsx src/app/page.test.tsx
git commit -m "feat(onboarding): gate root on onboarding completion"
```

---

### Task 9: Indicateur d'étape + layout + écran de bienvenue

**Files:**
- Create: `src/components/onboarding/step-indicator.tsx`, `src/components/onboarding/step-indicator.test.tsx`
- Create: `src/app/(onboarding)/layout.tsx`, `src/app/(onboarding)/welcome/page.tsx`

- [ ] **Step 1: Écrire le test de l'indicateur**

`src/components/onboarding/step-indicator.test.tsx` :
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepIndicator } from "@/components/onboarding/step-indicator";

describe("StepIndicator", () => {
  it("exposes the current step and renders one segment per step", () => {
    render(<StepIndicator step={2} />);
    const indicator = screen.getByLabelText("Étape 2 sur 3");
    expect(indicator.children).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/onboarding/step-indicator.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter l'indicateur**

`src/components/onboarding/step-indicator.tsx` :
```tsx
import { cn } from "@/lib/cn";

interface StepIndicatorProps {
  step: number;
  total?: number;
}

export function StepIndicator({ step, total = 3 }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center gap-1.5" aria-label={`Étape ${step} sur ${total}`}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 w-6 rounded-full",
            index < step ? "bg-accent" : "bg-surface-alt",
          )}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/onboarding/step-indicator.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Créer le layout d'onboarding**

`src/app/(onboarding)/layout.tsx` :
```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOnboardingCompleted } from "@/lib/settings";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  if (await getOnboardingCompleted()) {
    redirect("/");
  }
  return <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">{children}</main>;
}
```

- [ ] **Step 6: Créer l'écran de bienvenue**

`src/app/(onboarding)/welcome/page.tsx` :
```tsx
import Link from "next/link";
import { StepIndicator } from "@/components/onboarding/step-indicator";

export default function WelcomePage() {
  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={1} />
      <h1 className="font-serif text-[40px] leading-tight text-text">Bienvenue sur kōza</h1>
      <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
        kōza répartit tes revenus selon la règle 50 / 30 / 20 : la moitié pour l&apos;essentiel, 30 %
        pour les loisirs, 20 % pour l&apos;épargne. Un budget clair, sans pression.
      </p>
      <div className="mt-10">
        <Link
          href="/setup"
          className="tap inline-flex h-11 items-center justify-center rounded-button bg-accent px-5 text-[15px] font-medium text-white"
        >
          Commencer
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Vérifier build + lint**

Run: `npm run build && npm run lint`
Expected: build OK (route `/welcome` listée), lint clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/onboarding/step-indicator.tsx src/components/onboarding/step-indicator.test.tsx "src/app/(onboarding)/layout.tsx" "src/app/(onboarding)/welcome/page.tsx"
git commit -m "feat(onboarding): add step indicator, layout and welcome screen"
```

---

### Task 10: Formulaire revenus + écran setup

**Files:**
- Create: `src/components/onboarding/income-setup-form.tsx`, `src/components/onboarding/income-setup-form.test.tsx`
- Create: `src/app/(onboarding)/setup/page.tsx`

- [ ] **Step 1: Écrire le test du formulaire**

`src/components/onboarding/income-setup-form.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { IncomeSetupForm } from "@/components/onboarding/income-setup-form";

describe("IncomeSetupForm", () => {
  beforeEach(() => {
    push.mockClear();
    vi.restoreAllMocks();
  });

  it("adds a second income source row", async () => {
    render(<IncomeSetupForm />);
    expect(screen.getAllByPlaceholderText("Salaire")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter une source" }));
    expect(screen.getAllByPlaceholderText("Salaire")).toHaveLength(2);
  });

  it("posts the income then navigates to confirm", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<IncomeSetupForm />);
    await userEvent.type(screen.getByPlaceholderText("Salaire"), "Salaire");
    await userEvent.type(screen.getByPlaceholderText("2500"), "2500");
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/confirm"));
    expect(fetchMock).toHaveBeenCalledWith("/api/incomes", expect.objectContaining({ method: "POST" }));
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/onboarding/income-setup-form.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter le formulaire**

`src/components/onboarding/income-setup-form.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";

const formSchema = z.object({
  incomes: z
    .array(
      z.object({
        source: z.string().trim().min(1, "Source requise"),
        amount: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, "Montant invalide")
          .refine((value) => Number(value) > 0, "Montant positif requis"),
      }),
    )
    .min(1),
});

type FormValues = z.infer<typeof formSchema>;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function IncomeSetupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { incomes: [{ source: "", amount: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "incomes" });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const month = currentMonth();
    try {
      for (const income of values.incomes) {
        const res = await fetch("/api/incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...income, month }),
        });
        if (!res.ok) throw new Error("save_failed");
      }
      router.push("/confirm");
    } catch {
      setSubmitError("Un souci est survenu. Réessaie dans un instant.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Source" hint={errors.incomes?.[index]?.source?.message}>
              <input
                {...register(`incomes.${index}.source`)}
                placeholder="Salaire"
                className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
              />
            </Field>
          </div>
          <div className="w-32">
            <Field label="Montant" hint={errors.incomes?.[index]?.amount?.message}>
              <input
                {...register(`incomes.${index}.amount`)}
                inputMode="decimal"
                placeholder="2500"
                className="h-12 w-full rounded-input bg-surface-alt px-4 text-[15px] text-text outline-none"
              />
            </Field>
          </div>
          {fields.length > 1 ? (
            <IconButton icon={X} label="Retirer cette source" onClick={() => remove(index)} />
          ) : null}
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ source: "", amount: "" })}
        className="tap inline-flex items-center gap-1.5 text-[14px] font-medium text-accent"
      >
        <Plus size={16} strokeWidth={1.8} /> Ajouter une source
      </button>

      {submitError ? <p className="text-[13px] text-warning">{submitError}</p> : null}

      <Button type="submit" full disabled={isSubmitting}>
        Continuer
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/onboarding/income-setup-form.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Créer l'écran setup**

`src/app/(onboarding)/setup/page.tsx` :
```tsx
import Link from "next/link";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { IncomeSetupForm } from "@/components/onboarding/income-setup-form";

export default function SetupPage() {
  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={2} />
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes revenus</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        Ajoute ta principale source de revenu. Tu pourras en ajouter d&apos;autres ou passer cette
        étape.
      </p>
      <div className="mt-8">
        <IncomeSetupForm />
      </div>
      <div className="mt-6">
        <Link href="/confirm" className="text-[14px] text-text-secondary">
          Passer pour l&apos;instant
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Build + lint + commit**

Run: `npm run build && npm run lint`
Expected: build OK (route `/setup`), lint clean.
```bash
git add src/components/onboarding/income-setup-form.tsx src/components/onboarding/income-setup-form.test.tsx "src/app/(onboarding)/setup/page.tsx"
git commit -m "feat(onboarding): add income setup form and screen"
```

---

### Task 11: Actions de confirmation + écran confirm

**Files:**
- Create: `src/components/onboarding/confirm-actions.tsx`, `src/components/onboarding/confirm-actions.test.tsx`
- Create: `src/app/(onboarding)/confirm/page.tsx`

- [ ] **Step 1: Écrire le test des actions**

`src/components/onboarding/confirm-actions.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { ConfirmActions } from "@/components/onboarding/confirm-actions";

describe("ConfirmActions", () => {
  beforeEach(() => {
    push.mockClear();
    vi.restoreAllMocks();
  });

  it("marks onboarding complete then navigates home", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<ConfirmActions />);
    await userEvent.click(screen.getByRole("button", { name: "Terminer" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/onboarding/confirm-actions.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter les actions**

`src/components/onboarding/confirm-actions.tsx` :
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConfirmActions() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      if (!res.ok) throw new Error("finish_failed");
      router.push("/");
    } catch {
      setError("Un souci est survenu. Réessaie dans un instant.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-[13px] text-warning">{error}</p> : null}
      <Button full disabled={busy} onClick={finish}>
        Terminer
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/onboarding/confirm-actions.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Créer l'écran confirm**

`src/app/(onboarding)/confirm/page.tsx` :
```tsx
import { Prisma } from "@/generated/prisma/client";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { ConfirmActions } from "@/components/onboarding/confirm-actions";
import { Card } from "@/components/ui/card";
import { CatDot } from "@/components/ui/cat-dot";
import { prisma } from "@/lib/prisma";
import { computeEnvelopes } from "@/lib/budget";
import { formatEUR } from "@/lib/formatters";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

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
      <div className="mt-8 flex flex-col gap-3">
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
      <div className="mt-10">
        <ConfirmActions />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Build + lint + commit**

Run: `npm run build && npm run lint`
Expected: build OK (route `/confirm`), lint clean.
```bash
git add src/components/onboarding/confirm-actions.tsx src/components/onboarding/confirm-actions.test.tsx "src/app/(onboarding)/confirm/page.tsx"
git commit -m "feat(onboarding): add confirmation screen with envelopes"
```

---

### Task 12: Vérification finale + PR

- [ ] **Step 1: Lint, build et suite de tests complète**

Run: `npm run lint && npm run build && npm run test`
Expected: lint clean, build OK (routes `/`, `/welcome`, `/setup`, `/confirm`, `/api/incomes`, `/api/settings`), tous les tests au vert.

- [ ] **Step 2: Vérification manuelle du flow**

Pour voir l'onboarding, repasser le flag à `false` (le seed le met à `true`) :
```bash
npx prisma studio
```
Mettre `UserSettings.onboardingCompleted` à `false`, fermer Studio. Puis `npm run dev`, ouvrir `http://localhost:3000` :
- redirection vers `/welcome` ; parcours welcome → setup (saisir « Salaire » / 2500, ou « Passer ») → confirm (enveloppes 1 250 / 750 / 500) → « Terminer » ⇒ retour `/` (placeholder) ;
- recharger `/` : reste sur le placeholder (plus d'onboarding) ;
- vérifier light + dark et mobile + desktop ; aucun rouge. Arrêter le serveur.

- [ ] **Step 3: Push et ouverture de la PR**

```bash
git push -u origin feat/onboarding
gh pr create --base main --head feat/onboarding \
  --title "feat(onboarding): add 3-step onboarding flow" \
  --body "Ajoute le flow d'onboarding (bienvenue → revenus → confirmation) comme premier slice vertical : route group (onboarding), gate à la racine, Route Handlers POST /api/incomes et PATCH /api/settings validés par Zod, logique 50/30/20 (computeEnvelopes), formatter euro et validators. Tests unitaires (budget, validators, formatters, settings), handlers (prisma mocké) et composants. E2E Playwright différé à une PR test-infra."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge sur GitHub une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- Gate racine + placeholder → Task 8 ✅ · route group + layout + 3 écrans → Tasks 9/10/11 ✅
- `POST /api/incomes` + `PATCH /api/settings` + Zod → Tasks 2/6/7 ✅
- `computeEnvelopes` / `formatEUR` / `getOnboardingCompleted` → Tasks 3/4/5 ✅
- Form RHF multi-sources + skip + erreurs douces → Task 10 ✅ · confirm lit DB + calcule → Task 11 ✅
- Dépendances zod/RHF/resolvers → Task 1 ✅
- Tests unit + handlers (prisma mocké) + composants → toutes les tasks ✅
- Différé (E2E Playwright, i18n, dashboard réel) → hors plan, conforme au spec ✅

**Scan placeholders :** aucun TBD/TODO ; tout le code est complet ; chaque step a commande + résultat attendu.

**Cohérence des types :**
- `incomeCreateSchema` (`source`/`amount` string/`month`) cohérent entre validators, handler POST et form.
- `settingsUpdateSchema` (`onboardingCompleted`…) cohérent entre validators, handler PATCH et ConfirmActions (`{ onboardingCompleted: true }`).
- `computeEnvelopes(total) → { essential, leisure, savings }` (Prisma.Decimal) consommé par confirm via `envelopes[key]` avec `key ∈ CATEGORY_ORDER`.
- `getOnboardingCompleted()` consommé par le gate (Task 8) et le layout (Task 9), défini en Task 5.
- `formatEUR` (Decimal|string|number) utilisé en Task 11.
- Routes API renvoient les statuts attendus par les tests (201/400/200).
