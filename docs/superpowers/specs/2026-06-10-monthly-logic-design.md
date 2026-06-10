# kōza — Logique mensuelle & dépenses récurrentes (consolidée) — Design Spec

> **Statut :** validé (brainstorming 2026-06-10). Consolide et **remplace** `2026-06-08-monthly-logic-and-recurring-design.md`, en calant les points d'intégration avec le code actuel (dashboard `getMonthlySummary`, libs `month.ts`, modèle Prisma existant).
> **Périmètre :** cœur report mensuel 50/30/20 **+** dépenses récurrentes, livrés en **une seule PR**.
> **Impact CLAUDE.md :** les dépenses récurrentes passent de « Hors scope MVP » à **MVP** ; `MonthlyBalance` → `MonthlyPeriod`.

## 1. Vision & cadrage

Outil de **tracking**, pas de coaching. On constate sans juger : l'argent va dans trois paniers (Essentiels / Loisirs / Épargne), on compare au repère 50/30/20, l'utilisateur reste libre. L'Épargne est un panier comme les autres (allocations enregistrées), pas un capital à maximiser. Le solde non utilisé **roule** vers le mois suivant.

## 2. Modèle mensuel (cœur métier)

### 2.1 Définitions

- **Entrées du mois** : tout ce qui rentre (salaire, ventes, allocations…) **plus le report** du mois précédent.
- **Base 50/30/20** : `base(M) = Σ entrées(M) + carryIn(M)`. Repères : Essentiels = 50 % × base, Loisirs = 30 % × base, Épargne = 20 % × base.
- **Dépenses** : ne réduisent **pas** la base ; elles se suivent *contre* les enveloppes. Toutes (y compris Épargne) sont des sorties enregistrées.
- **Report (surplus/déficit)** : `carryOut(M) = base(M) − Σ dépenses(M)`. Pas de compte séparé : porté par `carryIn(M+1)`. Peut être **négatif**.

### 2.2 Règles arrêtées

1. **Report global mutualisé.** Un seul report par mois ; les écarts entre catégories se compensent (indicateurs visuels, pas de comptes séparés).
2. **Base = entrées + report**, jamais un net réduit par les dépenses.
3. **Base vivante.** Le mois courant est ouvert : chaque entrée recalcule les repères en live. À la clôture, tout se fige.
4. **Déficit reporté honnêtement.** `carryOut` négatif → `carryIn` négatif du mois suivant. Si `base ≤ 0` : enveloppes à **0 €** + message doux (« report de −X à absorber »), **sans rouge**.
5. **Lecture seule stricte.** Un mois clôturé est figé : aucune mutation. On ne saisit que dans le mois courant ; une dépense doit être datée dans le mois courant. Un oubli passé se saisit dans le mois courant.

### 2.3 Exemple

| | Entrées | Base | Repères (E/L/É) | Dépensé | Report |
|---|---|---|---|---|---|
| **Mois 1** | 2 500 + 300 = **2 800** | 2 800 | 1 400 / 840 / 560 | 2 200 | **+600** |
| **Mois 2** | 2 500 + report 600 = **3 100** | 3 100 | 1 550 / 930 / 620 | … | … |

## 3. Réconciliation mensuelle

