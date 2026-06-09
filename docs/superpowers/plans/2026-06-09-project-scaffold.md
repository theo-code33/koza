# kōza — Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the kōza foundation — Next.js 16 + TypeScript strict, Tailwind v4 (CSS-first DA tokens), Prisma 7 + PostgreSQL, Vitest + Playwright, Docker Compose, multi-stage Dockerfile, GitHub Actions CI, and a working `/api/health` endpoint — so the app builds, `docker compose up` serves a page, and the test/CI pipeline is green.

**Architecture:** App Router with Server Components by default. Prisma 7 `prisma-client` generator (Rust-free, ESM) outputs to `src/generated/prisma`. Tailwind v4 design tokens live in `src/app/globals.css` via `@theme` with a `dark` variant. Money is `Decimal`. CI runs `lint` + `build` on every push and adds the test jobs on pull requests.

**Tech Stack:** Next.js 16 LTS, React 19.2, TypeScript 5 (strict), Tailwind CSS 4, Prisma 7, PostgreSQL 16, Vitest 4, Testing Library, Playwright, Docker, GitHub Actions.

---

## Conventions for every commit in this plan

- Work on branch **`feat/project-scaffold`** (create it first — never commit on `main`).
- Conventional Commits, **English**, imperative, lowercase, no trailing period, ≤72 chars.
- Scope from the project list (`setup`, `db`, `docker`, `ci`).
- **No `Co-authored-by` trailer** — one author only (project rule, overrides any default).
- Claude opens the PR via `gh` when the plan is done; **the maintainer merges manually on GitHub** (merge commit, no squash).

**Step 0 — create the branch (do this once before Task 1):**

```bash
git checkout -b feat/project-scaffold
```

Expected: `Switched to a new branch 'feat/project-scaffold'`

---

## File Structure

Files created/modified by this plan and their responsibility:

- `package.json` — scripts + dependencies.
- `next.config.ts` — Next config, `output: 'standalone'`.
- `tsconfig.json` — TypeScript strict + `@/*` alias.
- `eslint.config.mjs` — ESLint flat config (Next + TS).
- `.prettierrc.json`, `.prettierignore` — formatting.
- `postcss.config.mjs` — Tailwind v4 PostCSS plugin.
- `src/app/globals.css` — Tailwind import + `@theme` DA tokens + dark variant.
- `src/app/layout.tsx`, `src/app/page.tsx` — root layout + landing page.
- `prisma/schema.prisma` — generator + datasource + `UserSettings`.
- `src/lib/prisma.ts` — Prisma client singleton.
- `src/app/api/health/route.ts` — health endpoint.
- `vitest.config.ts`, `vitest.setup.ts` — unit/integration test runner.
- `playwright.config.ts`, `e2e/specs/home.spec.ts` — E2E.
- `docker-compose.yml` — dev services (db + app).
- `Dockerfile`, `.dockerignore` — production multi-stage image.
- `.env.example`, `.gitignore` — env template + ignores.
- `.github/workflows/ci.yml`, `.github/pull_request_template.md` — CI + PR template.
- Tests: `src/app/api/health/route.test.ts`, `src/lib/sample.test.ts`, `src/app/page.test.tsx`.

---

### Task 1: Bootstrap Next.js 16 + TypeScript into the existing repo

The repo already contains `.git`, `CLAUDE.md`, and `docs/`. `create-next-app` refuses a non-empty dir, so scaffold into a temp dir and copy in (excluding `.git` and `node_modules`).

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore` (all generated).

- [ ] **Step 1: Generate the app in a temp directory**

Run:
```bash
npx create-next-app@latest /tmp/koza-init \
  --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm --yes
```
Expected: create-next-app completes; `/tmp/koza-init` contains a Next 16 project.

- [ ] **Step 2: Copy generated files into the repo (preserve our .git/CLAUDE.md/docs)**

Run:
```bash
rsync -a --exclude='.git' --exclude='node_modules' /tmp/koza-init/ ./
rm -rf /tmp/koza-init
npm install
```
Expected: `package.json`, `src/app/`, `tsconfig.json`, etc. now exist at repo root; `npm install` succeeds.

- [ ] **Step 3: Verify the dev server boots**

Run:
```bash
npm run dev &
sleep 8
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
```
Expected: prints `200`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(setup): bootstrap next 16 app router with typescript and tailwind"
```

---

### Task 2: Enforce TypeScript strict, Prettier, and the lint scripts

