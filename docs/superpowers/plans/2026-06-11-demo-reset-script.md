# Demo reset script (sous-projet #1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Offrir un reset/reseed démo fiable sur le modèle mono-utilisateur actuel, avec un onboarding basculable (montré ou sauté).

**Architecture:** Le `seed` fait déjà wipe + reseed. On rend `onboardingCompleted` configurable via env `DEMO_ONBOARDING`, on ajoute des scripts npm `db:reset` / `db:reset:fresh`, et on documente.

**Tech Stack:** Prisma 7, `tsx`, npm scripts.

---

## Conventions

- Branche **`chore/demo-reset-script`** (déjà créée depuis `main`). Conventional Commits anglais, scope `db`/`docs`. Pas de `Co-authored-by`. Merge manuel.
- `npm run lint` + `npm run build` (avec `DATABASE_URL` factice) verts avant commit. Pas de test unitaire (script d'ops).

## Task 1 : onboarding configurable + scripts `db:reset` + doc

**Files:** Modify `prisma/seed.ts`, `package.json`, `CLAUDE.md`

- [ ] **Step 1 : onboarding pilotable par env** — dans `prisma/seed.ts`, remplacer le bloc `userSettings.upsert` :

```ts
  // Profil unique du MVP. DEMO_ONBOARDING=fresh → onboarding affiché ; sinon terminé.
  const onboardingCompleted = process.env.DEMO_ONBOARDING !== "fresh";
  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: { onboardingCompleted },
    create: { id: "default", theme: "light", locale: "fr", onboardingCompleted },
  });
```

- [ ] **Step 2 : scripts npm** — dans `package.json`, ajouter sous les scripts `db:*` :

```json
    "db:reset": "prisma db seed",
    "db:reset:fresh": "DEMO_ONBOARDING=fresh prisma db seed",
```

(`db:reset` = wipe + reseed, onboarding terminé/dashboard riche ; `db:reset:fresh` = idem mais onboarding affiché.)

- [ ] **Step 3 : documentation** — dans `CLAUDE.md`, section « Seed de démo », ajouter un paragraphe :

> **Reset démo :** `npm run db:reset` vide la base et la re-seede (le seed fait déjà le wipe). Onboarding marqué terminé (dashboard riche immédiat). `npm run db:reset:fresh` fait la même chose mais laisse l'onboarding à afficher (`onboardingCompleted=false`) pour démontrer le flow d'accueil.

- [ ] **Step 4 : lint + build (typecheck du seed)**
```bash
npm run format && npm run lint
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npm run build
```
Expected: vert (le seed compile, scripts ajoutés).

- [ ] **Step 5 : [DB — utilisateur] vérif manuelle** (mainteneur, DB dev) :
```bash
npm run db:reset         # dashboard riche, onboarding sauté
npm run db:reset:fresh   # onboarding affiché au prochain chargement
```

- [ ] **Step 6 : commit, push, PR**
```bash
git add prisma/seed.ts package.json CLAUDE.md
git commit -m "chore(db): add db:reset demo scripts with onboarding toggle"
git push -u origin chore/demo-reset-script
gh pr create --base main --head chore/demo-reset-script \
  --title "chore(db): add demo reset/reseed scripts" \
  --body "Ajoute npm run db:reset (wipe + reseed, dashboard riche) et db:reset:fresh (idem mais onboarding affiché). Le seed rend onboardingCompleted pilotable via DEMO_ONBOARDING. Filet pour la démo de vendredi, indépendant de l'auth multi-tenant (sous-projets #2/#3)."
```

---

## Self-Review

- §Sous-projet #1 du spec auth → Task 1 ✅ (toggle onboarding + db:reset + doc).
- Pas de placeholder ; code complet.
- Pas de migration, pas de changement de schéma — conforme « modèle mono-utilisateur actuel ».
