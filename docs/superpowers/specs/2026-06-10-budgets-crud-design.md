# kōza — Budgets (CRUD + progression + boucle dépense→budget) — Design

> Spec validée le 2026-06-10. Étape #6 du build order CLAUDE.md. Ajoute le CRUD des budgets avec barre de progression, et **ferme la boucle** dépense→budget (sélecteur de budget dans le formulaire de dépense).

## Objectif

Permettre à l'utilisateur de gérer des objectifs budgétaires (« Vacances Grèce », « Apport immobilier ») : créer, modifier, supprimer un budget (nom, montant cible, catégorie, échéance optionnelle), suivre sa progression (somme des dépenses rattachées vs cible), et rattacher une dépense à un budget depuis le formulaire de dépense.

## Périmètre

**Inclus :**

- Validators : `budgetCreateSchema` ; extension de `expenseCreateSchema` (`budgetId` optionnel).
- Logique : `lib/budgets.ts` (`listBudgetsWithSpent`).
- API : `GET`/`POST /api/budgets`, `PUT`/`DELETE /api/budgets/[id]`.
- Écran `/budgets` (Server, `force-dynamic`) + composants (manager, card, form).
- Extension du formulaire de dépense : sélecteur de budget optionnel ; `ExpenseRowData` + page `/expenses` propagent `budgetId` et la liste des budgets.
- Lien temporaire « Gérer mes budgets » sur le placeholder racine.
- Tests : lib, API, composants.

**Différé explicitement :**