**Files:**
- Modify: `tsconfig.json`
- Create: `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Ensure `strict` and alias in `tsconfig.json`**

Confirm `compilerOptions` contains (create-next-app sets most; ensure these exact values):
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Step 2: Add Prettier**

Run:
```bash
npm install -D prettier
```

Create `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
```

Create `.prettierignore`:
```
.next
node_modules
src/generated
coverage
playwright-report
```

- [ ] **Step 3: Set the scripts in `package.json`**

Replace the `scripts` block with:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "docker:dev": "docker compose up -d",
    "docker:down": "docker compose down"
  }
}
```

- [ ] **Step 4: Verify lint passes**

Run: `npm run lint`
Expected: ESLint reports no errors; Prettier check passes (run `npm run format` first if it complains, then re-run).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(setup): add prettier and strict typescript with lint scripts"
```

---

### Task 3: Apply the kōza design tokens in Tailwind v4 (CSS-first)

**Files:**
- Modify: `src/app/globals.css`
- Verify: `postcss.config.mjs` (create-next-app already adds `@tailwindcss/postcss`)

- [ ] **Step 1: Replace `src/app/globals.css` with the DA tokens**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Surfaces & text (light) */
  --color-bg: #f9f8f6;
  --color-surface: #ffffff;
  --color-surface-alt: #f3f2ef;
  --color-text: #1c1c1e;
  --color-text-secondary: #6e6e73;
  --color-muted: #aeaeb2;

  /* Categories */
  --color-essential: #7d9e8c;
  --color-essential-bg: #eef3f0;
  --color-leisure: #9b8ead;
  --color-leisure-bg: #f2eff7;
  --color-savings: #7a9bb5;
  --color-savings-bg: #ecf2f7;

  /* Signals */
  --color-warning: #c4956a;
  --color-warning-bg: #fbf3ea;
  --color-over: #b07070;
  --color-over-bg: #f7edec;
  --color-accent: #5a7a6a;
  --color-accent-soft: #e9efeb;
  --color-line: rgba(0, 0, 0, 0.06);

  /* Radii */
  --radius-card: 16px;
  --radius-button: 12px;
  --radius-input: 10px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04);
  --shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(0, 0, 0, 0.06);
}

/* Dark mode token overrides */
.dark {
  --color-bg: #1a1a1c;
  --color-surface: #242426;
  --color-surface-alt: #2c2c2e;
  --color-text: #e5e5e7;
  --color-text-secondary: #98989d;
  --color-muted: #6e6e73;

  --color-essential: #8fb09e;
  --color-essential-bg: #232a26;
  --color-leisure: #ada0bf;
  --color-leisure-bg: #2a2630;
  --color-savings: #8aadc7;
  --color-savings-bg: #222b32;

  --color-warning: #d2a77e;
  --color-warning-bg: #2e281f;
  --color-over: #c18a8a;
  --color-over-bg: #2e2323;
  --color-accent: #7a9e8a;
  --color-accent-soft: #25302a;
  --color-line: rgba(255, 255, 255, 0.06);
}

html {
  background-color: var(--color-bg);
  color: var(--color-text);
}

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Use the tokens on the landing page**

Replace `src/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-[40px] font-light text-text">kōza</h1>
      <p className="text-base text-text-secondary">
        Suivi de budget personnel — 50 / 30 / 20.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Verify the build compiles with the tokens**

Run: `npm run build`
Expected: build succeeds; `bg-bg`, `text-text`, `text-text-secondary`, `max-w-[720px]` resolve without "unknown utility" errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style(setup): add koza design tokens via tailwind v4 theme"
```

---

### Task 4: Set up Prisma 7 with PostgreSQL

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`, `.env`, `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Install Prisma 7**

Run:
```bash
npm install -D prisma
npm install @prisma/client
```

- [ ] **Step 2: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model UserSettings {
  id                  String  @id @default("default")
  theme               String  @default("light")
  locale              String  @default("fr")
  onboardingCompleted Boolean @default(false)
}
```

- [ ] **Step 3: Create `src/lib/prisma.ts` (singleton)**

```ts
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

> If `prisma generate` (next step) reports a different entry file, adjust the import to the path it prints (Prisma 7 outputs an ESM client; the entry is `client.ts`). Verify with `ls src/generated/prisma`.

- [ ] **Step 4: Create env files and update `.gitignore`**

Create `.env`:
```
DATABASE_URL="postgresql://koza:koza@localhost:5432/koza?schema=public"
POSTGRES_USER=koza
POSTGRES_PASSWORD=koza
POSTGRES_DB=koza
```

Create `.env.example`:
```
# PostgreSQL (used by docker-compose and Prisma)
POSTGRES_USER=koza
POSTGRES_PASSWORD=koza
POSTGRES_DB=koza

