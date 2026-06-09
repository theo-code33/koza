# kōza — Revenus (CRUD complet) — Design

> Spec validée le 2026-06-10. Étape #4 du build order CLAUDE.md. Complète l'API revenus (GET/PUT/DELETE) et ajoute un écran de gestion `/incomes` pour le mois courant, avec enveloppes 50/30/20 en direct.

## Objectif

Permettre à l'utilisateur de gérer ses revenus du mois courant : lister, ajouter, modifier, supprimer une source de revenu, et voir immédiatement la répartition 50/30/20 recalculée. Réutilise les fondations posées par l'onboarding (`POST /api/incomes`, `lib/validators`, `lib/budget`, `lib/formatters`, `Overlay`).

## Périmètre

**Inclus :**

- API : `GET /api/incomes?month=`, `PUT /api/incomes/[id]`, `DELETE /api/incomes/[id]` (le `POST` existant reste inchangé).
- Logique partagée : `lib/month.ts` (`currentMonth`), `lib/incomes.ts` (`listMonthIncomes`).
- Écran `/incomes` (Server, `force-dynamic`) + composants client (manager, form, row).
- `components/ui/confirm-dialog.tsx` — modale zen de confirmation réutilisable.
- `components/budget/envelopes-summary.tsx` — extraction des cartes d'enveloppes (refactor du confirm onboarding).
- Lien temporaire « Gérer mes revenus » sur le placeholder racine.
- Tests : API, lib, composants.

**Refactors DRY embarqués (zones touchées) :**

- `currentMonth()` extrait vers `lib/month.ts` et réutilisé par `(onboarding)/confirm/page.tsx` et `income-setup-form.tsx`.
- Cartes d'enveloppes extraites vers `EnvelopesSummary`, le confirm onboarding refactoré pour l'utiliser.

**Différé explicitement :**

