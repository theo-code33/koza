# kōza — Page Réglages (Cycle 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer l'écran `/settings` (bascule de thème clair/sombre, export JSON des données, lien vers les revenus) et faire entrer Réglages dans la navigation à la place de Revenus.

**Architecture:** Page Server `/settings` sous le route group `(main)`, composée de sections statiques + un client island `ThemeToggle` (next-themes). L'export passe par `buildExport()` (lib testée, prisma mocké) exposé en `GET /api/export` (JSON téléchargeable, `Decimal → string`, `Content-Disposition`). La nav échange l'entrée Revenus contre Réglages. Le switch de langue est affiché mais inerte (cycle i18n ultérieur).

**Tech Stack:** Next 16 App Router, React 19, Prisma 7, next-themes, Tailwind v4, Vitest + Testing Library, lucide-react.

---

## Conventions pour chaque commit de ce plan

- Branche : **`feat/settings-page`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, impératif, minuscules, ≤72 car., scope dans (`settings`, `nav`, `api`, `lib`).
- **Aucun trailer `Co-authored-by`.** Merge commit, pas de squash. PR via `gh`, merge manuel.
- Avant chaque commit : `npm run format`, puis `npm run lint` (0 erreur ; le warning `react-hooks/incompatible-library` pré-existant est toléré) et `npm run test` au vert.
- **Pages/handlers Server + lib lisant Prisma : lancer `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build` avant de committer** (Vitest ne type-checke pas ; `noUncheckedIndexedAccess`).
- Routes Server lisant Prisma : `export const dynamic = "force-dynamic";`.

## File Structure

- `src/lib/export.ts` (create) + `src/lib/export.test.ts` — `buildExport`.
- `src/app/api/export/route.ts` (create) + `src/app/api/export/route.test.ts` — `GET`.
- `src/components/settings/theme-toggle.tsx` (create) + test.
- `src/components/nav/app-nav.tsx` (modify) + `src/components/nav/app-nav.test.tsx` (modify) — Revenus → Réglages.
- `src/app/(main)/settings/page.tsx` (create) — assemble la page.

---

### Task 1: `buildExport`

**Files:** Create `src/lib/export.ts`, `src/lib/export.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/export.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    income: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
    budget: { findMany: vi.fn() },
    userSettings: { findUnique: vi.fn() },
  },
}));

import { Prisma } from "@/generated/prisma/client";
import { buildExport } from "@/lib/export";
import { prisma } from "@/lib/prisma";

describe("buildExport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates all data with decimal amounts serialised as strings", async () => {
    vi.mocked(prisma.income.findMany).mockResolvedValue([
      { id: "i1", source: "Salaire", amount: new Prisma.Decimal("2000"), month: "2026-06" },
    ] as never);
    vi.mocked(prisma.expense.findMany).mockResolvedValue([
      { id: "e1", amount: new Prisma.Decimal("12.50"), description: "Pain" },
    ] as never);
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { id: "b1", name: "Grèce", targetAmount: new Prisma.Decimal("1200") },
    ] as never);
    vi.mocked(prisma.userSettings.findUnique).mockResolvedValue({
      id: "default",
      theme: "light",
      locale: "fr",
      onboardingCompleted: true,
    } as never);

    const data = await buildExport();

    expect(typeof data.exportedAt).toBe("string");
    expect((data.incomes[0] as { amount: string }).amount).toBe("2000");
    expect((data.expenses[0] as { amount: string }).amount).toBe("12.5");
    expect((data.budgets[0] as { targetAmount: string }).targetAmount).toBe("1200");
    expect(data.settings).toMatchObject({ locale: "fr" });
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/lib/export.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/lib/export.ts` :
```ts
import { prisma } from "@/lib/prisma";

export interface ExportData {
  exportedAt: string;
  incomes: unknown[];
  expenses: unknown[];
  budgets: unknown[];
  settings: unknown;
}

// Rassemble toutes les données de l'app en un objet sérialisable (montants Decimal → string).
export async function buildExport(): Promise<ExportData> {
  const [incomes, expenses, budgets, settings] = await Promise.all([
    prisma.income.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.expense.findMany({ orderBy: { date: "asc" } }),
    prisma.budget.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.userSettings.findUnique({ where: { id: "default" } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    incomes: incomes.map((income) => ({ ...income, amount: income.amount.toString() })),
    expenses: expenses.map((expense) => ({ ...expense, amount: expense.amount.toString() })),
    budgets: budgets.map((budget) => ({
      ...budget,
      targetAmount: budget.targetAmount.toString(),
    })),
    settings,
  };
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/lib/export.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Build, format, lint, commit**

```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/export.ts src/lib/export.test.ts
git commit -m "feat(lib): add buildExport for json data export"
```

---

### Task 2: `GET /api/export`

**Files:** Create `src/app/api/export/route.ts`, `src/app/api/export/route.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/app/api/export/route.test.ts` :
```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/export", () => ({ buildExport: vi.fn() }));