# Prisma connection string
DATABASE_URL="postgresql://koza:koza@localhost:5432/koza?schema=public"
```

Append to `.gitignore`:
```
# env
.env

# prisma generated client
/src/generated
```

- [ ] **Step 5: Start a local Postgres and run the first migration**

Run:
```bash
docker run --name koza-pg -e POSTGRES_USER=koza -e POSTGRES_PASSWORD=koza -e POSTGRES_DB=koza -p 5432:5432 -d postgres:16-alpine
sleep 5
npx prisma migrate dev --name init
```
Expected: a migration is created under `prisma/migrations/`, the `UserSettings` table is created, and the client generates into `src/generated/prisma`.

- [ ] **Step 6: Verify the client imports and connects**

Run:
```bash
node --input-type=module -e "import { PrismaClient } from './src/generated/prisma/client.js'; const p = new PrismaClient(); const r = await p.\$queryRaw\`SELECT 1 as ok\`; console.log(r); await p.\$disconnect();"
```
Expected: prints an array containing `ok: 1`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(db): add prisma 7 client and user settings model"
```

---

### Task 5: Health check endpoint (TDD)

**Files:**
- Test: `src/app/api/health/route.test.ts`
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Write the failing test**

`src/app/api/health/route.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) },
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 and status ok when the database responds", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- src/app/api/health/route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/health/route` (file does not exist).

- [ ] **Step 3: Implement the route**

`src/app/api/health/route.ts`:
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- src/app/api/health/route.test.ts`
Expected: PASS (1 test).

> If the test cannot find the Vitest config yet, this task depends on Task 6. Implement Task 6 first, then return here. (Recommended order: do Step 3 now, then run after Task 6.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(setup): add health check endpoint with prisma connectivity probe"
```

---

### Task 6: Configure Vitest + Testing Library

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `src/lib/sample.test.ts`, `src/app/page.test.tsx`
- Modify: `package.json` (dev deps)

- [ ] **Step 1: Install test dependencies**

