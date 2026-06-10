# kōza — Dashboard mensuel + navigation — Design Spec

> Itération 1 du dashboard : vue mensuelle soignée + vraie barre de navigation. La vue annuelle, le report de surplus/déficit, la comparaison par catégorie et la page Réglages sont des itérations suivantes.

## Objectif

Livrer un écran `/dashboard` mensuel impressionnant pour la démo de vendredi : revenus du mois, répartition des dépenses par catégorie (donut), dépenses vs objectifs 50/30/20, delta discret vs mois précédent, et navigation entre les mois. Au passage, remplacer les liens temporaires de la racine par une vraie coquille de navigation (bottom nav mobile / sidebar desktop) partagée par toutes les pages de l'app.

## Décisions cadrées (brainstorm)

- **Périmètre** : vue mensuelle + navigation réelle. Vue annuelle différée.
- **Navigation** : 4 icônes — Dashboard · Dépenses · Budgets · Revenus (Réglages plus tard remplacera/complétera Revenus).
- **Objectifs 50/30/20** : `computeEnvelopes(revenus du mois)`, **sans report** de surplus/déficit (le carry-over `MonthlyBalance` est la feature suivante).
- **Donut** : 3 arcs = dépenses réelles par catégorie (couleurs `--color-*`), centre vide affichant le **solde restant** (revenus − total dépensé). Les objectifs 50/30/20 sont exprimés par les cartes catégories, pas par le donut.
- **Comparaison mois précédent** : un seul **delta global discret** (total dépensé ce mois vs mois précédent), ton doux, jamais rouge.
- **Navigation entre mois** : via un **searchParam `?month=YYYY-MM`** lu côté serveur ; défaut = mois courant.

## Architecture

### Route group `(main)` + layout partagé

Les pages de l'app passent sous un route group `(main)` qui porte la coquille de navigation et le gate d'onboarding. Les route groups sont invisibles dans l'URL : `/budgets`, `/expenses`, `/incomes`, `/dashboard` restent inchangés.

```text
src/app/
  page.tsx                       # redirect("/dashboard")
  (main)/
    layout.tsx                   # Server : gate onboarding + <AppNav> + <main>
    dashboard/page.tsx           # NOUVEAU — vue mensuelle (force-dynamic)
    expenses/page.tsx            # déplacé depuis src/app/expenses/
    budgets/page.tsx             # déplacé depuis src/app/budgets/
    incomes/page.tsx             # déplacé depuis src/app/incomes/
```

- **`(main)/layout.tsx`** (Server Component) :
  - Gate onboarding : `if (!(await getOnboardingCompleted())) redirect("/welcome");` — protège désormais **toutes** les pages de l'app (aujourd'hui seule `/` est gardée ; trou comblé).
  - Rend `<AppNav />` + le `children` dans la colonne de contenu plafonnée à `max-w-[720px]`.
- **`src/app/page.tsx`** : devient `redirect("/dashboard")`. Le gate vit désormais dans le layout `(main)`.
- Les pages onboarding (`(onboarding)/…`) et `(dev)/kit` restent hors `(main)` (pas de nav, pas de gate).

> Le layout `(main)` ne lit pas de données lourdes ; il fait juste le gate et la structure. Chaque page reste responsable de son propre fetch.

### Navigation entre mois

`/dashboard` lit `searchParams.month`. Si absent ou invalide → `currentMonth()`. Le composant `ui/month-nav` existant est **callback-based** (`onPrev`/`onNext`, présentational) ; on l'enveloppe dans un fin wrapper client `components/dashboard/dashboard-month-nav.tsx` (`"use client"`) qui calcule mois précédent/suivant (`previousMonth`/`nextMonth`) et navigue via `useRouter().push("/dashboard?month=…")`. Le mois suivant le mois courant est désactivé (`canNext = false`, pas de futur).

## Composants

### `components/nav/app-nav.tsx` (Client)

Coquille de navigation responsive, **`"use client"`** (utilise `usePathname`).

