# Design — Logique mensuelle & dépenses récurrentes

> **Statut :** ⚠️ REMPLACÉ par `2026-06-10-monthly-logic-design.md` (version consolidée calée sur le code actuel). Conservé pour historique.
> **Date :** 2026-06-08
> **Périmètre :** cœur métier du suivi mensuel 50/30/20 + dépenses récurrentes
> **Impact périmètre :** les dépenses récurrentes passent de « Hors scope MVP » à **dans le MVP** (le `CLAUDE.md` sera mis à jour en conséquence)

## 1. Vision & cadrage

L'application est un outil de **tracking / suivi de budget**, pas un coach d'épargne. Elle **constate sans juger** : on enregistre où va l'argent dans trois paniers (Essentiels / Loisirs / Épargne), on compare au repère 50/30/20, et on laisse l'utilisateur libre de ses arbitrages.

Conséquence directe : l'Épargne est un panier comme les autres (des allocations qu'on enregistre — virement livret, achat d'ETF…), **pas** un capital à maximiser. Sous-allouer à l'Épargne n'est pas « mal » ; le solde non utilisé roule simplement vers le mois suivant.

## 2. Modèle mensuel (cœur métier)

### 2.1 Définitions

- **Entrées du mois** : tout ce qui rentre — salaire, ventes, allocations, rentes… — **plus le report** (surplus/déficit) du mois précédent. Plusieurs sources de types variés, à des dates variables dans le mois.
- **Base 50/30/20** : `base(M) = Σ entrées(M) + carryIn(M)`. Les repères se calculent sur cette base :
  - Essentiels = 50 % × base
  - Loisirs = 30 % × base
  - Épargne = 20 % × base