Run:
```bash
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Write a pure-logic sample test**

`src/lib/sample.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("test runner sanity", () => {
  it("does basic arithmetic", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Write a component test for the landing page**

`src/app/page.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the kōza wordmark", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "kōza" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the whole suite**

Run: `npm run test`
Expected: PASS — sample test, page test, and the health route test (Task 5) all green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test(setup): configure vitest with testing library"
```

---

### Task 7: Configure Playwright E2E

**Files:**
- Create: `playwright.config.ts`, `e2e/specs/home.spec.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Install Playwright and browsers**

Run:
```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Write the smoke E2E spec**

`e2e/specs/home.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("landing page shows the kōza wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "kōza" })).toBeVisible();
});
```

- [ ] **Step 4: Append Playwright artifacts to `.gitignore`**

```
# playwright
/test-results
/playwright-report
/playwright/.cache
```

- [ ] **Step 5: Build then run the E2E smoke test**

Run:
```bash
npm run build
npm run test:e2e
```
Expected: 1 passed (the webServer starts `npm run start`, the spec finds the heading).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(setup): add playwright e2e with landing smoke test"
```

---

### Task 8: Docker Compose for local development

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - koza_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    image: node:22-alpine
    working_dir: /app
    command: sh -c "npm install && npx prisma migrate deploy && npx prisma generate && npm run dev"
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy

volumes:
  koza_db_data:
```

- [ ] **Step 2: Stop the throwaway Postgres from Task 4 to free port 5432**

Run:
```bash
docker rm -f koza-pg
```
Expected: container removed (ignore "No such container" if already gone).

- [ ] **Step 3: Bring the stack up and probe the health endpoint**

Run:
```bash
docker compose up -d
sleep 30
curl -s http://localhost:3000/api/health
```
Expected: `{"status":"ok"}`.

- [ ] **Step 4: Bring it down**

Run: `docker compose down`
Expected: services stopped.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(docker): add docker compose dev stack with postgres"
```

---

### Task 9: Production multi-stage Dockerfile

**Files:**
- Create: `Dockerfile`, `.dockerignore`
- Modify: `next.config.ts`

- [ ] **Step 1: Enable standalone output in `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
.next
.git
e2e
playwright-report
test-results
coverage
docs
*.md
.env
```

- [ ] **Step 3: Create the multi-stage `Dockerfile`**

```dockerfile
# Stage 1 — deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2 — builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Stage 3 — runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
```

> Prisma 7 is Rust-free: there is no query-engine binary to copy into the runner stage. The generated client under `src/generated/prisma` is bundled by Next's standalone tracing during `npm run build`.

- [ ] **Step 4: Build the production image**

Run:
```bash
docker build -t koza:prod .
```
Expected: image builds through all three stages without error.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(docker): add multi-stage production dockerfile with standalone output"
```

---

### Task 10: GitHub Actions CI + PR template

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/pull_request_template.md`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
        env:
          DATABASE_URL: "postgresql://koza:koza@localhost:5432/koza?schema=public"

  test-unit:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test

  test-integration:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: koza_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: "postgresql://test:test@localhost:5432/koza_test?schema=public"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
      - run: npm run test

  test-e2e:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: koza_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: "postgresql://test:test@localhost:5432/koza_test?schema=public"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e
```

- [ ] **Step 2: Create `.github/pull_request_template.md`**

```markdown
## Ce que fait cette PR
<!-- Une phrase. -->

## Pourquoi
<!-- Contexte ou problème résolu. -->

## Comment tester
<!-- Étapes manuelles pour vérifier le comportement. -->

## Checklist
- [ ] Le code respecte les conventions du CLAUDE.md
- [ ] Aucun `console.log` de debug laissé
- [ ] Les types TypeScript sont complets (pas de `any`)
- [ ] Les tests passent localement (`npm run test`)
- [ ] L'UI a été vérifiée sur mobile et desktop
- [ ] L'UI fonctionne en light mode et dark mode
- [ ] Les textes visibles passent par i18n (pas de string en dur)
```

- [ ] **Step 3: Validate the workflow YAML locally**

Run:
```bash
node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); if(!y.includes('jobs:')) throw new Error('missing jobs'); console.log('ci.yml looks structurally valid');"
```
Expected: prints the success line. (Full validation happens once pushed.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci(setup): add github actions pipeline and pr template"
```

---

### Task 11: Final verification and push

- [ ] **Step 1: Run the full local gate**

Run:
```bash
npm run lint && npm run build && npm run test
```
Expected: lint clean, build succeeds, all unit/integration tests pass.

- [ ] **Step 2: Push the branch and open the PR**

Run:
```bash
git push -u origin feat/project-scaffold
gh pr create --title "chore(setup): scaffold next 16 + prisma 7 + docker + ci" \
  --body "Foundation for kōza: Next 16 App Router (TS strict), Tailwind v4 design tokens, Prisma 7 + Postgres, Vitest + Playwright, Docker Compose, multi-stage Dockerfile, CI (lint+build on push, tests on PR), and /api/health."
```
Expected: PR created. **Do not merge** — the maintainer merges manually on GitHub (merge commit, no squash).

---

## Self-Review

**Spec coverage** (against CLAUDE.md build-order step 1 "Setup projet + Docker + CI + health check"):
- Next 16 + TS strict → Tasks 1–2 ✅
- Tailwind v4 CSS-first DA tokens → Task 3 ✅
- Prisma 7 + Postgres + Decimal-ready → Task 4 ✅ (Decimal models arrive in the monthly-logic plan)
- Health check `/api/health` → Task 5 ✅
- Vitest + Testing Library → Task 6 ✅
- Playwright → Task 7 ✅
- Docker Compose dev → Task 8 ✅
- Multi-stage Dockerfile + standalone → Task 9 ✅
- CI lint+build (always) + tests (PR only) + PR template → Task 10 ✅
- "App builds and serves a page" → Tasks 1, 3, 8 ✅

**Out of scope here (later plans):** full monthly-logic Prisma models, next-intl wiring, next-themes wiring, Recharts, React Hook Form, the seed script. These are deliberately deferred so this plan stays a single working slice.

**Cross-task consistency check:**
- `@/lib/prisma` exported `prisma` (Task 4) is the exact symbol mocked/imported in Task 5 ✅
- Generated client path `src/generated/prisma` is consistent across Task 4 (schema output, gitignore), Task 5 import, and Task 9 Dockerfile note ✅
- `DATABASE_URL` shape is consistent across `.env`, compose, and CI ✅
- `npm run lint` = `eslint . && prettier --check .` consistent between Task 2 scripts and CI lint job ✅

**Known version-sensitive point (flagged, not a placeholder):** the Prisma 7 generated-client import path. Task 4 Step 3 instructs verifying the actual entry file from `ls src/generated/prisma` and adjusting the import if it differs — the rest of the plan references the symbol, not internal paths, so it stays correct.