- **Mobile/tablette (`< lg`)** : bottom nav fixe, `lg:hidden`, icônes seules centrées.
- **Desktop (`≥ lg`)** : sidebar gauche minimaliste, `hidden lg:flex`, icônes seules, vit **hors** de la colonne de contenu (qui reste plafonnée à 720px).
- 4 entrées, chacune `{ href, icon, label }` :
  - Dashboard → `/dashboard` (ex. `LayoutDashboard`)
  - Dépenses → `/expenses` (ex. `Receipt`)
  - Budgets → `/budgets` (ex. `Target`)
  - Revenus → `/incomes` (ex. `Wallet`)
- État actif déterminé par `usePathname` (préfixe du segment) : icône en `--color-accent`, label visible uniquement sur l'entrée active. Inactif en `--color-text-secondary`.
- `aria-current="page"` sur l'entrée active ; chaque lien a un `aria-label` (le label texte).

### `components/charts/category-donut.tsx` (Client)

Donut Recharts (`"use client"`).

- 3 segments = dépenses réelles par catégorie (`essential`/`leisure`/`savings`), couleurs `--color-essential|leisure|savings`.
- `stroke-width` 8, pas de grille, centre vide.
- **Centre** : solde restant (`revenus − total dépensé`) formaté EUR + un petit label « restant ». Si solde négatif, teinte `--color-over`, jamais rouge vif.
- `ResponsiveContainer` (jamais de largeur figée en px).
- **Cas vide** (aucune dépense) : afficher un anneau neutre (`--color-surface-alt`) + centre = revenus, sans planter.
- Props : `{ slices: { category: CategoryKey; amount: number }[]; balance: number }`. La logique de construction des slices vit dans la page / le lib, le composant ne fait que le rendu.

### `components/dashboard/category-progress-card.tsx`

Carte par catégorie (×3) : nom de catégorie + `CatDot`, **dépensé / objectif**, `ProgressBar` (couleur de la catégorie), montant en `font-weight: 300`. Dépassement (`dépensé > objectif`) exprimé en teinte douce `--color-over` sur le texte du ratio, jamais rouge vif, jamais de barre rouge. Props sérialisables (strings).

### `components/dashboard/dashboard-month-nav.tsx` (Client)

Fin wrapper (`"use client"`) autour du `ui/month-nav` présentational. Reçoit `month` (string `YYYY-MM`), calcule `previousMonth(month)` / `nextMonth(month)`, désactive `canNext` quand `month >= currentMonth()`, et navigue via `useRouter().push("/dashboard?month=…")`. Le titre affiché est le mois formaté (locale FR). Réutilise `MonthNav` pour le rendu (chevrons + titre).

### `components/dashboard/prev-month-delta.tsx`

Ligne unique et discrète : compare le total dépensé du mois au mois précédent.
- Moins dépensé → « X € de moins que le mois dernier » (ton positif, `--color-text-secondary`).
- Plus dépensé → « X € de plus que le mois dernier » (`--color-text-secondary`, sans alarme).
- Pas de mois précédent / total identique → ligne neutre ou masquée.
Props : `{ current: string; previous: string }` (montants EUR en string).

## Logique

### `lib/dashboard.ts`

```ts
export interface CategorySpend {
  category: CategoryKey;
  spent: Prisma.Decimal;
  target: Prisma.Decimal;
}

export interface MonthlySummary {
  month: string;
  income: Prisma.Decimal;          // total revenus du mois
  totalSpent: Prisma.Decimal;      // total dépenses du mois
  balance: Prisma.Decimal;         // income - totalSpent
  categories: CategorySpend[];     // essential / leisure / savings (ordre CATEGORY_ORDER)
  previousTotalSpent: Prisma.Decimal; // total dépenses du mois précédent (pour le delta)
}

export async function getMonthlySummary(month: string): Promise<MonthlySummary>;
```

