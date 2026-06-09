# kōza — Onboarding (flow 3 étapes) — Design

> Spec validée le 2026-06-09. Étape #3 du build order CLAUDE.md. Premier **slice vertical** complet : UI → Route Handlers → Prisma → DB, avec la première logique 50/30/20 et les premiers validators Zod.

## Objectif

Guider l'utilisateur au premier lancement via un flow en 3 étapes (Bienvenue → Revenus → Confirmation), enregistrer son/ses revenu(s), marquer l'onboarding comme terminé, et ne plus jamais le réafficher. À la sortie, l'utilisateur atterrit sur la racine (placeholder en attendant le dashboard #7).

## Périmètre

**Inclus :**

- Route group `(onboarding)` : `welcome`, `setup`, `confirm` + layout.
- Gate à la racine (`/`) selon `onboardingCompleted`, avec placeholder zen post-onboarding.
- Route Handlers `POST /api/incomes` et `PATCH /api/settings`, validés par Zod.
- Logique : `lib/budget.ts` (`computeEnvelopes`), `lib/formatters.ts` (`formatEUR`), `lib/validators.ts` (schémas Zod), `lib/settings.ts` (helper onboarding).
- Composants onboarding (formulaire revenus RHF, indicateur d'étape, actions de confirmation).
- Tests unitaires (logique), tests de handlers (prisma mocké), test de composant.
- Nouvelles dépendances : `zod`, `react-hook-form`, `@hookform/resolvers`.

**Différé explicitement :**

- Playwright E2E « flow onboarding complet » → PR de test-infra dédiée (séparation propre unit/intégration-DB + 1re spec Playwright). Dette assumée, signalée.
- i18n (textes FR en dur, comme le UI kit ; PR next-intl ultérieure).
- Dashboard réel (#7), reste du CRUD revenus (#4).

## Décisions actées (brainstorming)

1. **Flux d'état** : persistance à l'étape 2 (POST /api/incomes), confirm relit la DB et calcule les enveloppes.
2. **Soumission** : Route Handlers + Zod (pas de Server Actions).
3. **Redirection** : racine = gate + placeholder zen (pas de stub dashboard, pas de 404).
4. **i18n** : FR en dur, i18n différé.

---

## 1. Routing & gate

| Route | Type | Rôle |
| --- | --- | --- |
| `src/app/page.tsx` | Server Component | **Gate** : `getOnboardingCompleted()` → `false` ⇒ `redirect("/welcome")` ; `true` ⇒ placeholder zen (« Tableau de bord à venir »). Remplace le boilerplate. |
| `src/app/(onboarding)/layout.tsx` | Server Component | Conteneur centré zen (`max-w-[720px]`) + garde inverse : si déjà onboardé ⇒ `redirect("/")`. Couvre les 3 écrans. |
| `src/app/(onboarding)/welcome/page.tsx` | Server Component | Étape 1 : pitch 50/30/20 + illustration zen + bouton (Link) → `/setup`. |
| `src/app/(onboarding)/setup/page.tsx` | Server Component | Étape 2 : titre + rend `<IncomeSetupForm />` (Client). Lien « Passer » → `/confirm`. |
| `src/app/(onboarding)/confirm/page.tsx` | Server Component | Étape 3 : lit les revenus du mois courant via Prisma, `computeEnvelopes`, récap + message encourageant + `<ConfirmActions />`. |

**Helper** `src/lib/settings.ts` :

- `getOrCreateDefaultSettings()` — `upsert` de la ligne `id: "default"` (robuste si absente).
- `getOnboardingCompleted(): Promise<boolean>` — lit le flag (false si pas de ligne).

Le mois courant est calculé serveur-side (`YYYY-MM`) ; confirm lit `income.findMany({ where: { month } })`.

## 2. API — Route Handlers + Zod

### `src/lib/validators.ts`

```ts
incomeCreateSchema: { source: string (1..80, trim), amount: number > 0 (ou string décimale), month: /^\d{4}-\d{2}$/ }
settingsUpdateSchema: { onboardingCompleted?: boolean, theme?: "light"|"dark", locale?: "fr"|"en" } (au moins un champ)
```

Les montants transitent en **string décimale** (ex. `"2500.00"`) et sont passés tels quels à Prisma `Decimal`.

### `src/app/api/incomes/route.ts` — `POST`

- Parse + valide le body (`incomeCreateSchema`). Échec ⇒ `400` + `{ error }`.
- Crée l'`Income` (Prisma). Succès ⇒ `201` + l'income créé.

### `src/app/api/settings/route.ts` — `PATCH`

- Parse + valide (`settingsUpdateSchema`). Échec ⇒ `400`.
- `upsert` de la ligne `default` avec les champs fournis. Succès ⇒ `200` + settings.

Validation aux frontières uniquement ; pas de logique métier dans les handlers.

## 3. Logique métier

### `src/lib/budget.ts`

```ts
export interface Envelopes { essential: Decimal; leisure: Decimal; savings: Decimal; }
export function computeEnvelopes(total: Decimal | string | number): Envelopes;
```

- Utilise les parts de `CATEGORIES` (`essential` 0.5, `leisure` 0.3, `savings` 0.2).
- Arithmétique **Decimal** (type `Decimal` réexporté par le client Prisma généré) — jamais de float.
- `total = 0` ⇒ enveloppes à 0. Ex. `2500` ⇒ `1250 / 750 / 500`.

### `src/lib/formatters.ts`

```ts
export function formatEUR(amount: Decimal | string | number, locale?: "fr" | "en"): string;
```

- `Intl.NumberFormat` (`fr-FR` par défaut, devise `EUR`). Ex. `1250` ⇒ `1 250,00 €`.

## 4. Composants

| Fichier | Type | Rôle |
| --- | --- | --- |
| `components/onboarding/income-setup-form.tsx` | Client | Formulaire multi-sources via **React Hook Form + zodResolver** (`useFieldArray` : ajouter/retirer une ligne `source`+`amount`). Submit : `POST /api/incomes` pour chaque ligne valide (month courant), puis `router.push("/confirm")`. Erreur ⇒ message doux inline. |
| `components/onboarding/step-indicator.tsx` | Server/Client | Indicateur zen « n / 3 ». |
| `components/onboarding/confirm-actions.tsx` | Client | Bouton « Terminer » ⇒ `PATCH /api/settings { onboardingCompleted: true }` puis `router.push("/")`. |

Réutilise le UI kit (`Button`, `Field`, `TextInput`, `Card`, `IconButton`). Aucun texte traduit pour l'instant (FR en dur). **Jamais de rouge** : erreurs et états en ton `warning`/secondaire.

## 5. Flux & cas limites

```
/  ──onboardingCompleted?── false ─▶ /welcome ─▶ /setup ─▶ /confirm ─▶ (PATCH settings) ─▶ /
   └─ true ─▶ placeholder
```

- **Skip** (étape 2) : aucun revenu créé ; confirm affiche des enveloppes à 0 € + message doux ; « Terminer » reste possible.
- **Erreur API** (POST/PATCH) : message inline doux, pas de blocage destructif, retry possible.
- **Ligne settings absente** : `getOnboardingCompleted` renvoie `false` ⇒ onboarding affiché.
- **Accès direct à `/welcome` alors que déjà onboardé** : le layout redirige vers `/`.

## 6. Tests

- **Unit (Vitest)** :
  - `lib/budget.test.ts` — `computeEnvelopes` : `2500 ⇒ 1250/750/500`, `0 ⇒ 0/0/0`, somme des enveloppes = total, précision Decimal.
  - `lib/validators.test.ts` — `incomeCreateSchema` (accepte valide ; rejette montant ≤ 0, month mal formé, source vide) ; `settingsUpdateSchema` (accepte flag ; rejette objet vide).
  - `lib/formatters.test.ts` — `formatEUR` en FR (et option EN).
- **Handlers (prisma mocké via `vi.mock("@/lib/prisma")`)** :
  - `api/incomes/route.test.ts` — POST valide ⇒ 201 + `prisma.income.create` appelé avec les bons args ; body invalide ⇒ 400.
  - `api/settings/route.test.ts` — PATCH valide ⇒ 200 + upsert ; invalide ⇒ 400.
- **Composant** : `income-setup-form.test.tsx` — rendu, ajout d'une ligne, submit appelle `fetch` (mocké) puis navigue ; skip ne POST rien.

> `npm run test` reste **sans DB** (prisma mocké dans les handlers), cohérent avec la CI actuelle où `test-unit` n'a pas de Postgres. L'intégration DB réelle viendra avec l'E2E Playwright (PR test-infra).

## Critères d'acceptation

- [ ] Premier lancement (`onboardingCompleted: false`) ⇒ redirige vers `/welcome` ; flow complet jusqu'à `/`.
- [ ] Revenus saisis persistés (`POST /api/incomes`) ; confirm affiche les bonnes enveloppes formatées.
- [ ] « Terminer » passe `onboardingCompleted: true` ; un rechargement de `/` ne réaffiche plus l'onboarding.
- [ ] Skip fonctionne (0 revenu, enveloppes à 0, terminable).
- [ ] `npm run lint`, `npm run build`, `npm run test` au vert. Pas de `any`, pas de rouge, UI vérifiée mobile + desktop, light + dark.

## Conventions

Branche `feat/onboarding`. Conventional Commits (`feat(onboarding)`, `feat(api)`, `feat(db)`, `chore(deps)`, `test(...)`), anglais, impératif, sans trailer d'attribution. Commits atomiques. PR via `gh`, merge manuel par le mainteneur.