- Répartition par catégorie vs 50/30/20 → dashboard #7.
- Shell `(main)` + nav réelle (#7), affichage du budget lié sur la ligne de dépense, navigation entre mois, E2E Playwright, i18n.

## Décisions actées (brainstorming)

1. **Boucle dépense→budget incluse** : sélecteur de budget (filtré par catégorie) dans le formulaire de dépense.
2. **Progression** = cumul de **toutes** les dépenses rattachées (tous mois), vs montant cible — cohérent avec des objectifs persistants (`Budget` n'a pas de champ `month`).

---

## 1. Validators

### `budgetCreateSchema`

```ts
budgetCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).refine(> 0),
  category: z.enum(["essential", "leisure", "savings"]),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
```

### Extension de `expenseCreateSchema`

Ajout de `budgetId: z.string().min(1).nullable().optional()`. Les handlers dépense (`POST`/`PUT`) font déjà `const { date, ...rest } = parsed.data` → `budgetId` est inclus dans `rest` et passé à Prisma (null/omis = pas de lien). Aucun autre changement de handler.

> La cohérence catégorie du budget est assurée par l'UX (picker filtré) ; pas de validation serveur supplémentaire (le picker ne propose que des ids valides).

## 2. Logique — `lib/budgets.ts`

```ts
export interface BudgetWithSpent {
  id: string; name: string; targetAmount: Prisma.Decimal;
  spent: Prisma.Decimal; category: string; deadline: Date | null;
}
export function listBudgetsWithSpent(): Promise<BudgetWithSpent[]>;
```

`prisma.budget.findMany({ include: { expenses: { select: { amount: true } } }, orderBy: { createdAt: "asc" } })`, puis `spent = sum(expenses.amount)` (Decimal). Renvoie chaque budget + son `spent`.

## 3. API

- **`GET /api/budgets`** → `listBudgetsWithSpent()` (200 + tableau sérialisé par `NextResponse.json` — Decimal → string).
- **`POST /api/budgets`** → valide `budgetCreateSchema` ; crée avec `deadline: deadline ? new Date(deadline) : null` → 201 ; invalide → 400.
- **`PUT /api/budgets/[id]`** → remplacement via `budgetCreateSchema` → 200 ; `P2025` → 404 ; invalide → 400.
- **`DELETE /api/budgets/[id]`** → 200 `{ ok: true }` ; `P2025` → 404. (Les dépenses liées sont déliées via `onDelete: SetNull`.)
- Routes dépense : acceptent `budgetId` via le schéma étendu, sans autre modification.

## 4. UI Budgets

### `src/app/budgets/page.tsx` (Server, `force-dynamic`)

`listBudgetsWithSpent()` → DTO sérialisables ; rend `<BudgetsManager budgets={rows} />`.

DTO `BudgetCardData` : `{ id, name, targetAmount: string, spent: string, category: CategoryKey, deadline: string | null }` (`deadline = budget.deadline?.toISOString().slice(0,10) ?? null`).

### `components/budgets/budget-card.tsx` (présentational)

`CatDot` + nom ; `formatEUR(spent)` sur `formatEUR(targetAmount)` ; **`ProgressBar`** `value={Number(spent)}` `max={Number(targetAmount)}` `fillClass={CATEGORIES[category].dotClass}` (dépassement → ton `over` doux géré par le composant) ; échéance `formatDate(deadline)` si présente ; `IconButton` éditer (« Modifier le budget ») + supprimer (« Supprimer le budget »).

### `components/budgets/budget-form.tsx` (Client, RHF)

Champs : nom, montant cible, catégorie (`CatSelect` via `Controller`), échéance optionnelle (`input type="date"`, peut être vide → null). `POST` (ajout) / `PUT /api/budgets/[id]` (édition). `onSuccess` ⇒ le manager ferme l'overlay + `router.refresh()`.

### `components/budgets/budgets-manager.tsx` (Client)

Pattern habituel : liste de `BudgetCard` (props serveur), bouton « Ajouter un budget » → `Overlay` (form), édition → `Overlay`, suppression → `ConfirmDialog`, `router.refresh()`, état vide zen.

## 5. Boucle dépense → budget

- **`expenseCreateSchema`** accepte `budgetId` (cf. §1).
- **`ExpenseRowData`** gagne `budgetId: string | null` ; la page `/expenses` le mappe (`expense.budgetId`).
- **Page `/expenses`** charge aussi la liste légère des budgets (`prisma.budget.findMany({ select: { id, name, category } })`) et la passe à `ExpensesManager` → `ExpenseQuickForm`.
- **`ExpenseQuickForm`** : nouveau champ « Budget (optionnel) » — un `<select>` listant « Aucun » + les budgets dont `category === watch("category")`. État `budgetId` (défaut `expense?.budgetId ?? ""`). Au changement de catégorie, si le budget sélectionné ne correspond plus, réinitialiser à `""`. Le payload envoie `budgetId: budgetId || null`.
- **`ExpensesManager`** reçoit `budgets` en prop et le transmet au form.

## 6. Navigation temporaire

`src/app/page.tsx` : `Link` « Gérer mes budgets » → `/budgets`, à côté des liens revenus/dépenses. Retiré avec la nav `(main)` (#7).

## 7. Cas limites & erreurs

- **Liste vide** : message doux + bouton d'ajout.
- **Mutation en échec** : message inline ton `warning`, **jamais de rouge**, retry.
- **Suppression budget** : via `ConfirmDialog` ; les dépenses liées sont déliées (pas supprimées).
- **`[id]` introuvable** : 404 API + message doux UI.
- **Cible ≤ 0** : rejetée par la validation.
- **Dépassement (spent > target)** : `ProgressBar` clampe à 100 % et utilise le ton `over` doux (pas de rouge vif).

## 8. Tests

- **lib** : `budgetCreateSchema` (accept/reject, deadline optionnelle) ; `expenseCreateSchema` (valide avec et sans `budgetId`) ; `listBudgetsWithSpent` (somme des dépenses liées, prisma mocké).
- **API** : `budgets/route.test.ts` (GET liste, POST 201/400) ; `budgets/[id]/route.test.ts` (PUT 200/400/404, DELETE 200/404).
- **Composants** : `budget-card` (nom, montants, progressbar `aria-valuenow/max`, callbacks) ; `budget-form` (add `POST`, edit `PUT`, échéance vide → null) ; `budgets-manager` (ouvre overlay, suppression → `DELETE` + `router.refresh`, état vide) ; `expense-quick-form` (le picker n'affiche que les budgets de la catégorie ; `budgetId` envoyé dans le POST ; reset au changement de catégorie).
- Pages serveur : non unit-testées (`force-dynamic`).

> `npm run test` sans DB (mocks). **Avant de committer du code TS pur-lib, lancer `DATABASE_URL=… npm run build`** (Vitest ne type-checke pas ; `noUncheckedIndexedAccess` n'est attrapé que par `tsc`). Composants client : aucun import **de valeur** depuis `@/generated/prisma`.

## Critères d'acceptation

- [ ] `/budgets` liste les budgets avec progression (cumul des dépenses liées) ; état vide géré.
- [ ] Créer / modifier / supprimer un budget met à jour la liste (`router.refresh`).
- [ ] Depuis `/expenses`, rattacher une dépense à un budget de sa catégorie ; la progression du budget reflète le rattachement.
- [ ] `GET`/`POST`/`PUT`/`DELETE /api/budgets` renvoient 200/201/400/404 ; les routes dépense acceptent `budgetId`.
- [ ] `npm run lint`, `npm run build` (DATABASE_URL factice), `npm run test` au vert. Pas de `any`, pas de rouge vif, montants en `Decimal`/strings, UI mobile + desktop, light + dark.

## Conventions

Branche `feat/budgets-crud`. Conventional Commits (`feat(api)`, `feat(budgets)`, `feat(expenses)`, `test(...)`), anglais, impératif, sans trailer d'attribution. Commits atomiques. PR via `gh`, merge manuel.
