# kōza — Notifications in-app — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher des alertes contextuelles in-app sur le dashboard, dérivées en direct (fonction pure, sans état) de la situation budgétaire du mois courant ouvert.

**Architecture:** `deriveNotifications(summary, budgets)` pure → `Notification[]` (objets structurés sans texte). Rendu par `NotificationList` → `SoftBanner` (tons `accent`/`warning`/`over`, jamais de rouge), textes via i18n. Aucune table, aucune migration. Seul le mois courant ouvert alerte.

**Tech Stack:** Next 16 App Router, React 19, next-intl 4, `Prisma.Decimal`, Vitest + Testing Library.

---

## Conventions pour chaque commit

- Branche : **`feat/notifications`** (déjà créée depuis `main`). Jamais de commit sur `main`.
- Conventional Commits, anglais, ≤72 car., scope `notifications` (ou `lib`/`dashboard`/`i18n`).
- Aucun trailer `Co-authored-by`. Merge commit manuel par le mainteneur.
- Avant chaque commit : `npm run format`, `npm run lint` (0 erreur ; warnings RHF pré-existants tolérés), `npm run test` au vert.
- Code touchant les types : `DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build` avant de committer.

## Contexte (types existants)

- `src/lib/dashboard.ts` : `MonthlySummary { month, income, carryIn, base, totalSpent, balance, categories: CategorySpend[], closed }` ; `CategorySpend { category: CategoryKey, spent: Prisma.Decimal, target: Prisma.Decimal }`.
- `src/lib/budgets.ts` : `BudgetWithSpent { id, name, targetAmount: Prisma.Decimal, spent: Prisma.Decimal, category: string, deadline: Date | null }` ; `listBudgetsWithSpent(): Promise<BudgetWithSpent[]>` (dépensé cumulé tous mois).
- `src/components/ui/soft-banner.tsx` : `SoftBanner({ icon, tone, children })`, `tone ∈ {"warning","accent","over"}` (jamais de rouge).
- i18n : `useTranslations`/`useLocale` (next-intl), helper test `renderWithIntl` (`src/test/render-with-intl.tsx`), parité `src/locales/parity.test.ts`, formatters `formatEUR(value, locale)`.

## File Structure

- `src/lib/notifications.ts` (create) + `src/lib/notifications.test.ts` — types + `deriveNotifications` (pur).
- `src/locales/fr.json`, `src/locales/en.json` (modify) — namespace `notifications`.
- `src/components/notifications/notification-list.tsx` (create) + `…notification-list.test.tsx` — rendu en `SoftBanner`.
- `src/app/(main)/dashboard/page.tsx` (modify) — intégration.

---

## Task 1: `deriveNotifications` (fonction pure)

**Files:** Create `src/lib/notifications.ts`, `src/lib/notifications.test.ts`

- [ ] **Step 1: Test qui échoue** — `src/lib/notifications.test.ts` :