import { GET } from "@/app/api/export/route";
import { buildExport } from "@/lib/export";

describe("GET /api/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a downloadable json payload", async () => {
    vi.mocked(buildExport).mockResolvedValue({
      exportedAt: "2026-06-10T00:00:00.000Z",
      incomes: [],
      expenses: [],
      budgets: [],
      settings: null,
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("content-disposition")).toContain('attachment; filename="koza-export-');
    const body = await res.json();
    expect(body.exportedAt).toBe("2026-06-10T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/app/api/export/route.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/app/api/export/route.ts` :
```ts
import { NextResponse } from "next/server";
import { buildExport } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await buildExport();
  const filename = `koza-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/app/api/export/route.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Build, format, lint, commit**

```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/app/api/export/route.ts src/app/api/export/route.test.ts
git commit -m "feat(api): add data export endpoint"
```

---

### Task 3: `ThemeToggle`

**Files:** Create `src/components/settings/theme-toggle.tsx`, `src/components/settings/theme-toggle.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/settings/theme-toggle.test.tsx` :
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme }),
}));

import { ThemeToggle } from "@/components/settings/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => setTheme.mockClear());

  it("reflects the light theme and switches to dark on click", async () => {
    render(<ThemeToggle />);
    const sw = screen.getByRole("switch", { name: "Activer le thème sombre" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sw);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/settings/theme-toggle.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

`src/components/settings/theme-toggle.tsx` :
```tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toggle } from "@/components/ui/toggle";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Toggle
      on={isDark}
      onChange={(next) => setTheme(next ? "dark" : "light")}
      label="Activer le thème sombre"
    />
  );
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/settings/theme-toggle.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/settings/theme-toggle.tsx src/components/settings/theme-toggle.test.tsx
git commit -m "feat(settings): add dark mode theme toggle"
```

---

### Task 4: Nav — Revenus → Réglages

**Files:** Modify `src/components/nav/app-nav.tsx`, `src/components/nav/app-nav.test.tsx`

- [ ] **Step 1: Mettre à jour le test**

Dans `src/components/nav/app-nav.test.tsx`, remplacer la ligne :
```tsx
    expect(screen.getAllByRole("link", { name: "Revenus" })).toHaveLength(2);
```
par :
```tsx
    expect(screen.getAllByRole("link", { name: "Réglages" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Revenus" })).not.toBeInTheDocument();
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npm run test -- src/components/nav/app-nav.test.tsx`
Expected: FAIL — « Réglages » absent, « Revenus » encore présent.

- [ ] **Step 3: Modifier la nav**

Dans `src/components/nav/app-nav.tsx`, remplacer l'import lucide :
```tsx
import { LayoutDashboard, Receipt, Target, Wallet, type LucideIcon } from "lucide-react";
```
par :
```tsx
import { LayoutDashboard, Receipt, Target, Settings, type LucideIcon } from "lucide-react";
```

Puis dans `ITEMS`, remplacer la dernière entrée :
```tsx
  { href: "/incomes", label: "Revenus", icon: Wallet },
```
par :
```tsx
  { href: "/settings", label: "Réglages", icon: Settings },
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npm run test -- src/components/nav/app-nav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format && npm run lint
git add src/components/nav/app-nav.tsx src/components/nav/app-nav.test.tsx
git commit -m "feat(nav): replace incomes with settings entry"
```

---

### Task 5: Écran `/settings`

**Files:** Create `src/app/(main)/settings/page.tsx`

- [ ] **Step 1: Créer la page**

`src/app/(main)/settings/page.tsx` :
```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-10 px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Réglages</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Apparence
        </h2>
        <div className="card flex items-center justify-between p-5">
          <span className="text-[15px] text-text">Thème sombre</span>
          <ThemeToggle />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Langue
        </h2>
        <div className="card flex items-center justify-between p-5">
          <span className="text-[15px] text-text">Français</span>
          <span className="text-[13px] text-muted">English — bientôt</span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Revenus
        </h2>
        <Link href="/incomes" className="text-[14px] font-medium text-accent">
          Gérer mes revenus
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-secondary">
          Données
        </h2>
        <a href="/api/export" download className="text-[14px] font-medium text-accent">
          Exporter mes données (JSON)
        </a>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Build avec DATABASE_URL factice**

Run: `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build`
Expected: build OK, exit 0 ; `/settings` et `/api/export` listées en `ƒ` (Dynamic).

- [ ] **Step 3: Format, lint, commit**

```bash
npm run format && npm run lint
git add "src/app/(main)/settings/page.tsx"
git commit -m "feat(settings): add settings screen"
```

---

### Task 6: Vérification finale + PR

- [ ] **Step 1: Lint, build (DB factice), suite complète**

Run:
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: lint clean (hors warning pré-existant), build OK (`/settings`, `/api/export`), tous les tests au vert.

- [ ] **Step 2: Vérification manuelle**

`npm run dev`, ouvrir `http://localhost:3000` :
- la nav affiche désormais **Réglages** (engrenage) à la place de Revenus ; cliquer → `/settings` ;
- **Apparence** : basculer le toggle → l'app passe en dark mode instantanément et la préférence persiste après reload ;
- **Langue** : « Français » + « English — bientôt » (inerte) ;
- **Revenus** : « Gérer mes revenus » → `/incomes` ;
- **Données** : « Exporter mes données (JSON) » → télécharge `koza-export-AAAA-MM-JJ.json` contenant incomes/expenses/budgets/settings ;
- vérifier light + dark, mobile + desktop. Arrêter le serveur.

- [ ] **Step 3: Push et PR**

```bash
git push -u origin feat/settings-page
gh pr create --base main --head feat/settings-page \
  --title "feat(settings): add settings page with dark mode and export" \
  --body "Ajoute l'écran /settings (bascule de thème clair/sombre via next-themes, export JSON de toutes les données via GET /api/export, lien vers la gestion des revenus) et remplace Revenus par Réglages dans la navigation. Le switch de langue est affiché mais inerte — l'i18n complet (next-intl + extraction des chaînes) est le cycle suivant. Helpers : buildExport. Thème persisté en localStorage (next-themes), pas de sync DB."
```
Expected: PR créée. **Ne pas merger** — le mainteneur merge une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- Route `/settings` + sections (apparence/langue/revenus/données) → Task 5 ✅
- Nav Revenus → Réglages → Task 4 ✅
- `ThemeToggle` (next-themes, mounted) → Task 3 ✅
- Langue statique inerte → Task 5 ✅ · lien Revenus → Task 5 ✅
- `buildExport` (Decimal→string) → Task 1 ✅ · `GET /api/export` (Content-Disposition) → Task 2 ✅
- Tests lib/api/composants + maj nav → Tasks 1–4 ✅ · build DB factice → Tasks 1/2/5/6 ✅
- Différé (i18n complet, sync thème DB) → hors plan, conforme ✅

**Scan placeholders :** aucun TBD/TODO ; code complet ; chaque step a commande + résultat attendu.

**Cohérence des types :**
- `ExportData` (`exportedAt: string`, `incomes/expenses/budgets: unknown[]`, `settings: unknown`) défini en Task 1, consommé par le handler (Task 2) et mocké à l'identique dans son test.
- `buildExport` mappe `amount`/`targetAmount` en string (Task 1) ; le test vérifie `"2000"`, `"12.5"`, `"1200"`.
- `ThemeToggle` utilise `Toggle` (`on`/`onChange`/`label`) existant ; le test cible `role="switch"` + `aria-label` cohérents avec l'implémentation du `Toggle`.
- `AppNav` cible `/settings` (Task 4) — page créée en Task 5 ; `/incomes` reste atteignable via le lien de la page (Task 5).
- `<a href="/api/export" download>` (Task 5) pointe vers le handler de la Task 2 ; téléchargement natif, pas de `next/link`.
