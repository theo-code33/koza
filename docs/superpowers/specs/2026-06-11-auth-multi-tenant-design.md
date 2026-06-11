# kōza — Authentification & multi-tenant — Design

> Spec validée le 2026-06-11. Projet **large**, découpé en 3 sous-projets livrables indépendamment (voir §Découpage). Chaque sous-projet a son propre plan + PR.

## Contexte & motivation

kōza est aujourd'hui **mono-utilisateur, sans authentification** : aucune table `User`, aucun `userId`, une seule ligne `UserSettings("default")`, et **un jeu de données global** partagé par tous les visiteurs de l'app déployée. Objectif : de **vrais comptes** avec données **cloisonnées par utilisateur**. C'était explicitement hors scope MVP ; on l'ajoute après la livraison MVP, à proximité de la deadline (vendredi 13 juin) — d'où un **découpage prudent**.

## Décisions validées

- **Authentification réelle** (login), self-hostée.
- **Auth.js v5** (`next-auth@5`) + provider **Credentials** (email + mot de passe), stratégie de session **JWT** (pas besoin des tables Account/Session de l'adapter, qui servent à l'OAuth/sessions-DB).
- Hash des mots de passe avec **bcrypt** (`bcryptjs`, pur JS, pas de binaire natif).
- Données **cloisonnées par `userId`** (FK vers un modèle `User` local).

## Modèle de données cible

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  settings     UserSettings?
  // relations inverses vers Income/Expense/Budget/MonthlyPeriod/RecurringExpense
}

model UserSettings {
  userId              String  @id            // 1:1 avec User
  user                User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  theme               String  @default("light")
  locale              String  @default("fr")
  onboardingCompleted Boolean @default(false)
}
```

- Ajouter `userId String` + relation `@relation(onDelete: Cascade)` sur : **`Income`, `Expense`, `Budget`, `MonthlyPeriod`, `RecurringExpense`, `RecurringOccurrence`**.
- `MonthlyPeriod.month @unique` → **`@@unique([userId, month])`** (un cycle mensuel par utilisateur).
- `RecurringOccurrence` garde `@@unique([recurringId, month])` (déjà scopé via son `RecurringExpense`).
- `UserSettings` perd son `id="default"`, devient 1:1 avec `User`.
- **Migration** : la prod est quasi vide et les anciennes lignes n'ont pas de propriétaire ⇒ migration **repart propre** (suppression des données de démo existantes), pas de backfill d'un `userId` fictif. Le seed recrée tout sous un utilisateur démo.

## Scoping (threading du `userId`)

Toutes les fonctions data de `lib/` gagnent un **paramètre `userId`** et filtrent dessus : `getMonthlySummary`, `listBudgetsWithSpent`, `listMonthIncomes`, `listMonthExpenses`, `reconcile`, `materializeRecurring`, `isMonthOpen`/`assertMonthOpen`, `getOrCreateDefaultSettings`/`getOnboardingCompleted`, `exportData`. Les **12 routes API**, **pages serveur** et **server actions** récupèrent le `userId` via `auth()` → **401** (API) / **redirect `/login`** (pages) si absent, puis le passent en bas. ~21 fichiers + leurs tests.

## Auth.js & protection

- `src/auth.ts` : `NextAuth({ providers: [Credentials(...)], session: { strategy: "jwt" }, callbacks })` ; le callback `authorize` vérifie email + `bcrypt.compare`. JWT/`session` portent `user.id`. Handlers exposés via `src/app/api/auth/[...nextauth]/route.ts`.
- `middleware.ts` (Auth.js) protège `(main)`, `(onboarding)`, `/api/*`. **Publics** : `/` (landing), `/login`, `/signup`, `/privacy`, `/terms`, `/api/health`, `/api/auth/*`.
- Inscription : page `/signup` + server action (Zod valide email/mot de passe, `bcrypt.hash`, crée `User` + `UserSettings`).

## UI & per-user

- Pages `/login` et `/signup` (RHF + Zod, i18n, DA zen existante).
- Onboarding & settings deviennent **par utilisateur** : le gating `onboardingCompleted` lit la `UserSettings` du user courant. `resolveLocale` : cookie → settings du user connecté → `fr`.
- **Déconnexion** depuis les Réglages.

## Tests

- Tous les tests `lib/`/routes adaptés (paramètre `userId` / mock de session `auth()`).
- Nouveaux : signup (hash, email unique), login (`authorize` ok/ko), **isolation** (un user ne lit jamais la data d'un autre).

---

## Découpage en 3 sous-projets

> Chacun mergeable seul. On s'arrête à un palier stable si la deadline approche (au pire : #1 seul, démo mono-utilisateur sauvée).

### Sous-projet #1 — Script de reset démo (indépendant, **livré en premier**)

But : un filet pour la démo, **sur le modèle mono-utilisateur actuel** (avant tout changement de schéma). Aucune dépendance à l'auth.

- Script `prisma/reset.ts` + npm script **`db:reset`** : vide les tables de données (occurrences → récurrentes → dépenses → budgets → revenus → périodes → UserSettings) **dans l'ordre des dépendances**, puis ré-exécute la logique du seed.
- Option d'**onboarding** : variable d'env `DEMO_ONBOARDING=fresh` → `onboardingCompleted=false` (montre l'onboarding) ; défaut → `true` (dashboard riche directement). Documenté dans le README/CLAUDE.md.
- `db:reset` réutilise les helpers du seed existant (`prisma/seed.ts`) pour ne pas dupliquer la data.
- Pas de test unitaire dédié (script d'ops) ; vérification manuelle `npm run db:reset` (mainteneur, DB dev).

### Sous-projet #2 — Couche data multi-tenant (sans UI auth)

`User`/`UserSettings` per-user + `userId` sur les 6 modèles + migration propre + **scoping de toutes les fonctions/routes** par `userId`. Pendant ce sous-projet, le `userId` courant est fourni par un **stub temporaire** (`getCurrentUserId()` renvoyant un user de démo) pour permettre tests et exécution sans l'UI auth. Tests d'isolation.

### Sous-projet #3 — Auth.js + UI + middleware

`src/auth.ts` (Credentials + JWT + bcrypt), `/login`, `/signup`, `middleware.ts`, déconnexion, `resolveLocale`/onboarding per-user. Le stub `getCurrentUserId()` de #2 est remplacé par `auth()`. Le seed/`db:reset` est mis à jour pour créer un user démo avec mot de passe connu.

---

## Risques

- **Deadline** : ~25-30 fichiers + migration + auth + UI + reprise massive de tests à 2 jours d'une démo live. Le découpage permet d'atterrir à un palier stable.
- **Credentials provider** : déconseillé « prod » par Auth.js (sessions JWT, pas de rotation/refresh côté DB) — acceptable pour une démo, à durcir post-démo si besoin.
- **Migration destructive** (#2) : la prod perd ses données de démo existantes (assumé, reseed).

## Hors scope

- OAuth / social login, magic link, vérification d'email, reset de mot de passe.
- Rôles/permissions, multi-tenant avancé (partage entre comptes).
- Rotation de session côté DB.

## Convention de commits

Une branche par sous-projet (`chore/demo-reset-script`, puis `feat/multi-tenant-data`, puis `feat/auth`). Conventional Commits anglais, scope adapté. Pas de trailer `Co-authored-by`. Merge commit manuel par le mainteneur.
