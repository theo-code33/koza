# kōza — Dépenses (CRUD + ajout rapide) — Design

> Spec validée le 2026-06-10. Étape #5 du build order CLAUDE.md. Parallèle structurel aux Revenus, avec un formulaire d'ajout rapide (< 10 s) plus riche : la dépense porte catégorie + sous-catégorie + date.

## Objectif

Permettre à l'utilisateur de suivre ses dépenses du mois courant : lister, ajouter (rapidement), modifier, supprimer. Réutilise les fondations posées (API CRUD, `Overlay`, `ConfirmDialog`, `CatSelect`, taxonomie sous-catégories, `router.refresh()`).

## Périmètre

**Inclus :**

- Validators : `expenseCreateSchema` (avec refine cross-champ catégorie/sous-catégorie).
- Logique : `monthRange` (lib/month), `listMonthExpenses` (lib/expenses), `subcategoryLabel` (lib/subcategories), `formatDate` (lib/formatters).
- API : `GET`/`POST /api/expenses`, `PUT`/`DELETE /api/expenses/[id]`.
- Écran `/expenses` (Server, `force-dynamic`) + composants client (manager, quick-form, row, subcat-chips).
- Lien temporaire « Suivre mes dépenses » sur le placeholder racine.
- Tests : lib, API, composants.

**Différé explicitement :**