- **Dépenses** : ne réduisent **pas** la base. Elles se suivent *contre* les enveloppes. Toutes les dépenses (y compris l'Épargne) sont des sorties enregistrées explicitement.
- **Report (surplus/déficit)** : `carryOut(M) = base(M) − Σ dépenses(M)`. Il n'existe **pas** de compte de report séparé — le report est porté par `carryIn` du mois suivant. Il peut être **négatif** (déficit).

### 2.2 Règles arrêtées

1. **Report global mutualisé.** Un seul report par mois ; les écarts entre catégories se compensent. Les pourcentages par catégorie (« 45 % vs 50 % ») sont des **indicateurs visuels**, pas des comptes de report séparés.
2. **Base = total des entrées du mois + report**, jamais un solde net réduit par les dépenses.
3. **Base vivante.** Le mois en cours est « ouvert » : chaque entrée ajoutée recalcule les repères en temps réel. À la clôture, tout se fige.
4. **Déficit reporté honnêtement.** Un `carryOut` négatif devient le `carryIn` (négatif) du mois suivant. Si `base ≤ 0`, les enveloppes affichent **0 €** + un message doux (« report de −X à absorber ce mois-ci »), **sans rouge**.
5. **Lecture seule stricte.** Un mois clôturé est totalement figé : aucune dépense/entrée ajoutée, modifiée ou supprimée. On ne saisit que dans le mois en cours, et une dépense doit être **datée dans le mois en cours**. Un oubli du mois passé se saisit dans le mois courant.

### 2.3 Exemple

| | Entrées | Base | Repères (E/L/É) | Dépensé | Report |
|---|---|---|---|---|---|
| **Mois 1** | salaire 2 500 + vente 300 = **2 800** | 2 800 | 1 400 / 840 / 560 | 2 200 | **+600** |
| **Mois 2** | salaire 2 500 + report 600 = **3 100** | 3 100 | 1 550 / 930 / 620 | … | … |

## 3. Réconciliation mensuelle (clôture/ouverture)

Pas de cron : **réconciliation paresseuse** au chargement de l'app.

- Fonction `reconcile()` côté serveur, **idempotente** (rejouable sans effet de bord grâce aux contraintes `@@unique` et au test `closedAt`).
- Appelée au chargement du dashboard via une **server action** (pas dans le rendu d'un Server Component).

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
     next = moisSuivant(cursor)
     créer period(next, carryIn = carryOut(cursor))
     materializeRecurring(next)
     cursor = next
  # current est désormais le mois ouvert
```

### 3.2 Garanties

- **Cascade** sur les mois sautés : chaque mois intermédiaire clôturé en chaîne, `carryOut` propagé.
- **Mois sautés** : on ne matérialise **pas** les récurrentes des mois intermédiaires (option (a)) — on n'invente pas de données pour un mois sans activité, évitant des déficits artificiels.
- **Lecture seule** dès `closedAt` posé.
- **Base vivante** : le mois courant n'est jamais figé.

## 4. Dépenses récurrentes

### 4.1 Caractéristiques d'un modèle

- **Type :** `FIXED` (loyer, assurance, abo — montant constant) ou `VARIABLE` (élec, eau — montant qui change).
- **Fréquence :** `MONTHLY` / `QUARTERLY` / `YEARLY`, ancrée sur `anchorMonth` (1ʳᵉ échéance).
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
   return d % periode == 0

si éligible :
   FIXED    → Expense{amount, cat, subcat, date = 1er de M, month = M, recurringId}
              + Occurrence{status = APPLIED, expenseId}
   VARIABLE → Occurrence{status = PENDING, expenseId = null}   # déclenche une notif « à confirmer »
```

Exemples d'ancrage : trimestrielle ancrée `2026-01` → tombe en `01/04/07/10` ; annuelle ancrée `2026-03` → `2026-03`, puis `2027-03`.

### 4.3 Confirmation d'une variable

- L'utilisateur saisit le **vrai montant** → création de l'`Expense`, occurrence `CONFIRMED` (+ `expenseId`).
- Tant que non confirmée, elle **ne compte pas**. Une notification douce le rappelle.
- À la clôture, toute occurrence `PENDING` → `DROPPED` (rien enregistré). Tracking 100 % honnête.

### 4.4 Cycle de vie & éditions

- **Édition d'un modèle** → matérialisations **futures** uniquement. Une dépense déjà créée ce mois-ci est une ligne `Expense` autonome, éditable séparément ; l'édition du modèle ne la réécrit pas.
- **Pause** (`active=false`) → stoppe les futures matérialisations, n'altère pas l'existant.
- **Fin** (`endMonth`) → plus de déclenchement après ce mois.
- **Suppression** du modèle → dépenses passées **conservées** (`recurringId` → `SetNull`), occurrences supprimées en cascade.
- **Suppression d'une matérialisée** (mois courant) → autorisée ; l'occurrence reste enregistrée (empêche la re-création au prochain `reconcile`).

## 5. Modèle de données (Prisma 7 — approche hybride « C »)

Source de vérité = lignes `Income`/`Expense` brutes. `MonthlyPeriod` léger n'ancre que la chaîne de report et l'état ouvert/clôturé. Base et repères 50/30/20 sont **dérivés**, jamais stockés.

```prisma
enum RecurringType    { FIXED VARIABLE }
enum Frequency        { MONTHLY QUARTERLY YEARLY }
enum OccurrenceStatus { APPLIED PENDING CONFIRMED DROPPED }

model Income {
  id        String   @id @default(cuid())
  source    String                       // "Salaire", "Vente", "Allocation"…
  amount    Decimal  @db.Decimal(12, 2)
  date      DateTime                      // date de réception
  month     String                       // "YYYY-MM" — clé de période (dérivée de date)
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
  category    String                        // 'essential' | 'leisure' | 'savings'
  subcategory String
  budgetId    String?
  budget      Budget?           @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  recurringId String?                       // null si saisie manuelle
  recurring   RecurringExpense? @relation(fields: [recurringId], references: [id], onDelete: SetNull)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  @@index([month])
}

model MonthlyPeriod {
  id        String    @id @default(cuid())
  month     String    @unique              // "YYYY-MM"
  carryIn   Decimal   @default(0) @db.Decimal(12, 2)  // = carryOut du mois précédent (figé à l'ouverture)
  carryOut  Decimal?  @db.Decimal(12, 2)   // figé à la clôture ; null tant qu'ouvert (calculé en live)
  closedAt  DateTime?                       // null = ouvert ; sinon lecture seule
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model RecurringExpense {
  id          String                @id @default(cuid())
  label       String
  type        RecurringType                 // FIXED = auto-créée ; VARIABLE = à confirmer
  amount      Decimal               @db.Decimal(12, 2)  // montant fixe, ou estimation pour variable
  category    String
  subcategory String
  frequency   Frequency
  anchorMonth String                        // "YYYY-MM" : 1ʳᵉ échéance, ancre le cycle
  endMonth    String?                       // fin optionnelle
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
  month       String                        // "YYYY-MM" du déclenchement
  status      OccurrenceStatus              // APPLIED | PENDING | CONFIRMED | DROPPED
  expenseId   String?                       // la dépense générée (APPLIED / CONFIRMED)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  @@unique([recurringId, month])            // empêche toute double matérialisation
}

// Budget, UserSettings : inchangés (UserSettings = theme, locale, onboardingCompleted)
```

> ⚠️ Remplace l'ancien `MonthlyBalance` (champs `carryOver`/`*Over`) du `CLAUDE.md`, devenu obsolète.

## 6. Organisation du code

- **`lib/budget.ts`** — fonctions **pures**, en `Decimal`, sans DB : `computeBase`, `computeTargets`, `computeCarryOut`, `isTriggerMonth`, `monthKey`, `nextMonth`, `monthDiff`.
- **`lib/period.ts`** — orchestration serveur de `reconcile()` (Prisma), idempotente.
- **`lib/notifications.ts`** — consomme les sorties de `budget.ts` pour les seuils.
- **`lib/validators.ts`** — schémas Zod.
- **`lib/formatters.ts`** — montants/dates par locale.

**Discipline `Decimal` :** arithmétique toujours en `Decimal` (jamais `+`/`-` sur des `number`). Les Route Handlers sérialisent `Decimal → string` ; `formatters.ts` reformate pour l'affichage (`1 234,56 €` / `€1,234.56`).

## 7. Surface API

- `GET /api/monthly-balance?month=YYYY-MM` → vue dérivée : `base`, `targets`, `spent` par catégorie, `carryIn`, `carryOut`, `closed`, occurrences `PENDING`.
- `POST /api/recurring/occurrences/[id]/confirm` `{ amount }` → confirme une variable.
- **Garde lecture seule** : toute mutation expense/income sur un mois `closedAt != null` → rejetée **409**.
- CRUD des modèles récurrents (`/api/recurring`) — rattaché à la feature Dépenses, mais la matérialisation est définie ici.

## 8. Hook notifications

Ce spec produit les signaux que consomme la feature Notifications (sous-projet séparé) :
- Occurrence `PENDING` → notif « X à confirmer ».
- Seuils 80 % / 100 % d'enveloppe, dépassement catégorie → calculés depuis `spent` vs `targets` dérivés.
- Ton informatif et encourageant, jamais culpabilisant ; jamais de rouge.

## 9. Edge cases couverts

- `base ≤ 0` → repères à 0 € + message doux, jamais de rouge.
- Premier mois → `carryIn = 0`.
- Mois sautés → clôture en cascade, **pas** de récurrentes intermédiaires.
- `reconcile()` idempotent (rejouable sans doublon).
- Report négatif propagé honnêtement.
- Variable non confirmée → `DROPPED` à la clôture.
- Suppression d'un modèle récurrent → dépenses passées conservées.

## 10. Stratégie de tests (cible 80 % sur `lib/`)

**Unitaires (Vitest) — `lib/budget.ts` :**
- base / targets / carryOut avec **précision Decimal**.
- `isTriggerMonth` pour les 3 fréquences × ancrages variés.
- `monthDiff`, `nextMonth`.
- déficit : `base ≤ 0 → targets = 0`.

**Intégration — `reconcile()` :**
- premier lancement ; bascule simple ; **cascade multi-mois**.
- **idempotence** (2 appels → 0 doublon).
- matérialisation FIXED→APPLIED, VARIABLE→PENDING.
- `PENDING → DROPPED` à la clôture.
- **rejet de mutation** sur mois clôturé (409).

**Intégration — récurrentes :**
- exactitude des mois déclencheurs.
- garde `@@unique`.
- cycle de vie : pause / fin / suppression.

## 11. Impacts sur le `CLAUDE.md`

À répercuter lors de la mise à jour du `CLAUDE.md` :
1. Déplacer « Transactions récurrentes / modèles » de **Hors scope MVP** → **MVP** (nouvelle section dédiée).
2. Remplacer le modèle `MonthlyBalance` par `MonthlyPeriod` + `RecurringExpense` + `RecurringOccurrence` + enums.
3. Ajouter les routes `/api/monthly-balance`, `/api/recurring`, `/api/recurring/occurrences/[id]/confirm`.
