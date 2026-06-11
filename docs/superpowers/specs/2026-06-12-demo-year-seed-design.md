# Seed démo « Cédric » — un an d'activité — design

> Objectif : pré-remplir un compte de présentation avec un historique complet depuis
> janvier 2026 (revenus, dépenses, récurrentes, budgets, report mensuel), **sûr à exécuter
> contre la base de prod** car la prod est la cible de la démo (pas d'environnement dédié).

## Contexte & contrainte de sécurité

Le seed existant (`prisma/seed.ts`) commence par `prisma.user.deleteMany()` — un **wipe
global**. Le lancer contre la prod effacerait tout autre compte. Ce nouveau script ne doit
donc **jamais** faire de suppression globale : il est **additif et scopé à un seul
utilisateur** (Cédric), identifié par email. Idempotent : relançable sans risque.

Cette démarche contourne aussi le bug « récurrente rétroactive non backfillée » : le seed
matérialise les récurrentes mois par mois directement, sans passer par le chemin de
création rétroactif.

## Persona

- **Compte** : `cedric@agricole.com` / `cedricagricole123` (hashé bcrypt).
- `UserSettings` : `locale = "fr"`, `theme = "light"`, `onboardingCompleted = true`.

## Période

De **`2026-01`** au **mois courant** (calculé à l'exécution ; aujourd'hui `2026-06`), soit
~6 mois. Tous les mois sauf le dernier sont **clôturés** (`closedAt` posé, report figé) ;
le mois courant est **ouvert**.

## Architecture (3 unités)

### 1. Builder pur — `src/lib/demo-data.ts`

Fonction pure, sans Prisma client (import **relatif** `../generated/prisma/client` pour
`Prisma.Decimal`, afin de rester résolvable à la fois sous Vitest et sous `tsx`).

```ts
export interface DemoDataset {
  user: { email: string; password: string; locale: string; theme: string };
  budgets: { key: string; name: string; targetAmount: string; category: CategoryKey; deadlineMonth?: string }[];
  recurring: {
    key: string; label: string; type: "FIXED" | "VARIABLE"; amount: string;
    category: CategoryKey; subcategory: string; frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
    anchorMonth: string; endMonth?: string;
  }[];
  // Inclut les dépenses manuelles ET celles issues des récurrentes (recurringKey renseigné).
  expenses: {
    amount: string; description: string; month: string; day: number;
    category: CategoryKey; subcategory: string; budgetKey?: string; recurringKey?: string;
  }[];
  // Une entrée par échéance récurrente matérialisée. Pas d'expenseId ici : la persistance
  // relie l'occurrence à la dépense partageant (recurringKey, month).
  occurrences: { recurringKey: string; month: string; status: "APPLIED" | "CONFIRMED" | "PENDING" }[];
  incomes: { source: string; amount: string; month: string; day: number }[];
  periods: { month: string; carryIn: string; carryOut: string | null; closed: boolean }[];
}

export function buildDemoDataset(currentMonth: string): DemoDataset;
```

Règles internes :

- **Mois** : génère la liste `2026-01 … currentMonth`. Si `currentMonth < 2026-01` (jamais
  en pratique), borne à `2026-01`.
- **Récurrentes matérialisées** : Loyer (FIXED, mensuel, ancré `2026-01`), Assurance
  habitation (FIXED, trimestriel, ancré `2026-01`), Électricité (VARIABLE, mensuel, ancré
  `2026-01`). Pour chaque mois où la cadence se déclenche : génère une **dépense**
  (`recurringKey`) + une **occurrence** `APPLIED` (FIXED) ou `CONFIRMED` (VARIABLE des mois
  passés). Sur le **mois courant**, l'Électricité reste **`PENDING`** (sans dépense) pour
  démontrer le flux « à confirmer ».
- **Dépenses manuelles** déterministes (pas de random → tests stables) : par mois, un
  panier varié (alimentation, transport, restaurants, sorties, sport, culture, santé
  occasionnelle) avec des montants qui **fluctuent** d'un mois à l'autre (relief des
  tendances). Deux dépenses rattachées aux budgets (acompte vacances → « Vacances Grèce » ;
  versement → « Fonds d'urgence »).
- **Épargne** : un versement mensuel régulier (Livret A / ETF en alternance) qui fait
  **monter** la courbe d'épargne cumulée.
- **Revenus** : salaire mensuel `2500.00` sur tous les mois + un extra ponctuel (prime ou
  freelance) sur 1–2 mois.
- **Chaîne de report** (calcul `Decimal`) : `carryIn(premier) = 0` ; pour chaque mois
  `base = revenus(M) + carryIn(M)`, `carryOut(M) = base − dépenses(M)`,
  `carryIn(M+1) = carryOut(M)`. Mois passés : `closed = true`, `carryOut` figé. Mois
  courant : `closed = false`, `carryOut = null`. Les montants sont sérialisés en strings
  `toFixed(2)`.
- Profil calibré pour rester **réaliste et majoritairement dans les cibles 50/30/20** (pas
  de dépassement permanent ; au plus un léger dépassement ponctuel, jamais alarmant).

### 2. Tests du builder — `src/lib/demo-data.test.ts`

Vitest (environnement node), sur la sortie de `buildDemoDataset("2026-06")` :

- **Couverture mensuelle** : `periods` couvre `2026-01 … 2026-06`, un seul mois ouvert (le
  dernier), tous les autres `closed` avec `carryOut` non nul.
- **Cohérence du report** : pour chaque mois, `carryOut == revenus + carryIn − dépenses` ;
  `carryIn(M+1) == carryOut(M)` ; `carryIn(2026-01) == "0.00"`.
- **Récurrente présente partout** : il existe une dépense `recurringKey = "loyer"` pour
  **chaque** mois de la période (le besoin initial de l'utilisateur).
- **Occurrence courante PENDING** : l'Électricité du mois courant est `PENDING` et n'a pas
  de dépense associée ; les mois passés ont une occurrence `CONFIRMED` + dépense.
- **Intégrité des liens** : tout `budgetKey` / `recurringKey` d'une dépense référence une
  entrée existante ; toute occurrence `APPLIED`/`CONFIRMED` a une dépense
  `(recurringKey, month)` correspondante.
- **Montants** : tous parsables en nombre positif, format `^\d+\.\d{2}$`.

### 3. Script de persistance — `prisma/seed-demo-year.ts`

Couche I/O fine. Connexion via `@prisma/adapter-pg` + `DATABASE_URL` (comme `seed.ts`).
Import **relatif** du builder (`../src/lib/demo-data`) et du client
(`../src/generated/prisma/client`) pour rester `tsx`-compatible.

Déroulé :

1. Vérifier `DATABASE_URL` présent ; logger l'hôte **masqué** + l'email cible
   (transparence sur ce qui va être écrit et où).
2. **Upsert** du user par email (`prisma.user.upsert`) → récupère `userId`. Crée/maj
   `UserSettings`.
3. **Suppression scopée** (idempotence) : `deleteMany({ where: { userId } })` sur
   `recurringOccurrence`, `expense`, `income`, `monthlyPeriod`, `recurringExpense`,
   `budget` — **uniquement** ce `userId`. **Jamais** `deleteMany()` global.
4. Insère budgets → map `budgetKey → id`.
5. Insère recurring models → map `recurringKey → id`.
6. Insère incomes.
7. Insère expenses (résout `budgetId`, `recurringId` via les maps) → garde une map
   `(recurringKey, month) → expenseId`.
8. Insère occurrences (résout `recurringId` ; `expenseId` via la map pour
   `APPLIED`/`CONFIRMED`, `null` pour `PENDING`).
9. Insère periods.
10. Log récapitulatif (compteurs scopés au userId).

Garanties : aucune écriture hors du `userId` de Cédric ; relançable ; ne dépend d'aucun
autre script.

### 4. Script npm

```json
"db:seed:demo": "tsx prisma/seed-demo-year.ts"
```

## Exécution contre la prod

- En **local d'abord** contre koza-dev (`DATABASE_URL` dev) pour valider visuellement.
- Puis contre la prod : `DATABASE_URL=<prod> npm run db:seed:demo` (string fournie par le
  mainteneur, jamais commitée). Le schéma prod est déjà migré (CD `migrate deploy`).
- **Pas** de `migrate dev` ni du `db seed` destructif contre la prod — uniquement ce script
  additif scopé.

## Hors scope

- Correction du bug « récurrente rétroactive » (décision produit séparée, non bloquante
  pour la démo).
- Modification du seed dev existant (`prisma/seed.ts` reste inchangé).
- Tests de la couche persistance (I/O fine) ; la correctness est garantie par les tests du
  builder + une exécution dev avant la prod.