- Lien dépense → budget (`budgetId` reste `null`) → feature #6 Budgets.
- Répartition par catégorie vs 50/30/20 → dashboard #7.
- Shell `(main)` + nav réelle (#7), navigation entre mois, E2E Playwright, i18n.

## Décisions actées (brainstorming)

1. **Layout** : liste anti-chronologique à plat + en-tête « total dépensé ce mois ».
2. **Sous-catégorie** : chips qui suivent la catégorie (changer de catégorie réinitialise la sous-catégorie sur la 1re).
3. **Budget** : différé à #6 ; dépenses créées avec `budgetId = null`.

---

## 1. Validators & logique

### `src/lib/validators.ts` — `expenseCreateSchema`

```ts
expenseCreateSchema = z.object({
  amount: string /^\d+(\.\d{1,2})?$/ refine > 0,
  description: string trim 1..120,
  date: string /^\d{4}-\d{2}-\d{2}$/,
  category: z.enum(["essential", "leisure", "savings"]),
  subcategory: string,
}).refine((d) => isValidSubcategory(d.category, d.subcategory))
```

> `isValidSubcategory` importé de `lib/subcategories`. Le refine garantit la cohérence catégorie/sous-catégorie aux frontières API.

### `src/lib/month.ts` — `monthRange`

```ts
export function monthRange(month: string): { start: Date; end: Date };
```

`start` = 1er du mois 00:00 ; `end` = 1er du mois suivant. La dépense filtre par plage de dates (pas de champ `month` sur `Expense`).

### `src/lib/expenses.ts` — `listMonthExpenses`

```ts
export function listMonthExpenses(month: string): Promise<Expense[]>;
```

`prisma.expense.findMany({ where: { date: { gte: start, lt: end } }, orderBy: { date: "desc" } })`.

### `src/lib/subcategories.ts` — `subcategoryLabel`

```ts
export function subcategoryLabel(key: string): string; // label FR, ou la clé en repli
```

### `src/lib/formatters.ts` — `formatDate`

```ts
export function formatDate(date: string | Date, locale?: "fr" | "en"): string; // "10/06/2026" en FR
```

`Intl.DateTimeFormat` (`fr-FR` → JJ/MM/AAAA). Client-safe (formatters n'importe Prisma qu'en `type`).

## 2. API

- **`GET /api/expenses?month=YYYY-MM`** — `listMonthExpenses(month ?? currentMonth())` → 200 + tableau.
- **`POST /api/expenses`** — valide `expenseCreateSchema` ; crée avec `date: new Date(date)` (et `budgetId` non fourni → null) → 201. Invalide → 400.
- **`PUT /api/expenses/[id]`** — remplacement complet via `expenseCreateSchema` (`date: new Date(date)`) → 200 ; `P2025` → 404 ; invalide → 400.
- **`DELETE /api/expenses/[id]`** — → 200 `{ ok: true }` ; `P2025` → 404.

## 3. Ajout rapide — `components/expenses/expense-quick-form.tsx` (Client, RHF)

Optimisé pour < 10 s, monté dans l'`Overlay` (sheet) :

| Champ | UX |
| --- | --- |
| Montant | champ large centré (≈40px), **`autoFocus`** |
| Catégorie | `CatSelect` (3 pills) ; `watch`/`setValue` (champ non natif) |
| Sous-catégorie | `SubcatChips` ; au changement de catégorie, `setValue("subcategory", SUBCATEGORIES[cat][0].key)` |
| Description | champ texte |
| Date | `<input type="date">`, défaut = aujourd'hui (`new Date().toISOString().slice(0,10)`) |

Défauts en mode ajout : `category: "essential"`, `subcategory: "housing"`, `date: aujourd'hui`. En mode édition : préremplie depuis la dépense. Submit `POST` (ajout) ou `PUT /api/expenses/[id]` (édition) ; `onSuccess` ⇒ le manager ferme l'overlay + `router.refresh()`. Erreur ⇒ message doux inline (ton `warning`).

### `components/expenses/subcat-chips.tsx` (Client)

`{ category, value, onChange }` → rangée de chips pour `SUBCATEGORIES[category]` ; la chip active porte les tokens de la catégorie, les autres en `surface-alt`. `aria-pressed` sur chaque chip.

## 4. Écran `/expenses` (Server, `force-dynamic`)

- Lit `listMonthExpenses(currentMonth())`, calcule le **total** (`reduce` sur `Decimal`), mappe vers des DTO sérialisables.
- En-tête : titre + total `formatEUR`.
- `<ExpensesManager expenses={rows} month={month} />`.

DTO `ExpenseRowData` : `{ id, amount: string, description, date: string ("YYYY-MM-DD"), category: CategoryKey, subcategory: string }` (la page fait `amount.toString()` et `date.toISOString().slice(0,10)`).

### `components/expenses/expenses-manager.tsx` (Client)

Pattern identique à `incomes-manager` : liste (props serveur), bouton « Ajouter une dépense » → `Overlay` (quick-form), édition → `Overlay`, suppression → `ConfirmDialog`, `router.refresh()` après mutation. État vide zen.

### `components/expenses/expense-row.tsx` (présentational)

`CatDot(category)` + description + `subcategoryLabel(subcategory)` + `formatEUR(amount)` + `formatDate(date)` ; `IconButton` éditer (« Modifier la dépense ») + supprimer (« Supprimer la dépense », libellé distinct du bouton de la modale).

## 5. Navigation temporaire

`src/app/page.tsx` (placeholder) : ajout d'un `Link` « Suivre mes dépenses » → `/expenses`, à côté de « Gérer mes revenus ». Retiré quand la nav `(main)` arrivera (#7).

## 6. Cas limites & erreurs

- **Liste vide** : message doux encourageant + bouton d'ajout.
- **Mutation en échec** : message inline ton `warning`/`text-secondary`, **jamais de rouge**, retry possible.
- **Suppression** : toujours via `ConfirmDialog`.
- **`[id]` introuvable** : 404 API ; message doux côté UI + `router.refresh()`.

## 7. Tests

- **lib** : `expenseCreateSchema` (accepte valide ; rejette montant ≤ 0, date mal formée, description vide, **sous-catégorie d'une autre catégorie**) ; `monthRange` (bornes) ; `listMonthExpenses` (findMany plage + tri, prisma mocké) ; `subcategoryLabel` ; `formatDate`.
- **API** : `expenses/route.test.ts` (GET liste, POST 201/400) ; `expenses/[id]/route.test.ts` (PUT 200/400/404, DELETE 200/404) — prisma mocké.
- **Composants** : `subcat-chips` (rend les sous-cat de la catégorie, sélection) ; `expense-row` (affichage + callbacks) ; `expense-quick-form` (add `POST`, edit `PUT`, changement de catégorie réinitialise la sous-cat) ; `expenses-manager` (ouvre l'overlay, suppression → `DELETE` + `router.refresh`, état vide).
- Page serveur : non unit-testée (`force-dynamic`) — E2E différé.

> `npm run test` reste sans DB (prisma/`fetch`/`next-navigation` mockés). Build CI vérifié avec `DATABASE_URL` factice ; `/expenses` en `force-dynamic`. Garder les composants client free de tout import de valeur Prisma (cf. mémoire `formatEUR`).

## Critères d'acceptation

- [ ] `/expenses` liste les dépenses du mois (récentes en haut) + total ; état vide géré.
- [ ] Ajout rapide fonctionnel (< 10 s : montant auto-focus, catégorie pills, sous-cat chips, date par défaut aujourd'hui).
- [ ] Modifier / supprimer (modale) met à jour liste + total (`router.refresh`).
- [ ] `GET`/`POST`/`PUT`/`DELETE` renvoient 200/201/400/404 corrects ; sous-catégorie incohérente rejetée.
- [ ] `npm run lint`, `npm run build` (DATABASE_URL factice), `npm run test` au vert. Pas de `any`, pas de rouge, montants en `Decimal`/strings, UI mobile + desktop, light + dark.

## Conventions

Branche `feat/expenses-crud`. Conventional Commits (`feat(api)`, `feat(expenses)`, `feat(ui)`, `test(...)`), anglais, impératif, sans trailer d'attribution. Commits atomiques. PR via `gh`, merge manuel.