```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { deriveNotifications } from "@/lib/notifications";
import type { MonthlySummary } from "@/lib/dashboard";
import type { BudgetWithSpent } from "@/lib/budgets";
import type { CategoryKey } from "@/lib/categories";

const D = (v: string) => new Prisma.Decimal(v);

function summary(categories: { category: CategoryKey; spent: string; target: string }[]): MonthlySummary {
  return {
    month: "2026-06",
    income: D("2500"),
    carryIn: D("0"),
    base: D("2500"),
    totalSpent: D("0"),
    balance: D("0"),
    categories: categories.map((c) => ({ category: c.category, spent: D(c.spent), target: D(c.target) })),
    closed: false,
  };
}

function budget(over: Partial<BudgetWithSpent> & { id: string }): BudgetWithSpent {
  return {
    name: "Budget",
    targetAmount: D("100"),
    spent: D("0"),
    category: "leisure",
    deadline: null,
    ...over,
  };
}

const noCat = summary([]);

describe("deriveNotifications — categories", () => {
  it("flags a category over its 50/30/20 target", () => {
    const out = deriveNotifications(summary([{ category: "leisure", spent: "800", target: "750" }]), []);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "categoryOver", tone: "over", values: { category: "leisure" } });
  });

  it("does not flag a category at or under target, or with target 0", () => {
    expect(deriveNotifications(summary([{ category: "leisure", spent: "750", target: "750" }]), [])).toHaveLength(0);
    expect(deriveNotifications(summary([{ category: "leisure", spent: "10", target: "0" }]), [])).toHaveLength(0);
  });
});

describe("deriveNotifications — spending budgets", () => {
  it("nothing below 80%", () => {
    expect(deriveNotifications(noCat, [budget({ id: "b1", spent: D("79") })])).toHaveLength(0);
  });
  it("warning from 80% to 99%", () => {
    expect(deriveNotifications(noCat, [budget({ id: "b1", spent: D("80") })])[0]).toMatchObject({
      kind: "budgetWarning",
      tone: "warning",
      values: { name: "Budget", percent: 80 },
    });
    expect(deriveNotifications(noCat, [budget({ id: "b1", spent: D("99") })])[0].kind).toBe("budgetWarning");
  });
  it("over at 100%+, never both warning and over", () => {
    const out = deriveNotifications(noCat, [budget({ id: "b1", spent: D("120") })]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "budgetOver", tone: "over", values: { name: "Budget" } });
  });
  it("ignores targetAmount <= 0", () => {
    expect(deriveNotifications(noCat, [budget({ id: "b1", targetAmount: D("0"), spent: D("50") })])).toHaveLength(0);
  });
});

describe("deriveNotifications — savings budgets", () => {
  const sav = (spent: string) => budget({ id: "s1", name: "Fonds", category: "savings", targetAmount: D("1000"), spent: D(spent) });
  it("nothing below 90%", () => {
    expect(deriveNotifications(noCat, [sav("899")])).toHaveLength(0);
  });
  it("savingsGoalNear from 90%, not reached", () => {
    expect(deriveNotifications(noCat, [sav("900")])[0]).toMatchObject({
      kind: "savingsGoalNear",
      tone: "accent",
      values: { name: "Fonds", remaining: "100", reached: false },
    });
  });
  it("reached at 100%+ (never warning/over)", () => {
    const out = deriveNotifications(noCat, [sav("1000")]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "savingsGoalNear", tone: "accent", values: { reached: true } });
  });
});

describe("deriveNotifications — ordering", () => {
  it("sorts savings, then warning, then categoryOver, then over", () => {
    const out = deriveNotifications(
      summary([{ category: "leisure", spent: "800", target: "750" }]),
      [
        budget({ id: "over1", name: "Resto", spent: D("130") }),
        budget({ id: "warn1", name: "Sport", spent: D("85") }),
        budget({ id: "sav1", name: "Fonds", category: "savings", targetAmount: D("1000"), spent: D("950") }),
      ],
    );
    expect(out.map((n) => n.kind)).toEqual(["savingsGoalNear", "budgetWarning", "categoryOver", "budgetOver"]);
  });
});
```

- [ ] **Step 2: Lancer** `npm run test -- src/lib/notifications.test.ts` → FAIL (module introuvable).

- [ ] **Step 3: Implémenter** — `src/lib/notifications.ts` :

```ts
import { Prisma } from "@/generated/prisma/client";
import type { MonthlySummary } from "@/lib/dashboard";
import type { BudgetWithSpent } from "@/lib/budgets";

export type NotificationTone = "accent" | "warning" | "over";
export type NotificationKind = "savingsGoalNear" | "budgetWarning" | "budgetOver" | "categoryOver";

export interface Notification {
  id: string;
  kind: NotificationKind;
  tone: NotificationTone;
  values: Record<string, string | number | boolean>;
}

// Progression mise en avant, dépassements discrets (CLAUDE.md).
const ORDER: NotificationKind[] = ["savingsGoalNear", "budgetWarning", "categoryOver", "budgetOver"];

// Alertes dérivées du mois courant (catégories vs objectifs 50/30/20 + budgets).
export function deriveNotifications(
  summary: MonthlySummary,
  budgets: BudgetWithSpent[],
): Notification[] {
  const out: Notification[] = [];

  for (const cat of summary.categories) {
    if (cat.target.gt(0) && cat.spent.gt(cat.target)) {
      out.push({
        id: `category-${cat.category}`,
        kind: "categoryOver",
        tone: "over",
        values: { category: cat.category },
      });
    }
  }

  for (const b of budgets) {
    if (b.targetAmount.lte(0)) continue;
    const percent = b.spent.div(b.targetAmount).times(100).toNumber();

    if (b.category === "savings") {
      if (percent >= 90) {
        const diff = b.targetAmount.minus(b.spent);
        const remaining = diff.lt(0) ? new Prisma.Decimal(0) : diff;
        out.push({
          id: `budget-${b.id}`,
          kind: "savingsGoalNear",
          tone: "accent",
          values: { name: b.name, remaining: remaining.toString(), reached: percent >= 100 },
        });
      }
    } else if (percent >= 100) {
      out.push({ id: `budget-${b.id}`, kind: "budgetOver", tone: "over", values: { name: b.name } });
    } else if (percent >= 80) {
      out.push({
        id: `budget-${b.id}`,
        kind: "budgetWarning",
        tone: "warning",
        values: { name: b.name, percent: Math.round(percent) },
      });
    }
  }

  return out
    .map((n, i) => ({ n, i }))
    .sort((a, b) => ORDER.indexOf(a.n.kind) - ORDER.indexOf(b.n.kind) || a.i - b.i)
    .map(({ n }) => n);
}
```

