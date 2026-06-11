# Vue annuelle du dashboard — design

> Dernier prérequis fonctionnel manquant du cahier des charges : le tableau de bord
> annuel (répartition globale, tendances de consommation, progression de l'épargne).

## Objectif

Ajouter une vue annuelle au dashboard existant (mensuel), accessible via un toggle
`Mois / Année`. Elle couvre les 3 éléments demandés par le cahier des charges :

1. Répartition globale des dépenses sur l'année
2. Tendances de consommation (évolution mois par mois)
3. Progression de l'épargne

Hors scope : bandeau de stats chiffrées, vue patrimoniale, prévisions.

## Accès & navigation

- **Toggle `Mois / Année`** en pills en haut de `/dashboard`, piloté par un searchParam
  `?view=year`. Le rendu reste serveur (`force-dynamic` déjà en place sur la page).
  Absence de `view` ou `view !== "year"` → vue mensuelle (comportement actuel inchangé).
- **Navigation années** : `DashboardYearNav` calqué sur `DashboardMonthNav`
  (flèches `‹ 2026 ›`), année affichée par défaut = année courante, searchParam `?year=YYYY`.
  Pas de limite arbitraire de plage (cohérent avec la nav mensuelle).
- La vue mensuelle conserve son `?month=` ; la vue annuelle utilise `?year=`. Les deux
  paramètres sont indépendants et résolus séparément.

## Couche données — `src/lib/annual.ts`

Nouveau module dédié (garde `dashboard.ts` focalisé sur le mensuel).

Une seule requête par type de donnée, agrégation en mémoire avec `Decimal` (jamais de
flottant) :

```ts
export interface AnnualCategoryTotal {
  category: CategoryKey;
  spent: Prisma.Decimal;
}

export interface AnnualMonthlyPoint {
  month: string;            // "YYYY-MM"
  essential: Prisma.Decimal;
  leisure: Prisma.Decimal;
  savings: Prisma.Decimal;
}

export interface AnnualSavingsPoint {
  month: string;            // "YYYY-MM"
  cumulative: Prisma.Decimal; // cumul des dépenses 'savings' jusqu'à ce mois inclus
}

export interface AnnualSummary {
  year: string;             // "YYYY"
  totals: AnnualCategoryTotal[];        // ordre CATEGORY_ORDER → donut + lignes
  totalSpent: Prisma.Decimal;           // centre du donut
  monthly: AnnualMonthlyPoint[];        // 12 entrées (jan→déc) → tendances
  savingsCumulative: AnnualSavingsPoint[]; // 12 entrées → progression
}

export async function getAnnualSummary(userId: string, year: string): Promise<AnnualSummary>;
```

Implémentation :

- `prisma.expense.findMany({ where: { userId, month: { startsWith: year } } })` —
  les mois sont stockés en `"YYYY-MM"`, donc `startsWith: "2026"` cible l'année entière.
- `monthly` produit **toujours 12 entrées** (`${year}-01` … `${year}-12`), mois sans
  dépense à `0`. Garantit un axe X complet et des courbes continues.
- `savingsCumulative` : cumul croissant des dépenses de catégorie `savings`, une entrée
  par mois (12), pour une courbe de progression monotone.
- Toutes les fonctions scopées par `userId` (multi-tenant), comme le reste de `lib/`.

## Composants

### `CategoryDonut` (généralisation légère, réutilisé)

Ajout de deux props **optionnelles** sans changer le comportement par défaut :

```ts
interface CategoryDonutProps {
  slices: DonutSlice[];
  balance: number;
  centerValue?: number;   // défaut: balance
  centerLabel?: string;   // défaut: t("remaining")
}
```

Vue annuelle : `centerValue = totalSpent`, `centerLabel = t("annualTotalSpent")`.
La couleur du centre reste neutre (`text-text`) quand `centerValue >= 0` (un total annuel
est toujours positif). Comportement mensuel strictement inchangé.

### `MonthlyTrendChart` (nouveau, client)

Recharts, aires empilées des 3 catégories sur 12 mois.

- `ResponsiveContainer`, `AreaChart`, `type="monotone"`.
- Fills `--color-{essential,leisure,savings}-bg`, traits `--color-{...}`.
- Grille supprimée, axe X = mois abrégés selon la locale, axe Y minimal (ou masqué).
- Tooltip léger (fond `--color-surface` + `backdrop-filter: blur(8px)`), montants
  formatés via `formatEUR(locale)`.
- Reçoit `monthly` mappé en `number` (conversion `Number(Decimal)` à la frontière de rendu).

### `SavingsProgressChart` (nouveau, client)

Recharts, courbe cumulée d'épargne versée.

- `AreaChart` mono-série, `type="monotone"`, aire `--color-savings-bg`, trait
  `--color-savings`.
- Croissante = progrès mis en avant ; jamais de rouge même si une seule entrée.
- Mêmes conventions d'axes/tooltip que `MonthlyTrendChart`.

### `DashboardYearNav` (nouveau, client)

Calqué sur `DashboardMonthNav` : flèches précédent/suivant, libellé année, met à jour
`?year=` (+ conserve `?view=year`) via le router.

### Toggle vue (mois/année)

Deux pills (`Link` ou bouton router) `Mois` / `Année` qui posent/retirent `?view=year`.
Conserve le rendu serveur. La pill active porte `--color-accent`.

## Page `/dashboard`

`page.tsx` résout `view` et `year` depuis `searchParams` :

- `view === "year"` → branche annuelle : `getAnnualSummary(userId, year)` →
  `DashboardYearNav` + toggle + donut (centre = total) + `MonthlyTrendChart` +
  `SavingsProgressChart`.
- sinon → branche mensuelle existante, inchangée, avec le toggle ajouté en tête.

La `reconcile(userId, new Date())` reste appelée avant lecture (clôture des mois franchis),
inchangée.

## i18n

Nouvelles clés dans le namespace `dashboard` (`fr.json` + `en.json`) :

- `viewMonth`, `viewYear` — libellés du toggle
- `annualTitle`, `trendTitle`, `savingsTitle` — titres de sections
- `annualTotalSpent` — libellé centre du donut annuel

Les libellés de mois courts de l'axe X ne passent **pas** par i18n : ajout d'un
`formatMonthShort(month, locale)` dans `src/lib/formatters.ts` (`Intl.DateTimeFormat`
avec `{ month: "short" }`), qui localise nativement (« janv. » / « Jan »). Testé dans
`formatters.month.test.ts`.

Le test de parité existant (`src/locales/parity.test.ts`) garantit l'égalité des clés
`fr`/`en` — aucune clé orpheline tolérée.

## Tests

**Unitaire — `src/lib/annual.test.ts` (cœur de la PR) :**

- totaux par catégorie corrects (3 catégories, ordre `CATEGORY_ORDER`)
- `totalSpent` = somme des totaux
- `monthly` : toujours 12 entrées, mois sans dépense à `0`, ventilation par catégorie exacte
- `savingsCumulative` : cumul strictement croissant, valeur finale = total `savings` de l'année
- année vide → 12 entrées à `0`, totaux à `0`
- année partielle (dépenses sur quelques mois seulement) → mois vides à `0`
- isolation : les dépenses d'un autre `userId` n'apparaissent pas

**Composants — `renderWithIntl` (smoke tests) :**

- toggle rend les deux libellés, marque l'actif
- les sections annuelles rendent leurs titres (les internes Recharts ne sont pas testés
  en profondeur)

**Vérification build :** `npm run build` (Vitest ne typecheck pas — `noUncheckedIndexedAccess`).

## Conventions

- Server Components par défaut ; `"use client"` uniquement sur les charts et la nav.
- Montants en `Decimal` jusqu'à la frontière de rendu, `Number()` au dernier moment.
- Aucun texte en dur : tout via i18n.
- DA respectée : couleurs `--color-*`, jamais de rouge, `ResponsiveContainer`,
  `type="monotone"`, grilles supprimées.
- Vérifié mobile + desktop, light + dark.