- `Promise.all` : `listMonthIncomes(month)`, `listMonthExpenses(month)`, `listMonthExpenses(previousMonth(month))`.
- `income` = somme des revenus du mois (Decimal).
- `target` par catégorie = `computeEnvelopes(income)[category]`.
- `spent` par catégorie = somme des dépenses du mois filtrées par `category`.
- `balance` = `income − totalSpent`.
- `previousTotalSpent` = somme des dépenses du mois précédent.
- Tout en `Decimal`, jamais d'arithmétique flottante.
- Testable avec `@/lib/prisma` mocké (ou en mockant `listMonthIncomes`/`listMonthExpenses`).

### `lib/month.ts`

Ajout `previousMonth(month: string): string` et `nextMonth(month: string): string` — décrémentent/incrémentent `YYYY-MM` d'un mois (gèrent le passage d'année). Testés (déc → janv, janv → déc année précédente, milieu d'année).

## Flux de données

```
/dashboard?month=YYYY-MM (Server, force-dynamic)
  → month = parse(searchParams.month) ?? currentMonth()
  → summary = await getMonthlySummary(month)
  → DTO strings (Decimal.toString) :
      income, totalSpent, balance, categories[{category, spent, target}], previousTotalSpent
  → rend :
      <DashboardMonthNav month=… />      (wrapper client → router.push ?month=)
      <PrevMonthDelta current previous /> (si applicable)
      <CategoryDonut slices balance />
      <CategoryProgressCard /> ×3
      banner revenus=0 → /incomes        (si income === 0)
```

## Dépendance

Ajout **`recharts@^3`** dans `dependencies` (absent aujourd'hui). Compatible React 19 nativement (pas de hack `react-is`).

## Tests

- **`lib/dashboard.test.ts`** (prisma/libs mockés) : agrégat par catégorie, calcul des objectifs via `computeEnvelopes`, `balance`, `previousTotalSpent`, et le cas **revenus = 0** (objectifs à 0, pas de division).
- **`lib/month.adjacent.test.ts`** : `previousMonth` et `nextMonth` (passage d'année dans les deux sens, milieu d'année).
- **`components/nav/app-nav.test.tsx`** : 4 liens présents, état actif correct selon `usePathname` (mock `next/navigation`), `aria-current` sur l'actif.
- **`components/dashboard/dashboard-month-nav.test.tsx`** : clic précédent/suivant appelle `router.push` avec le bon `?month=` (mock `next/navigation`) ; `canNext` désactivé sur le mois courant.
- **`components/dashboard/category-progress-card.test.tsx`** : affiche dépensé/objectif, barre présente, dépassement en teinte douce (pas de classe rouge).
- **`components/dashboard/prev-month-delta.test.tsx`** : libellés « de moins » / « de plus » selon les montants.
- **`components/charts/category-donut.test.tsx`** : **smoke test** (le composant rend sans planter, le solde au centre est affiché). On ne teste pas le SVG Recharts en détail (ResponsiveContainer rend à 0×0 en jsdom) ; la logique des slices est couverte côté `lib`/page.
- **Build** : `DATABASE_URL` factice + `npm run build` pour le typecheck (Vitest ne typecheck pas — cf. `noUncheckedIndexedAccess`).

## Direction artistique

Conforme au handoff (`docs/design/handoff/`) et au CLAUDE.md : colonne `max-w-[720px]` centrée, paddings 24/32px, gouttières 40–64px, donut centre vide + solde, barres 4px jamais rouges, animations douces (barres 600ms à l'entrée), tooltips légers `--color-surface` + `backdrop-filter: blur(8px)`. Light + dark, mobile + desktop vérifiés.

## i18n

Strings en français codé en dur, **cohérent avec l'existant** (incomes/expenses/budgets) — le câblage next-intl n'est pas encore fait à l'échelle de l'app et reste une dette globale traitée dans une itération dédiée.

## Hors périmètre (itérations suivantes)

- Vue annuelle (répartition globale, tendances, progression épargne).
- Report de surplus/déficit (`MonthlyBalance`, carry-over) — modifie le calcul des objectifs.
- Comparaison par catégorie (delta sur chaque carte).
- Page Réglages (`/settings`) + déplacement des Revenus dans Réglages.
- Câblage next-intl.
- Notifications in-app (seuils 80 %/100 %, etc.).