- [ ] **Step 4: Lancer** → PASS (toutes les `describe`).

- [ ] **Step 5: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/lib/notifications.ts src/lib/notifications.test.ts
git commit -m "feat(notifications): add deriveNotifications pure logic"
```

---

## Task 2: Catalogue i18n + `NotificationList`

**Files:** Modify `src/locales/fr.json`, `src/locales/en.json` ; Create `src/components/notifications/notification-list.tsx`, `src/components/notifications/notification-list.test.tsx`

- [ ] **Step 1: Ajouter le namespace `notifications`**

`src/locales/fr.json` (au niveau racine) :
```json
  "notifications": {
    "savingsGoalNear": "Plus que {amount} pour {name} — tu y es presque !",
    "savingsGoalReached": "Objectif {name} atteint 🎉",
    "budgetWarning": "Tu approches de ton budget {name} ({percent} %).",
    "budgetOver": "Budget {name} dépassé — ça arrive, le surplus se reporte.",
    "categoryOver": "Tes dépenses {category} dépassent l'objectif du mois."
  },
```
`src/locales/en.json` :
```json
  "notifications": {
    "savingsGoalNear": "Just {amount} left for {name} — you're almost there!",
    "savingsGoalReached": "Goal {name} reached 🎉",
    "budgetWarning": "You're approaching your {name} budget ({percent}%).",
    "budgetOver": "{name} budget exceeded — it happens, the surplus carries over.",
    "categoryOver": "Your {category} spending is over this month's target."
  },
```
> Placer le bloc à la même position relative dans les deux fichiers (l'ordre n'affecte pas la parité).

- [ ] **Step 2: Test du composant qui échoue** — `src/components/notifications/notification-list.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/lib/notifications";

