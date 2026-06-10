# kōza — Page Réglages (Cycle 1) — Design Spec

> Cycle 1 de la feature Settings : page `/settings` avec bascule de thème (dark mode), export JSON des données, lien vers les revenus, et insertion de Réglages dans la navigation. **Le switch de langue fonctionnel et l'i18n complet (next-intl + extraction des chaînes) sont le Cycle 2**, brainstormé séparément.

## Objectif

Donner à l'utilisateur un écran de réglages clair : basculer entre thème clair et sombre (la DA dark est déjà prête), exporter ses données en JSON (backup manuel), et accéder à la gestion de ses revenus. Au passage, faire entrer **Réglages** dans la barre de navigation à la place de Revenus, conformément au CLAUDE.md.

## Décisions cadrées (brainstorm)

- **Découpage** : Settings d'abord (ce cycle), i18n complet ensuite (cycle séparé).
- **Navigation** : la 4e icône passe de **Revenus → Réglages** (`/settings`). `/incomes` reste accessible via un lien dans Réglages et en direct.
- **Thème** : géré par next-themes (persistance **localStorage**), pas de synchronisation en base (YAGNI sans authentification). Le champ `UserSettings.theme` n'est pas utilisé dans ce cycle.
- **Langue** : affichée mais **non interactive** (« Français » actif, « English — bientôt »). Le switch fonctionnel arrive au cycle i18n.
- **Export** : route `GET /api/export` renvoyant tout le dataset en JSON téléchargeable.

## Architecture

### Routing & navigation

- Nouvelle route **`src/app/(main)/settings/page.tsx`** (Server Component, `force-dynamic` — elle ne lit pas forcément Prisma directement mais reste sous le route group `(main)` qui gate l'onboarding ; `force-dynamic` par cohérence et pour éviter tout prerender).
- **`src/components/nav/app-nav.tsx`** (modify) : l'entrée `{ href: "/incomes", label: "Revenus", icon: Wallet }` devient `{ href: "/settings", label: "Réglages", icon: Settings }` (icône `Settings` de lucide-react). L'ordre reste Dashboard · Dépenses · Budgets · Réglages.

### Page `/settings`

Colonne `max-w-[720px]` centrée, sections espacées (gouttières 40px), titre serif « Réglages ». Quatre sections :

1. **Apparence** — composant client `ThemeToggle` : un `Toggle` (`@/components/ui/toggle`) dont `on = resolvedTheme === "dark"`, `onChange` appelle `setTheme(next ? "dark" : "light")`. Label accessible « Activer le thème sombre ». Garde un état `mounted` (rendu neutre tant que non monté) pour éviter le mismatch d'hydratation propre à next-themes.
2. **Langue** — ligne présentationnelle **statique** (pas de contrôle) : « Français » en `--color-text`, « English — bientôt » en `--color-muted`. Aucune logique.
3. **Revenus** — lien « Gérer mes revenus » → `/incomes` (style lien accent, cohérent avec les liens existants).
4. **Données** — bouton d'export : `<a href="/api/export" download className="…">Exporter mes données (JSON)</a>`. Déclenche le téléchargement via la route ci-dessous.

La page est un Server Component ; seul `ThemeToggle` est un client island (`"use client"`).

### Export

- **`src/lib/export.ts`** :
  ```ts
  export interface ExportData {
    exportedAt: string;            // ISO date
    incomes: unknown[];            // toutes les lignes, montants en string
    expenses: unknown[];
    budgets: unknown[];
    settings: unknown;             // UserSettings (ou null)
  }
  export async function buildExport(): Promise<ExportData>;
  ```
  - `Promise.all` : `prisma.income.findMany`, `prisma.expense.findMany`, `prisma.budget.findMany`, `prisma.userSettings.findUnique({ where: { id: "default" } })`.
  - Les montants `Decimal` sont convertis en `string` (sérialisation JSON exacte, jamais de float) : on mappe `amount`/`targetAmount` via `.toString()`. Les dates `DateTime` sont laissées telles quelles (sérialisées en ISO par `NextResponse.json`).
  - `exportedAt = new Date().toISOString()`.
  - Testable avec `@/lib/prisma` mocké.
- **`src/app/api/export/route.ts`** :
  ```ts
  export const dynamic = "force-dynamic";
  export async function GET(): Promise<Response>;
  ```
  - Appelle `buildExport()`, renvoie `new NextResponse(JSON.stringify(data, null, 2), { status: 200, headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="koza-export-${YYYY-MM-DD}.json"` } })`.
  - Le nom de fichier utilise la date du jour (`new Date().toISOString().slice(0, 10)`).

## Composants

- `src/components/settings/theme-toggle.tsx` (Client) — décrit ci-dessus, seule pièce interactive.
- Le reste de `/settings` (sections statiques + liens) vit dans la page Server.

## Flux de données

```
/settings (Server, force-dynamic)
  → rend les sections statiques + <ThemeToggle/> (client)
  → "Exporter" = <a href="/api/export" download>
        GET /api/export (Server, force-dynamic)
          → buildExport() → JSON (Decimal→string) + Content-Disposition attachment
```

## Tests

- **`src/lib/export.test.ts`** (prisma mocké) : `buildExport` agrège les 4 sources ; les montants `Decimal` ressortent en `string` ; `exportedAt` présent.
- **`src/app/api/export/route.test.ts`** : `GET` renvoie 200, `Content-Type: application/json`, en-tête `Content-Disposition` contenant `attachment; filename="koza-export-`, et un corps JSON parsable.
- **`src/components/settings/theme-toggle.test.tsx`** (next-themes mocké) : clic sur le toggle appelle `setTheme` avec la valeur opposée ; l'état `on` reflète `resolvedTheme`.
- **`src/components/nav/app-nav.test.tsx`** (modify) : remplacer les assertions « Revenus » par « Réglages » (lien vers `/settings`) ; vérifier que « Revenus » n'est plus dans la nav.
- **Build** : `DATABASE_URL` factice + `npm run build` pour le typecheck.

## Direction artistique

Conforme au handoff : sections aérées, titres serif, `Toggle` et liens du kit existant, aucun rouge. Light + dark vérifiés (le toggle est justement le moyen de tester le dark mode en live), mobile + desktop.

## i18n

Strings en français codé en dur, **cohérent avec l'existant** — l'externalisation complète est le Cycle 2 (next-intl). La page Réglages, ironiquement, sera l'un des écrans migrés à ce moment-là.

## Hors périmètre

- **Cycle 2 (i18n complet)** : next-intl, extraction de toutes les chaînes en `fr.json`/`en.json`, traduction EN, résolution de locale (DB + cookie), activation du switch de langue.
- Synchronisation du thème en base (`UserSettings.theme`).
- Logique mensuelle (report), notifications, vue annuelle.