- E2E Playwright (PR test-infra dédiée).
- Shell `(main)` + navigation réelle (#7 dashboard) — d'où le lien temporaire.
- Navigation entre mois / mois passés (dashboard).
- i18n (FR en dur).

## Décisions actées (brainstorming)

1. **Emplacement** : route `/incomes` autonome, accessible depuis le placeholder racine (lien temporaire).
2. **UX CRUD** : ajout/édition dans l'`Overlay` (sheet mobile / panel desktop) ; suppression via modale zen de confirmation.
3. **Portée** : mois courant uniquement + enveloppes en direct.

---

## 1. API

### `GET /api/incomes?month=YYYY-MM`

Ajout au handler existant. `month` optionnel ; par défaut le mois courant. Renvoie `200` + tableau de revenus (triés par `createdAt`). Délègue à `listMonthIncomes`.

### `PUT /api/incomes/[id]`

- Valide le body avec `incomeCreateSchema` (remplacement complet : `source`, `amount`, `month`). Échec ⇒ `400`.
- `prisma.income.update({ where: { id }, data })`. Record absent (`PrismaClientKnownRequestError` code `P2025`) ⇒ `404`. Succès ⇒ `200` + revenu.

### `DELETE /api/incomes/[id]`

- `prisma.income.delete({ where: { id } })`. Absent (`P2025`) ⇒ `404`. Succès ⇒ `200` + `{ ok: true }`.

> `[id]` vient des params de route Next (`{ params }`). Les handlers ne contiennent que validation + appel Prisma + mapping de statut.

## 2. Logique partagée

### `src/lib/month.ts`

```ts
export function currentMonth(): string; // "YYYY-MM" du mois courant
```

Refactor : `(onboarding)/confirm/page.tsx` et `components/onboarding/income-setup-form.tsx` importent désormais cette fonction au lieu de leur copie locale.

### `src/lib/incomes.ts`

```ts
export function listMonthIncomes(month: string): Promise<Income[]>;
```

`prisma.income.findMany({ where: { month }, orderBy: { createdAt: "asc" } })`. Réutilisé par le `GET` et la page.

## 3. UI

| Fichier | Type | Rôle |
| --- | --- | --- |
| `src/app/incomes/page.tsx` | Server (`force-dynamic`) | Lit `listMonthIncomes(currentMonth())`, calcule total + `computeEnvelopes`, rend `EnvelopesSummary` + `<IncomesManager incomes month />`. |
| `components/incomes/incomes-manager.tsx` | Client | Liste (props serveur), bouton « Ajouter », `Overlay` ajout/édition, `ConfirmDialog` suppression. Après chaque mutation : `router.refresh()`. |
| `components/incomes/income-form.tsx` | Client (RHF + zodResolver) | Champs `source` + `amount` ; `POST` (ajout) ou `PUT /api/incomes/[id]` (édition). `onSuccess` ⇒ le manager ferme l'overlay + `router.refresh()`. |
| `components/incomes/income-row.tsx` | Présentational | Source, montant `formatEUR`, `IconButton` éditer + supprimer. |
| `components/ui/confirm-dialog.tsx` | Client | Modale zen centrée (scrim + carte + Annuler/Confirmer), fermeture scrim/Échap. Ajoutée au barrel `ui`. |
| `components/budget/envelopes-summary.tsx` | Présentational | 3 cartes enveloppes (`CatDot` + label + `formatEUR`) à partir d'un `total`. Refactor : confirm onboarding l'utilise. |

**Données** : la liste est rendue à partir des props serveur (source de vérité unique) ; les mutations passent par l'API puis `router.refresh()` revalide le rendu serveur (liste + enveloppes recalculées). Pas d'état liste local ⇒ pas de désync.

**Navigation temporaire** : `src/app/page.tsx` (placeholder) gagne un `Link` « Gérer mes revenus » → `/incomes`. Retiré quand la nav `(main)` arrivera (#7).

## 4. Cas limites & erreurs

- **Liste vide** : message doux encourageant + bouton d'ajout (pas de tableau vide austère).
- **Mutation en échec** (réseau / 4xx) : message inline ton `warning`/`text-secondary`, **jamais de rouge**, action retentable.
- **Suppression** : toujours via `ConfirmDialog` (jamais de suppression directe ni de `window.confirm`).
- **`[id]` introuvable** : `404` côté API ; le manager affiche un message doux et `router.refresh()` resynchronise.

## 5. Tests

- **API** :
  - `incomes/route.test.ts` — ajout : `GET` renvoie la liste filtrée par mois (prisma mocké).
  - `incomes/[id]/route.test.ts` — `PUT` (200 + args ; 400 invalide ; 404 si `P2025`) ; `DELETE` (200 ; 404 si `P2025`).
- **lib** : `month.test.ts` (format `YYYY-MM`) ; `incomes.test.ts` (`listMonthIncomes` appelle `findMany` avec filtre + tri, prisma mocké).
- **Composants** :
  - `ui/confirm-dialog.test.tsx` — rend le message ; Confirmer/Annuler déclenchent les callbacks ; scrim/Échap ferment.
  - `incomes/income-form.test.tsx` — mode ajout `POST` ; mode édition `PUT` ; validation (montant ≤ 0 rejeté).
  - `incomes/income-row.test.tsx` — affiche source + montant ; boutons éditer/supprimer déclenchent les callbacks.
  - `incomes/incomes-manager.test.tsx` — ouvre l'overlay d'ajout ; flux de suppression appelle `DELETE` puis `router.refresh()`.
- **Page serveur** : non unit-testée (`force-dynamic`, lit la DB) — couverte plus tard par l'E2E.

> `npm run test` reste sans DB (prisma mocké, `fetch`/`next/navigation` mockés). Build CI : la page `/incomes` est `force-dynamic` (cf. mémoire projet — sinon le prérendu casse avec le `DATABASE_URL` factice).

## Critères d'acceptation

- [ ] `/incomes` affiche les revenus du mois courant + enveloppes 50/30/20 ; état vide géré.
- [ ] Ajouter / modifier / supprimer un revenu fonctionne (overlay + modale) et met à jour liste + enveloppes (`router.refresh`).
- [ ] `GET`/`PUT`/`DELETE` renvoient les bons statuts (200/400/404).
- [ ] `npm run lint`, `npm run build` (avec `DATABASE_URL` factice), `npm run test` au vert. Pas de `any`, pas de rouge, montants en `Decimal`/strings, UI mobile + desktop, light + dark.

## Conventions

Branche `feat/incomes-crud`. Conventional Commits (`feat(api)`, `feat(incomes)`, `feat(ui)`, `refactor(...)`, `test(...)`), anglais, impératif, sans trailer d'attribution. Commits atomiques. PR via `gh`, merge manuel par le mainteneur.