describe("NotificationList", () => {
  it("renders nothing when empty", () => {
    const { container } = renderWithIntl(<NotificationList items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one banner per notification with translated text", () => {
    const items: Notification[] = [
      { id: "budget-b1", kind: "budgetWarning", tone: "warning", values: { name: "Sport", percent: 85 } },
      { id: "category-leisure", kind: "categoryOver", tone: "over", values: { category: "leisure" } },
      { id: "budget-s1", kind: "savingsGoalNear", tone: "accent", values: { name: "Fonds", remaining: "100", reached: false } },
    ];
    renderWithIntl(<NotificationList items={items} />);
    expect(screen.getAllByTestId("soft-banner")).toHaveLength(3);
    expect(screen.getByText(/Sport \(85 %\)/)).toBeInTheDocument();
    expect(screen.getByText(/Loisirs/)).toBeInTheDocument();
    expect(screen.getByText(/Fonds/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Lancer** `npm run test -- src/components/notifications/notification-list.test.tsx` → FAIL.

- [ ] **Step 4: Implémenter** — `src/components/notifications/notification-list.tsx` :

```tsx
"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PiggyBank, TrendingUp, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SoftBanner } from "@/components/ui/soft-banner";
import { formatEUR } from "@/lib/formatters";
import type { Notification } from "@/lib/notifications";

const ICONS: Record<Notification["kind"], LucideIcon> = {
  savingsGoalNear: PiggyBank,
  budgetWarning: TrendingUp,
  budgetOver: Info,
  categoryOver: Info,
};

export function NotificationList({ items }: { items: Notification[] }) {
  const t = useTranslations("notifications");
  const tc = useTranslations("categories");
  const locale = useLocale() as "fr" | "en";

  if (items.length === 0) return null;

  function message(n: Notification): ReactNode {
    switch (n.kind) {
      case "savingsGoalNear":
        return n.values.reached
          ? t("savingsGoalReached", { name: String(n.values.name) })
          : t("savingsGoalNear", {
              name: String(n.values.name),
              amount: formatEUR(String(n.values.remaining), locale),
            });
      case "budgetWarning":
        return t("budgetWarning", { name: String(n.values.name), percent: Number(n.values.percent) });
      case "budgetOver":
        return t("budgetOver", { name: String(n.values.name) });
      case "categoryOver":
        return t("categoryOver", { category: tc(String(n.values.category)) });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((n) => (
        <SoftBanner key={n.id} icon={ICONS[n.kind]} tone={n.tone}>
          {message(n)}
        </SoftBanner>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Lancer** → PASS. Puis `npm run test -- src/locales/parity.test.ts` → PASS (clés fr ≡ en).

- [ ] **Step 6: Build, commit**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run format && npm run lint
git add src/locales src/components/notifications
git commit -m "feat(notifications): add notification list component and i18n"
```

---

## Task 3: Intégration dashboard

**Files:** Modify `src/app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Câbler la page** — modifications :

(a) Ajouter les imports en tête :
```tsx
import { listBudgetsWithSpent } from "@/lib/budgets";
import { deriveNotifications } from "@/lib/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
```

(b) Charger les budgets et dériver les notifications (mois ouvert uniquement). Remplacer le bloc `const [summary, pending] = await Promise.all([...]);` par :
```tsx
  const [summary, pending, budgets] = await Promise.all([
    getMonthlySummary(month),
    prisma.recurringOccurrence.findMany({
      where: { month, status: "PENDING" },
      include: { recurring: true },
    }),
    listBudgetsWithSpent(),
  ]);
  const notifications = summary.closed ? [] : deriveNotifications(summary, budgets);
```

(c) Rendre la liste en haut du `main`, juste après le bandeau « mois clôturé » et avant le bloc revenus/report :
```tsx
      {summary.closed ? <p className="text-[13px] text-muted">{t("closedReadOnly")}</p> : null}

      <NotificationList items={notifications} />

      {income === 0 ? (
```

- [ ] **Step 2: Build (typecheck) + suite complète**
```bash
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
npm run test
```
Expected: build vert (route `/dashboard`), tous tests verts.

- [ ] **Step 3: Commit**
```bash
npm run format && npm run lint
git add "src/app/(main)/dashboard/page.tsx"
git commit -m "feat(dashboard): show in-app notifications"
```

---

## Task 4: Vérification & PR

- [ ] **Step 1: Lint + build + suite complète**
```bash
npm run lint && DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build && npm run test
```
Expected: lint clean (2 warnings RHF tolérés), build OK, tests verts (parité incluse).

- [ ] **Step 2: [optionnel — utilisateur] Vérif manuelle**

`npm run dev`, dashboard : créer/forcer une situation (budget loisirs ≥80%, catégorie au-dessus de son objectif, budget épargne ≥90%) → les bandeaux apparaissent en haut, tons doux, jamais de rouge ; basculer EN → textes traduits ; naviguer sur un mois clôturé → aucune notification. Light + dark, mobile + desktop.

- [ ] **Step 3: Push & PR**
```bash
git push -u origin feat/notifications
gh pr create --base main --head feat/notifications \
  --title "feat(notifications): add in-app contextual notifications" \
  --body "Ajoute les notifications in-app du MVP (feature 7) : alertes dérivées en direct (fonction pure deriveNotifications, sans état, sans table) du mois courant ouvert — budget ≥80% / >100%, catégorie au-dessus de son objectif 50/30/20, objectif d'épargne ≥90%. Rendu en SoftBanner (tons doux, jamais de rouge), textes i18n FR/EN, progression mise en avant. Mois clôturés : pas d'alerte."
```
- [ ] **Step 4:** Ne pas merger — le mainteneur merge une fois la CI verte.

---

## Self-Review

**Couverture du spec :**
- Dérivées sans état, mois ouvert uniquement (§Décision) → Task 1 (`deriveNotifications`) + Task 3 (`summary.closed ? [] : …`) ✅
- 4 déclencheurs + seuils + dédup + exclusion épargne du warning (§Logique) → Task 1 tests + impl ✅
- Tri progression d'abord (§Tri) → `ORDER` + test ordering ✅
- Rendu `SoftBanner` tons doux, jamais de rouge (§UI) → Task 2 (`NotificationList`) ✅
- i18n namespace `notifications` ICU (§i18n) → Task 2 ✅ ; parité fr/en → garde-fou existant ✅
- Intégration dashboard en haut (§UI) → Task 3 ✅
- Tests unitaires + composant + parité (§Tests) → Tasks 1/2 ✅
- Cas limites (clôturé, target 0, pas de budget) (§Cas limites) → tests Task 1 + garde Task 3 ✅
- Hors scope (persistance, dismiss, cloche, push) → non implémentés ✅

**Placeholders :** aucun — tout le code (logique, composant, intégration, tests) est fourni en entier.

**Cohérence des types :**
- `Notification { id, kind, tone, values }` (Task 1) consommé tel quel par `NotificationList` (Task 2) et la page (Task 3).
- `NotificationKind`/`NotificationTone` (Task 1) ⇔ `ICONS` keys + `SoftBanner` tones (Task 2).
- `values: { name, percent, remaining, reached, category }` (Task 1) ⇔ accès `message()` (Task 2) ⇔ placeholders ICU `{name}/{percent}/{amount}/{category}` (Task 2 catalogues).
- `deriveNotifications(summary, budgets)` (Task 1) ⇔ appel page avec `getMonthlySummary` + `listBudgetsWithSpent` (Task 3).

**Dépendance DB :** aucune pour la logique/tests (entrées en mémoire) ni le composant (`renderWithIntl`). La page lit la DB en prod via `listBudgetsWithSpent` (déjà existant). Vérif manuelle (Task 4 Step 2) optionnelle.
