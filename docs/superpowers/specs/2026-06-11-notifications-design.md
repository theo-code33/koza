# kōza — Notifications in-app — Design

> Spec validée le 2026-06-11. Branche : `feat/notifications`. Dernière feature MVP (feature 7).

## Objectif

Afficher des **alertes contextuelles in-app** sur le dashboard, dérivées en direct de la situation budgétaire du mois courant. Ton **informatif et encourageant, jamais culpabilisant**, **jamais de rouge**. Aucune notification push/email (hors scope MVP).

## Décision d'architecture : dérivées, sans état

Les 4 déclencheurs (CLAUDE.md feature 7) se calculent **purement** depuis `getMonthlySummary(month)` + les budgets-avec-dépensé du mois. On implémente une **fonction pure** `deriveNotifications` recalculée à chaque rendu du dashboard. Conséquences : **aucune table, aucune migration, aucun bouton « masquer »**. Une alerte s'affiche tant que sa condition tient et **disparaît d'elle-même** quand la situation rentre dans l'ordre — cohérent avec la posture zen (l'alerte s'efface quand le problème est résolu).

Seul le **mois courant ouvert** alerte. Un mois clôturé (lecture seule) ne génère aucune notification.

## Logique — `src/lib/notifications.ts`

```ts
export type NotificationTone = "accent" | "warning" | "over";
export type NotificationKind =
  | "savingsGoalNear"   // budget épargne ≥ 90 % (≥ 100 % = atteint)
  | "budgetWarning"     // budget non-épargne 80–99 %
  | "budgetOver"        // budget non-épargne ≥ 100 %
  | "categoryOver";     // dépenses catégorie > objectif 50/30/20

export interface Notification {
  id: string;               // stable, ex. `budget-${budgetId}` / `category-${category}`
  kind: NotificationKind;
  tone: NotificationTone;
  values: Record<string, string | number>; // name, percent, amount, category…
}

export function deriveNotifications(
  summary: MonthlySummary,
  budgets: BudgetWithSpent[],
): Notification[];
```

La fonction retourne des objets **structurés sans texte** (le rendu i18n se fait dans le composant). Calculs en `Prisma.Decimal` / ratios exacts.

### Règles de déclenchement

- **`categoryOver`** : pour chaque catégorie de `summary.categories`, si `spent > target` (et `target > 0`) → `over`. `values: { category }`.
- **Budgets** (`budgets`), pourcentage `p = spent / targetAmount * 100` :
  - catégorie **`savings`** : `p ≥ 90` → **`savingsGoalNear`** (`accent`). `values: { name, percent, remaining }` (remaining = max(target − spent, 0)). Les budgets épargne **ne tombent jamais** en warning/over.
  - catégorie **non-savings** : `p ≥ 100` → **`budgetOver`** (`over`) ; sinon `80 ≤ p < 100` → **`budgetWarning`** (`warning`). Dédup : exactement une des deux (jamais les deux pour le même budget).
- `targetAmount ≤ 0` ignoré (pas de division).

### Tri (progression d'abord, dépassements discrets)

Ordre de priorité : `savingsGoalNear` → `budgetWarning` → `categoryOver` → `budgetOver`. Au sein d'un même kind, ordre stable d'entrée. Conforme au principe CLAUDE.md « ce qui est bien géré apparaît en premier, les dépassements sont discrets ».

## UI — `src/components/notifications/notification-list.tsx`

Composant **client** (`"use client"`), props `{ items: Notification[] }`. Mappe chaque `Notification` → `SoftBanner` :

- `tone` → tone du `SoftBanner` (`accent` / `warning` / `over`).
- `kind` → icône lucide (ex. `PiggyBank` savings, `TrendingUp` warning, `Info` over) + clé i18n du message.
- Texte via `useTranslations("notifications")` avec `t(kind, values)` (ICU).
- Si `items` vide → rend `null`.

Intégration dans `src/app/(main)/dashboard/page.tsx` : calculer les budgets-avec-dépensé (`listBudgetsWithSpent`), appeler `deriveNotifications(summary, budgets)`, rendre `<NotificationList items={...} />` **en haut** du `main`, juste sous `DashboardMonthNav` / le bandeau « mois clôturé », au-dessus du donut. Rendu seulement si le mois est ouvert (`!summary.closed`).

> `listBudgetsWithSpent` existe déjà (`src/lib/budgets.ts`) ; côté dashboard on le passe par mois courant. Les `Decimal` sont sérialisés en `string`/`number` dans `values` avant de traverser la frontière serveur→client.

## i18n — namespace `notifications`

`src/locales/{fr,en}.json`, namespace `notifications`, messages ICU encourageants. Exemples FR :

- `savingsGoalNear` : « Plus que {amount} pour {name} — tu y es presque ! » ; `savingsGoalReached` : « Objectif {name} atteint 🎉 »
- `budgetWarning` : « Tu approches de ton budget {name} ({percent} %). »
- `budgetOver` : « Budget {name} dépassé — ça arrive, le surplus se reporte. »
- `categoryOver` : « Tes dépenses {category} dépassent l'objectif du mois. »

> Le `kind` `savingsGoalNear` se rend via `savingsGoalNear` ou `savingsGoalReached` selon `percent ≥ 100`. Les libellés de catégorie (`category`) réutilisent le namespace `categories` existant. Le test de parité fr/en couvre les nouvelles clés.

## Tests

- **Unitaires** (`src/lib/notifications.test.ts`, prisma non requis — entrées en mémoire) :
  - `categoryOver` quand `spent > target`, rien quand `spent ≤ target` ou `target = 0`.
  - budget non-savings : 79 % → rien, 80 % → `budgetWarning`, 99 % → `budgetWarning`, 100 % → `budgetOver`, dédup (jamais les deux).
  - budget savings : 89 % → rien, 90 % → `savingsGoalNear`, 100 %+ → `savingsGoalNear` (atteint) ; jamais de warning/over.
  - `targetAmount = 0` ignoré.
  - tri : savings avant warning avant categoryOver avant over.
  - liste vide quand rien ne déclenche.
- **Composant** (`notification-list.test.tsx`, `renderWithIntl`) : rend un `SoftBanner` par item avec le bon ton ; rend `null` sur liste vide.
- **Parité** des clés `notifications` fr/en (garde-fou existant).

## Cas limites

- Mois clôturé → la page ne calcule/rend pas les notifications.
- Revenu nul / base nulle → `summary.categories` ont `target = 0` → aucun `categoryOver` (garde `target > 0`).
- Aucun budget → seules les alertes catégorie peuvent apparaître.

## Hors scope

- Persistance, statut lu/masqué, bouton « masquer ».
- Cloche / centre de notifications / historique.
- Notifications push, email, navigateur.
- Alertes sur mois passés.

## Convention de commits

Branche `feat/notifications`. Conventional Commits, anglais, scope `notifications` (ou `lib`/`dashboard`/`i18n`). Pas de trailer `Co-authored-by`. Merge commit manuel par le mainteneur. `npm run format` + `lint` + `test` verts + `build` (typecheck) avant chaque commit.