Pas de cron : **réconciliation paresseuse**. Fonction `reconcile()` serveur, **idempotente** (contraintes `@@unique` + test `closedAt`). Déclenchée **au chargement du dashboard via une server action** (jamais dans le rendu d'un Server Component) ; un petit client island appelle l'action au montage puis `router.refresh()`.

### 3.1 Algorithme

```
reconcile(today):
  current = "YYYY-MM"(today)
  latest  = dernier MonthlyPeriod

  si latest == null:                       # tout premier lancement
     créer period(current, carryIn = 0)
     materializeRecurring(current)
     return

  cursor = latest.month
  tant que cursor < current:               # ≥ 1 mois franchi
     figer carryOut(cursor) ; closedAt = now()        # → lecture seule
     PENDING(cursor) → DROPPED                          # variables non confirmées abandonnées
     next = nextMonth(cursor)
     créer period(next, carryIn = carryOut(cursor))
     materializeRecurring(next)
     cursor = next
  # current est désormais le mois ouvert
```

### 3.2 Garanties

- **Cascade** sur les mois sautés : chaque mois intermédiaire clôturé en chaîne, `carryOut` propagé.
- **Mois sautés** : on ne matérialise **pas** les récurrentes des mois intermédiaires (on n'invente pas de données pour un mois sans activité).
- **Lecture seule** dès `closedAt` posé. **Base vivante** : le mois courant n'est jamais figé.
- `carryOut(cursor)` au moment du gel = `base(cursor) − Σ dépenses(cursor)`, calculé via les fonctions pures sur les lignes réelles du mois.

## 4. Dépenses récurrentes

### 4.1 Caractéristiques

- **Type :** `FIXED` (montant constant) ou `VARIABLE` (montant qui change).
- **Fréquence :** `MONTHLY` / `QUARTERLY` / `YEARLY`, ancrée sur `anchorMonth`.
- **Cycle de vie :** `active` (pause), `endMonth` (fin optionnelle).

### 4.2 Matérialisation — `materializeRecurring(M)`

```
éligible si :  active == true
            ET anchorMonth ≤ M
            ET (endMonth == null OU M ≤ endMonth)
            ET isTriggerMonth(modèle, M)
            ET aucune RecurringOccurrence (recurringId, M)     # garde anti-doublon

isTriggerMonth(m, M):
   periode = { MONTHLY:1, QUARTERLY:3, YEARLY:12 }[m.frequency]
   d = monthDiff(m.anchorMonth → M)                            # ≥ 0
   return d >= 0 ET d % periode == 0

si éligible :
   FIXED    → Expense{amount, cat, subcat, date = 1er de M, month = M, recurringId}
              + Occurrence{status = APPLIED, expenseId}
   VARIABLE → Occurrence{status = PENDING, expenseId = null}   # « à confirmer »
```

Ancrage : trimestrielle `2026-01` → `01/04/07/10` ; annuelle `2026-03` → `2026-03`, `2027-03`.

### 4.3 Confirmation d'une variable

- L'utilisateur saisit le **vrai montant** → création de l'`Expense`, occurrence `CONFIRMED` (+ `expenseId`).
- Tant que non confirmée, elle **ne compte pas**. Une notification douce le rappelle.
- À la clôture, toute occurrence `PENDING` → `DROPPED`.

### 4.4 Cycle de vie & éditions

- **Édition d'un modèle** → matérialisations **futures** uniquement ; une dépense déjà créée reste une ligne `Expense` autonome.
- **Pause** (`active=false`) → stoppe les futures, n'altère pas l'existant.
- **Fin** (`endMonth`) → plus de déclenchement après ce mois.
- **Suppression** du modèle → dépenses passées **conservées** (`recurringId` → `SetNull`), occurrences supprimées en cascade.
- **Suppression d'une matérialisée** (mois courant) → autorisée ; l'occurrence reste (empêche la re-création au prochain `reconcile`).

## 5. Modèle de données (Prisma 7)

Source de vérité = lignes `Income`/`Expense`. `MonthlyPeriod` n'ancre que la chaîne de report et l'état ouvert/clôturé. Base et repères 50/30/20 sont **dérivés**, jamais stockés.

**Changements vs schéma actuel :**
- `Income` : ajouter `date DateTime` (**backfill** = 1er jour du `month`) et `@@index([month])`.
- `Expense` : ajouter `month String` (**backfill** depuis `date`, format `YYYY-MM`), `recurringId String?` + relation, `@@index([month])`.
- **Supprimer `MonthlyBalance`** (mort) → **`MonthlyPeriod`**.
- Ajouter `RecurringExpense`, `RecurringOccurrence`, enums `RecurringType` / `Frequency` / `OccurrenceStatus`.

```prisma
enum RecurringType    { FIXED VARIABLE }
enum Frequency        { MONTHLY QUARTERLY YEARLY }
enum OccurrenceStatus { APPLIED PENDING CONFIRMED DROPPED }

model Income {
  id        String   @id @default(cuid())
  source    String
  amount    Decimal  @db.Decimal(12, 2)
  date      DateTime
  month     String                       // "YYYY-MM"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([month])
}

model Expense {
  id          String            @id @default(cuid())
  amount      Decimal           @db.Decimal(12, 2)
  description String
  date        DateTime
  month       String                       // "YYYY-MM" — période d'imputation
  category    String
  subcategory String
  budgetId    String?
  budget      Budget?           @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  recurringId String?
  recurring   RecurringExpense? @relation(fields: [recurringId], references: [id], onDelete: SetNull)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  @@index([month])
}

model MonthlyPeriod {
  id        String    @id @default(cuid())
  month     String    @unique              // "YYYY-MM"
  carryIn   Decimal   @default(0) @db.Decimal(12, 2)  // = carryOut du mois précédent (figé à l'ouverture)
  carryOut  Decimal?  @db.Decimal(12, 2)   // figé à la clôture ; null tant qu'ouvert
  closedAt  DateTime?                       // null = ouvert ; sinon lecture seule
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model RecurringExpense {
  id          String                @id @default(cuid())
  label       String
  type        RecurringType
  amount      Decimal               @db.Decimal(12, 2)
  category    String
  subcategory String
  frequency   Frequency
  anchorMonth String                        // "YYYY-MM"
  endMonth    String?
  active      Boolean               @default(true)
  occurrences RecurringOccurrence[]
  expenses    Expense[]
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
}

model RecurringOccurrence {
  id          String           @id @default(cuid())
  recurringId String
  recurring   RecurringExpense @relation(fields: [recurringId], references: [id], onDelete: Cascade)
  month       String
  status      OccurrenceStatus
  expenseId   String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  @@unique([recurringId, month])            // empêche toute double matérialisation
}
```

> **Migration** : une seule migration `prisma migrate dev` qui ajoute les colonnes (avec backfill SQL pour `Income.date` et `Expense.month`), supprime `MonthlyBalance`, crée les nouveaux modèles/enums. **Le seed (`prisma/seed.ts`) est mis à jour** pour produire `Income.date`, `Expense.month`, des `MonthlyPeriod` clôturés cohérents (reports légers) et 2-3 modèles récurrents de démo.
>
> **Renseignement à la création (formulaires inchangés) :**
> - `Income.date` : le formulaire revenus ne capture pas de date → à la création, `date = 1er jour du mois sélectionné` (`new Date(year, m-1, 1)`). Le validator `incomeCreateSchema` est inchangé (toujours `month` "YYYY-MM").
> - `Expense.month` : le formulaire dépense capture déjà une `date` → à la création/édition, `month = date.slice(0,7)` ("YYYY-MM"). Dérivé côté handler, pas de nouveau champ de formulaire.

## 6. Organisation du code

- **`lib/month.ts`** (existant) — `currentMonth`, `previousMonth`, `nextMonth`, `monthRange`, `formatMonth` (dans formatters). On y **ajoute** `monthDiff(a, b)` (nombre de mois de `a` à `b`). Pas de duplication ailleurs.
- **`lib/budget.ts`** — fonctions **pures** Decimal, sans DB : on conserve `computeEnvelopes` (50/30/20 d'un total) et on ajoute `computeBase(entries, carryIn)`, `computeTargets(base)` (= enveloppes, avec `base ≤ 0 → 0`), `computeCarryOut(base, spent)`, `isTriggerMonth(recurring, month)`.
- **`lib/period.ts`** — orchestration serveur `reconcile()` (Prisma), idempotente.
- **`lib/recurring.ts`** — `materializeRecurring(month)` + helpers de matérialisation.
- **`lib/dashboard.ts`** (existant) — `getMonthlySummary` mis à jour : lit le `MonthlyPeriod` du mois, calcule `base = income + carryIn`, `targets = computeTargets(base)`, expose `carryIn`, `carryOut` (live = `base − totalSpent`), `closed`.
- **`lib/validators.ts`** — schémas Zod récurrents + confirmation.

**Discipline `Decimal` :** arithmétique toujours en `Decimal`. Les Route Handlers sérialisent `Decimal → string` ; `formatters.ts` reformate à l'affichage.

## 7. Surface API

- **Mise à jour `getMonthlySummary`** (lib, consommée par `/dashboard`) — pas de nouvelle route nécessaire pour la vue mensuelle (le dashboard lit le lib directement).
- **Server action `reconcileAction()`** — appelée au montage du dashboard.
- **CRUD récurrents** `/api/recurring` (`GET`/`POST`), `/api/recurring/[id]` (`PUT`/`DELETE`).
- **Confirmation** `POST /api/recurring/occurrences/[id]/confirm` `{ amount }` → crée l'Expense + occurrence `CONFIRMED`.
- **Garde lecture seule** : toute mutation `expense`/`income` (POST/PUT/DELETE) visant un mois `closedAt != null` → **409**. Implémentée via un helper `assertMonthOpen(month)` partagé.

## 8. UI

- **Dashboard** : carte/ligne « report du mois dernier : +X / −X » (ton doux) ; les objectifs reflètent la base ; bandeau **lecture seule** sur un mois clôturé (navigation `?month=` vers le passé). `base ≤ 0` → enveloppes à 0 € + message doux.
- **Dépenses** : sur un mois clôturé, masquer/désactiver ajout/édition/suppression. Liste des **récurrentes à confirmer** (occurrences `PENDING`) avec un formulaire de confirmation (montant réel).
- **Récurrentes** : écran de gestion des modèles (CRUD) — type, montant, catégorie/sous-catégorie, fréquence, ancrage, fin, pause.

## 9. Hook notifications (signaux produits, feature Notifications séparée)

- Occurrence `PENDING` → « X à confirmer ».
- Seuils 80 % / 100 % d'enveloppe, dépassement catégorie → depuis `spent` vs `targets` dérivés.
- Ton informatif et encourageant, jamais de rouge.

## 10. Edge cases couverts

- `base ≤ 0` → repères à 0 € + message doux.
- Premier mois → `carryIn = 0`.
- Mois sautés → clôture en cascade, **pas** de récurrentes intermédiaires.
- `reconcile()` idempotent (rejouable sans doublon).
- Report négatif propagé honnêtement.
- Variable non confirmée → `DROPPED` à la clôture.
- Suppression d'un modèle récurrent → dépenses passées conservées.
- Mutation sur mois clôturé → 409.

## 11. Stratégie de tests (cible 80 % sur `lib/`)

**Unitaires (Vitest) — `lib/budget.ts`, `lib/month.ts` :**
- `computeBase`, `computeTargets`, `computeCarryOut` avec **précision Decimal**.
- `computeTargets(base ≤ 0) → 0`.
- `isTriggerMonth` pour les 3 fréquences × ancrages variés.
- `monthDiff`.

**Intégration (prisma mocké ou base de test) — `reconcile()` :**
- premier lancement ; bascule simple ; **cascade multi-mois**.
- **idempotence** (2 appels → 0 doublon).
- matérialisation FIXED→APPLIED, VARIABLE→PENDING.
- `PENDING → DROPPED` à la clôture.

**Intégration — récurrentes & API :**
- exactitude des mois déclencheurs ; garde `@@unique`.
- cycle de vie : pause / fin / suppression.
- confirmation d'une variable → Expense + `CONFIRMED`.
- **rejet de mutation** sur mois clôturé (409).

**Dashboard :** `getMonthlySummary` avec `carryIn` (base = income + carryIn ; targets dérivés ; closed).

## 12. Impacts CLAUDE.md (à répercuter)

1. « Transactions récurrentes / modèles » : Hors scope MVP → **MVP**.
2. `MonthlyBalance` → `MonthlyPeriod` + `RecurringExpense` + `RecurringOccurrence` + enums.
3. Routes `/api/recurring`, `/api/recurring/occurrences/[id]/confirm` ; server action `reconcileAction`.
4. `Income.date`, `Expense.month`/`recurringId` ajoutés.

## 13. Hors périmètre

- Notifications in-app (sous-projet séparé ; cette spec produit les signaux).
- Vue annuelle du dashboard.
- i18n complet (cycle dédié).
