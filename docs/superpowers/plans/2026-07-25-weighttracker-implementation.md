# WeightTracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js family weight-loss challenge tracker that scores each participant's individual body-composition improvement (not raw numbers), applies age/gender/health-condition fairness handicaps, and presents a filterable leaderboard plus per-user progress timelines.

**Architecture:** Next.js App Router + TypeScript, GraphQL API (Apollo Server route handler) backed by Prisma/PostgreSQL, MUI for UI, NextAuth (Credentials, JWT sessions) for auth. The scoring engine is pure, framework-free TypeScript so it can be unit-tested exhaustively without a database.

**Tech Stack:** Next.js (App Router), TypeScript, MUI + @mui/x-charts, @apollo/server + @as-integrations/next + @apollo/client, graphql-code-generator, Prisma + PostgreSQL, next-auth (Credentials provider, JWT strategy), bcryptjs, Vitest + @testing-library/react.

## Global Constraints

- Metric units are metric-only (kg, cm) — no unit conversion anywhere.
- Single active `Challenge` at a time — no multi-challenge history in v1.
- Registration is via one shared, unauthenticated link — no email verification, no password reset flow.
- Gender is a binary MALE/FEMALE field — handicap brackets are defined on this binary.
- Scores are always computed on-demand from current `MetricConfig`/`HandicapBracket`/`Condition` data — never persisted/cached, so admin edits re-rank immediately.
- No promotion UI for admins in v1 — additional admins are granted by direct DB edit.

---

## Task 1: Project Scaffolding, Theme, and Tooling

**Files:**
- Create: `package.json` (update existing), `tsconfig.json`, `next.config.ts`, `.gitignore`
- Create: `src/theme/theme.ts`, `src/theme/palette.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `vitest.config.ts`, `src/test/setup.ts`

**Interfaces:**
- Produces: `theme` (MUI `Theme` object) exported from `src/theme/theme.ts`, imported by `src/app/layout.tsx`.

- [ ] **Step 1: Initialize Next.js app in place**

Run:
```bash
npx create-next-app@latest . --typescript --app --no-tailwind --eslint --src-dir --import-alias "@/*" --use-npm
```
When prompted about the existing `package.json`, allow it to merge/overwrite (accept defaults — we'll restore `name`/`description`/`author` fields after).

- [ ] **Step 2: Restore project metadata fields**

Edit `package.json`, ensure these fields are present (merge with whatever create-next-app generated, don't remove its `scripts`/`dependencies`):
```json
{
  "name": "weighttracker",
  "description": "Dumb competition for tracking weight change, objectively",
  "author": "Gabriel Monge",
  "license": "ISC"
}
```

- [ ] **Step 3: Install remaining dependencies**

Run:
```bash
npm install @mui/material @mui/icons-material @mui/x-charts @emotion/react @emotion/styled \
  @apollo/server @as-integrations/next @apollo/client graphql @graphql-tools/schema @graphql-tools/merge \
  next-auth bcryptjs \
  prisma @prisma/client
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom \
  @types/bcryptjs tsx @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers @graphql-codegen/typescript-operations @graphql-codegen/typed-document-node
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Write the theme**

Create `src/theme/palette.ts`:
```ts
export const palette = {
  primary: { main: '#2E7D32' },
  secondary: { main: '#EF6C00' },
  success: { main: '#43A047' },
  error: { main: '#D32F2F' },
};
```

Create `src/theme/theme.ts`:
```ts
import { createTheme } from '@mui/material/styles';
import { palette } from './palette';

export const theme = createTheme({
  palette,
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
});
```

- [ ] **Step 6: Write a smoke test for the theme**

Create `src/theme/theme.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { theme } from './theme';

describe('theme', () => {
  it('defines a primary palette color', () => {
    expect(theme.palette.primary.main).toBe('#2E7D32');
  });
});
```

- [ ] **Step 7: Run the test suite**

Run: `npm test`
Expected: 1 passed (theme.test.ts)

- [ ] **Step 8: Wire the theme into the root layout**

Next.js App Router treats `layout.tsx` as a Server Component by default. Passing
`theme` (which contains functions like `breakpoints.up`) as a prop from a
Server Component into a Client Component (`ThemeProvider`) fails at build time
with a serialization error. Keep the theme entirely inside a Client Component
so it never crosses that boundary as a prop.

Note on package version: `@mui/material-nextjs` ships per-Next-major entry
points (`v14-appRouter`, `v15-appRouter`, `v16-appRouter`, ...) — import the
one matching your installed Next.js major version (check
`node_modules/@mui/material-nextjs/` if unsure).

Create `src/theme/ThemeRegistry.tsx`:
```tsx
'use client';

import { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

export function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
```

Create `src/app/layout.tsx`:
```tsx
import { ReactNode } from 'react';
import { ThemeRegistry } from '@/theme/ThemeRegistry';

export const metadata = { title: 'WeightTracker' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
```

Run: `npm install @mui/material-nextjs` (required for the App Router cache provider).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js app with MUI theme and Vitest"
```

---

## Task 2: Prisma Schema, Migrations, Seed Data

> **Prisma version note:** this project resolved onto Prisma 7, which changed
> the CLI/config surface significantly from earlier Prisma majors. The
> differences (and why) are called out inline below wherever they apply. If a
> future Prisma major changes this again, treat the `npx prisma generate` /
> `npx prisma migrate dev` error output as authoritative over this doc.

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma.config.ts` (Prisma 7 moved datasource URL and seed command out of `schema.prisma`/`package.json` and into this file — see Step 1a)
- Create: `prisma/seed.ts`
- Create: `src/lib/prisma.ts`
- Create: `.env` (local, gitignored), `.env.example`

**Interfaces:**
- Produces: `prisma` singleton client from `src/lib/prisma.ts`, used by every resolver/service task from here on.
- Produces: Prisma models `User`, `Challenge`, `Measurement`, `MetricConfig`, `HandicapBracket`, `Condition`, `UserCondition` with fields exactly as below — all later tasks reference these field names verbatim.

- [ ] **Step 1: Write the schema**

Prisma 7 no longer allows `url = env("DATABASE_URL")` inside the
`datasource` block in `schema.prisma` — the CLI now reads the connection URL
from `prisma.config.ts` (Step 1a), and the generated `PrismaClient` requires an
explicit driver adapter at runtime (Step 4) rather than reading `DATABASE_URL`
implicitly. If you're on an earlier Prisma major, put `url = env("DATABASE_URL")`
back in the `datasource` block and skip `prisma.config.ts`/the adapter in
Step 4 in favor of a plain `new PrismaClient()`.

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Gender {
  MALE
  FEMALE
}

enum WeightGoal {
  LOSE
  GAIN
  MAINTAIN
}

enum MetricKey {
  WEIGHT
  BMI
  BODY_FAT_PCT
  SUBCUTANEOUS_FAT_PCT
  VISCERAL_FAT_RATING
  SKELETAL_MUSCLE_PCT
  MUSCLE_MASS_KG
  PROTEIN_PCT
  BMR
  METABOLIC_AGE
}

enum DirectionType {
  FIXED
  GOAL_RELATIVE
}

enum FixedDirection {
  UP
  DOWN
}

model User {
  id           String     @id @default(cuid())
  displayName  String     @unique
  passwordHash String
  gender       Gender
  birthdate    DateTime
  weightGoal   WeightGoal
  isAdmin      Boolean    @default(false)
  createdAt    DateTime   @default(now())

  measurements Measurement[]
  conditions   UserCondition[]
}

model Challenge {
  id        String    @id @default(cuid())
  name      String
  startDate DateTime
  endDate   DateTime?
  isActive  Boolean   @default(true)

  measurements Measurement[]
}

model Measurement {
  id                 String   @id @default(cuid())
  userId             String
  challengeId        String
  recordedAt         DateTime @default(now())
  weightKg           Float
  bmi                Float
  bodyFatPct         Float
  subcutaneousFatPct Float
  visceralFatRating  Float
  skeletalMusclePct  Float
  muscleMassKg       Float
  proteinPct         Float?
  bmr                Float?
  metabolicAge       Int?
  isBaseline         Boolean  @default(false)

  user      User      @relation(fields: [userId], references: [id])
  challenge Challenge @relation(fields: [challengeId], references: [id])

  @@index([userId, challengeId, recordedAt])
}

model MetricConfig {
  id             String          @id @default(cuid())
  challengeId    String?
  metricKey      MetricKey
  weight         Float
  directionType  DirectionType
  fixedDirection FixedDirection?

  @@unique([challengeId, metricKey])
}

model HandicapBracket {
  id         String @id @default(cuid())
  gender     Gender
  minAge     Int
  maxAge     Int
  multiplier Float
}

model Condition {
  id          String  @id @default(cuid())
  name        String  @unique
  description String?
  multiplier  Float

  users UserCondition[]
}

model UserCondition {
  userId      String
  conditionId String

  user      User      @relation(fields: [userId], references: [id])
  condition Condition @relation(fields: [conditionId], references: [id])

  @@id([userId, conditionId])
}
```

- [ ] **Step 1a: Create the Prisma config file (Prisma 7)**

Install the packages this requires (also pulls in the Postgres driver adapter
needed by Step 4):
```bash
npm install dotenv @prisma/adapter-pg pg
npm install -D @types/pg
```

Create `prisma.config.ts` at the project root:
```ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

This replaces both the `datasource.url` that used to live in `schema.prisma`
and the `"prisma": { "seed": "..." }` block that used to live in
`package.json` in earlier Prisma versions — don't add either of those here.

- [ ] **Step 2: Create local env files**

Create `.env.example`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/weighttracker"
NEXTAUTH_SECRET="replace-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Create `.env` (gitignored) with your real Postgres connection string and a
generated `NEXTAUTH_SECRET` (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
or `openssl rand -base64 32` if available).

Confirm `.gitignore` includes `.env*` and `/node_modules` (create-next-app
adds both by default — verify).

If you don't have a Postgres instance available (no local server, no Docker),
stop here and ask the user for a connection string (e.g. a free Neon/Supabase
project) or for permission to install Postgres locally — don't guess or spin
up infrastructure unasked.

- [ ] **Step 3: Run the initial migration**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: migration created under `prisma/migrations/`, applied to the
database, Prisma Client generated. If this reports schema drift against an
already-dirty database (e.g. from earlier experimentation against the same
connection string), treat `prisma migrate reset` as a destructive action —
stop and get explicit user confirmation first, per this project's standing
rule on destructive operations. Prisma's CLI itself will also refuse to run
`migrate reset` unattended when it detects an AI agent invoking it, and will
require the user's exact consenting message to be passed via the
`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var.

If `prisma generate` doesn't run automatically as part of `migrate dev`, run
it explicitly:
```bash
npx prisma generate
```

- [ ] **Step 4: Create the Prisma client singleton**

Prisma 7's generated client throws
`PrismaClientInitializationError: ... A driver adapter is required` if
constructed with no arguments — `new PrismaClient()` no longer reads
`DATABASE_URL` implicitly. Pass a `@prisma/adapter-pg` adapter explicitly.

Create `src/lib/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 5: Write the seed script**

Create `prisma/seed.ts`. Two things differ from a naive implementation, both
worth calling out:

1. It must construct its own `PrismaClient` with the same `@prisma/adapter-pg`
   pattern as `src/lib/prisma.ts` (Prisma 7 requires this everywhere, not just
   in app code).
2. It must be **idempotent** — `npx prisma db seed` can be run more than once
   (e.g. after an interrupted run), so re-running it must not create duplicate
   `Challenge`/`HandicapBracket` rows. Use `findFirst`-or-`create` for the
   challenge, a count-guard for the brackets, and `upsert` by `displayName` for
   the admin user (a plain single-column unique, so `upsert` works fine there —
   see the `MetricConfig` note below for why it does *not* work for that
   model).

```ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const challenge =
    (await prisma.challenge.findFirst({ where: { isActive: true } })) ??
    (await prisma.challenge.create({
      data: { name: 'Family Challenge 2026', startDate: new Date(), isActive: true },
    }));

  const defaultMetrics: Array<{
    metricKey:
      | 'WEIGHT' | 'BMI' | 'BODY_FAT_PCT' | 'SUBCUTANEOUS_FAT_PCT' | 'VISCERAL_FAT_RATING'
      | 'SKELETAL_MUSCLE_PCT' | 'MUSCLE_MASS_KG' | 'PROTEIN_PCT' | 'BMR' | 'METABOLIC_AGE';
    weight: number;
    directionType: 'FIXED' | 'GOAL_RELATIVE';
    fixedDirection: 'UP' | 'DOWN' | null;
  }> = [
    { metricKey: 'WEIGHT', weight: 1.0, directionType: 'GOAL_RELATIVE', fixedDirection: null },
    { metricKey: 'BMI', weight: 1.0, directionType: 'GOAL_RELATIVE', fixedDirection: null },
    { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
    { metricKey: 'SUBCUTANEOUS_FAT_PCT', weight: 1.0, directionType: 'FIXED', fixedDirection: 'DOWN' },
    { metricKey: 'VISCERAL_FAT_RATING', weight: 1.0, directionType: 'FIXED', fixedDirection: 'DOWN' },
    { metricKey: 'SKELETAL_MUSCLE_PCT', weight: 1.2, directionType: 'FIXED', fixedDirection: 'UP' },
    { metricKey: 'MUSCLE_MASS_KG', weight: 1.2, directionType: 'FIXED', fixedDirection: 'UP' },
    { metricKey: 'PROTEIN_PCT', weight: 0.5, directionType: 'FIXED', fixedDirection: 'UP' },
    { metricKey: 'BMR', weight: 0.5, directionType: 'FIXED', fixedDirection: 'UP' },
    { metricKey: 'METABOLIC_AGE', weight: 0.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
  ];

  for (const metric of defaultMetrics) {
    // Compound unique indexes can't be looked up with `null` as a key component
    // via Prisma's generated shorthand (SQL treats NULLs as distinct values), so
    // Prisma rejects `upsert({ where: { challengeId_metricKey: { challengeId: null, ... } } })`
    // at runtime with "Argument `challengeId` must not be null." Global-default
    // rows (challengeId: null) must be found manually instead. The admin
    // service's `updateMetricConfig` (Task 13) hits this same limitation and
    // uses the identical find-then-create/update pattern.
    const existing = await prisma.metricConfig.findFirst({
      where: { challengeId: null, metricKey: metric.metricKey },
    });
    if (existing) {
      await prisma.metricConfig.update({
        where: { id: existing.id },
        data: { weight: metric.weight, directionType: metric.directionType, fixedDirection: metric.fixedDirection },
      });
    } else {
      await prisma.metricConfig.create({ data: { ...metric, challengeId: null } });
    }
  }

  const brackets = [
    { gender: 'MALE' as const, minAge: 0, maxAge: 29, multiplier: 1.0 },
    { gender: 'MALE' as const, minAge: 30, maxAge: 44, multiplier: 1.05 },
    { gender: 'MALE' as const, minAge: 45, maxAge: 120, multiplier: 1.1 },
    { gender: 'FEMALE' as const, minAge: 0, maxAge: 29, multiplier: 1.05 },
    { gender: 'FEMALE' as const, minAge: 30, maxAge: 44, multiplier: 1.1 },
    { gender: 'FEMALE' as const, minAge: 45, maxAge: 120, multiplier: 1.2 },
  ];
  const existingBrackets = await prisma.handicapBracket.count();
  if (existingBrackets === 0) {
    for (const bracket of brackets) {
      await prisma.handicapBracket.create({ data: bracket });
    }
  }

  const adminPasswordHash = await bcrypt.hash('changeme123', 10);
  await prisma.user.upsert({
    where: { displayName: 'Gabriel' },
    update: {},
    create: {
      displayName: 'Gabriel',
      passwordHash: adminPasswordHash,
      gender: 'MALE',
      birthdate: new Date('1995-01-01'),
      weightGoal: 'LOSE',
      isAdmin: true,
    },
  });

  console.log('Seed complete:', { challengeId: challenge.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 6: Run the seed and verify**

Run:
```bash
npx prisma db seed
```
Expected: completes with "Seed complete: { challengeId: ... }" logged. Verify
row counts with a one-off script (or `npx prisma studio` if you're in an
interactive session where a browser tab is practical) — expect 1 `User`, 1
`Challenge`, 10 `MetricConfig` rows, 6 `HandicapBracket` rows. Run the seed a
second time and confirm the counts don't change (idempotency check).

- [ ] **Step 7: Commit**

```bash
git add prisma prisma.config.ts package.json .env.example .gitignore src/lib/prisma.ts
git commit -m "Add Prisma schema, seed data, and client singleton"
```

---

## Task 3: Scoring Engine — Core Types and Direction Math

**Files:**
- Create: `src/features/scoring/types.ts`
- Create: `src/features/scoring/metricValues.ts`
- Create: `src/features/scoring/metricValues.test.ts`
- Create: `src/features/scoring/pctChange.ts`
- Create: `src/features/scoring/pctChange.test.ts`

**Interfaces:**
- Produces: `MeasurementSnapshot`, `MetricConfigInput`, `MetricKey`, `DirectionType`, `FixedDirection`, `Gender`, `WeightGoal` types — used by every later scoring/resolver task.
- Produces: `getMetricValue(snapshot, key): number | null`, `computeFixedPctChange(baseline, current, direction): number`, `computeGoalRelativePctChange(baseline, current, goal): number`.

- [ ] **Step 1: Define shared scoring types**

Create `src/features/scoring/types.ts`:
```ts
export type Gender = 'MALE' | 'FEMALE';
export type WeightGoal = 'LOSE' | 'GAIN' | 'MAINTAIN';

export type MetricKey =
  | 'WEIGHT'
  | 'BMI'
  | 'BODY_FAT_PCT'
  | 'SUBCUTANEOUS_FAT_PCT'
  | 'VISCERAL_FAT_RATING'
  | 'SKELETAL_MUSCLE_PCT'
  | 'MUSCLE_MASS_KG'
  | 'PROTEIN_PCT'
  | 'BMR'
  | 'METABOLIC_AGE';

export type DirectionType = 'FIXED' | 'GOAL_RELATIVE';
export type FixedDirection = 'UP' | 'DOWN';

export interface MetricConfigInput {
  metricKey: MetricKey;
  weight: number;
  directionType: DirectionType;
  fixedDirection: FixedDirection | null;
}

export interface MeasurementSnapshot {
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  subcutaneousFatPct: number;
  visceralFatRating: number;
  skeletalMusclePct: number;
  muscleMassKg: number;
  proteinPct: number | null;
  bmr: number | null;
  metabolicAge: number | null;
}

export interface MetricPctChange {
  metricKey: MetricKey;
  pctChange: number;
}

export interface HandicapBracketInput {
  gender: Gender;
  minAge: number;
  maxAge: number;
  multiplier: number;
}

export interface ScoreBreakdown {
  metricChanges: MetricPctChange[];
  rawScore: number;
  ageGenderMultiplier: number;
  conditionMultipliers: number[];
  finalScore: number;
}
```

- [ ] **Step 2: Write failing tests for `getMetricValue`**

Create `src/features/scoring/metricValues.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getMetricValue } from './metricValues';
import { MeasurementSnapshot } from './types';

const snapshot: MeasurementSnapshot = {
  weightKg: 80,
  bmi: 25,
  bodyFatPct: 20,
  subcutaneousFatPct: 15,
  visceralFatRating: 8,
  skeletalMusclePct: 35,
  muscleMassKg: 30,
  proteinPct: 17,
  bmr: 1700,
  metabolicAge: 30,
};

describe('getMetricValue', () => {
  it('reads required fields', () => {
    expect(getMetricValue(snapshot, 'WEIGHT')).toBe(80);
    expect(getMetricValue(snapshot, 'BODY_FAT_PCT')).toBe(20);
    expect(getMetricValue(snapshot, 'MUSCLE_MASS_KG')).toBe(30);
  });

  it('reads optional fields when present', () => {
    expect(getMetricValue(snapshot, 'PROTEIN_PCT')).toBe(17);
    expect(getMetricValue(snapshot, 'BMR')).toBe(1700);
    expect(getMetricValue(snapshot, 'METABOLIC_AGE')).toBe(30);
  });

  it('returns null for missing optional fields', () => {
    const partial: MeasurementSnapshot = { ...snapshot, proteinPct: null, bmr: null, metabolicAge: null };
    expect(getMetricValue(partial, 'PROTEIN_PCT')).toBeNull();
    expect(getMetricValue(partial, 'BMR')).toBeNull();
    expect(getMetricValue(partial, 'METABOLIC_AGE')).toBeNull();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- metricValues`
Expected: FAIL — `Cannot find module './metricValues'`

- [ ] **Step 4: Implement `getMetricValue`**

Create `src/features/scoring/metricValues.ts`:
```ts
import { MeasurementSnapshot, MetricKey } from './types';

export function getMetricValue(snapshot: MeasurementSnapshot, key: MetricKey): number | null {
  switch (key) {
    case 'WEIGHT':
      return snapshot.weightKg;
    case 'BMI':
      return snapshot.bmi;
    case 'BODY_FAT_PCT':
      return snapshot.bodyFatPct;
    case 'SUBCUTANEOUS_FAT_PCT':
      return snapshot.subcutaneousFatPct;
    case 'VISCERAL_FAT_RATING':
      return snapshot.visceralFatRating;
    case 'SKELETAL_MUSCLE_PCT':
      return snapshot.skeletalMusclePct;
    case 'MUSCLE_MASS_KG':
      return snapshot.muscleMassKg;
    case 'PROTEIN_PCT':
      return snapshot.proteinPct;
    case 'BMR':
      return snapshot.bmr;
    case 'METABOLIC_AGE':
      return snapshot.metabolicAge;
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- metricValues`
Expected: 3 passed

- [ ] **Step 6: Write failing tests for pct-change formulas**

Create `src/features/scoring/pctChange.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeFixedPctChange, computeGoalRelativePctChange } from './pctChange';

describe('computeFixedPctChange', () => {
  it('scores a decrease as positive when direction is DOWN (e.g. body fat %)', () => {
    expect(computeFixedPctChange(20, 15, 'DOWN')).toBeCloseTo(25, 5); // dropped 25% of baseline
  });

  it('scores an increase as negative when direction is DOWN', () => {
    expect(computeFixedPctChange(20, 22, 'DOWN')).toBeCloseTo(-10, 5);
  });

  it('scores an increase as positive when direction is UP (e.g. muscle mass)', () => {
    expect(computeFixedPctChange(30, 33, 'UP')).toBeCloseTo(10, 5);
  });

  it('scores a decrease as negative when direction is UP', () => {
    expect(computeFixedPctChange(30, 27, 'UP')).toBeCloseTo(-10, 5);
  });

  it('guards against a zero baseline', () => {
    expect(computeFixedPctChange(0, 5, 'UP')).toBe(0);
  });
});

describe('computeGoalRelativePctChange', () => {
  it('LOSE: scores a decrease as positive', () => {
    expect(computeGoalRelativePctChange(100, 90, 'LOSE')).toBeCloseTo(10, 5);
  });

  it('LOSE: scores an increase as negative', () => {
    expect(computeGoalRelativePctChange(100, 105, 'LOSE')).toBeCloseTo(-5, 5);
  });

  it('GAIN: scores an increase as positive', () => {
    expect(computeGoalRelativePctChange(100, 108, 'GAIN')).toBeCloseTo(8, 5);
  });

  it('GAIN: scores a decrease as negative', () => {
    expect(computeGoalRelativePctChange(100, 95, 'GAIN')).toBeCloseTo(-5, 5);
  });

  it('MAINTAIN: penalizes drift in either direction', () => {
    expect(computeGoalRelativePctChange(100, 105, 'MAINTAIN')).toBeCloseTo(-5, 5);
    expect(computeGoalRelativePctChange(100, 95, 'MAINTAIN')).toBeCloseTo(-5, 5);
  });

  it('MAINTAIN: no drift scores zero', () => {
    expect(computeGoalRelativePctChange(100, 100, 'MAINTAIN')).toBe(0);
  });

  it('guards against a zero baseline', () => {
    expect(computeGoalRelativePctChange(0, 5, 'LOSE')).toBe(0);
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `npm test -- pctChange`
Expected: FAIL — `Cannot find module './pctChange'`

- [ ] **Step 8: Implement the pct-change formulas**

Create `src/features/scoring/pctChange.ts`:
```ts
import { FixedDirection, WeightGoal } from './types';

export function computeFixedPctChange(baseline: number, current: number, direction: FixedDirection): number {
  if (baseline === 0) return 0;
  const rawPct = ((current - baseline) / baseline) * 100;
  const directionSign = direction === 'UP' ? 1 : -1;
  return rawPct * directionSign;
}

export function computeGoalRelativePctChange(baseline: number, current: number, goal: WeightGoal): number {
  if (baseline === 0) return 0;
  const rawPct = ((current - baseline) / baseline) * 100;
  if (goal === 'LOSE') return -rawPct;
  if (goal === 'GAIN') return rawPct;
  return -Math.abs(rawPct) || 0; // normalize -0 to 0 (Math.abs(0) === 0, so -0 can leak out here)
}
```

- [ ] **Step 9: Run to verify it passes**

Run: `npm test -- pctChange`
Expected: 12 passed

- [ ] **Step 10: Commit**

```bash
git add src/features/scoring/types.ts src/features/scoring/metricValues.ts src/features/scoring/metricValues.test.ts src/features/scoring/pctChange.ts src/features/scoring/pctChange.test.ts
git commit -m "Add scoring engine core types and pct-change formulas"
```

---

## Task 4: Scoring Engine — Metric Changes, Raw Score, Handicap, Full Breakdown

**Files:**
- Create: `src/features/scoring/metricChanges.ts`
- Create: `src/features/scoring/metricChanges.test.ts`
- Create: `src/features/scoring/handicap.ts`
- Create: `src/features/scoring/handicap.test.ts`
- Create: `src/features/scoring/score.ts`
- Create: `src/features/scoring/score.test.ts`

**Interfaces:**
- Consumes: `getMetricValue`, `computeFixedPctChange`, `computeGoalRelativePctChange` from Task 3; `MeasurementSnapshot`, `MetricConfigInput`, `MetricPctChange`, `HandicapBracketInput`, `ScoreBreakdown`, `Gender`, `WeightGoal` types from Task 3.
- Produces: `computeMetricChanges(baseline, current, configs, weightGoal): MetricPctChange[]`, `computeRawScore(changes, configs): number`, `calculateAge(birthdate, asOf): number`, `findHandicapMultiplier(brackets, gender, age): number`, `computeFinalScore(rawScore, ageGenderMultiplier, conditionMultipliers): number`, `computeScoreBreakdown(params): ScoreBreakdown` — this last one is what resolvers in later tasks call directly.

- [ ] **Step 1: Write failing tests for `computeMetricChanges`**

Create `src/features/scoring/metricChanges.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeMetricChanges } from './metricChanges';
import { MeasurementSnapshot, MetricConfigInput } from './types';

const baseline: MeasurementSnapshot = {
  weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18, visceralFatRating: 10,
  skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: 16, bmr: null, metabolicAge: null,
};
const current: MeasurementSnapshot = {
  weightKg: 85, bmi: 26, bodyFatPct: 20, subcutaneousFatPct: 16, visceralFatRating: 8,
  skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: 18, bmr: 1600, metabolicAge: 28,
};

const configs: MetricConfigInput[] = [
  { metricKey: 'WEIGHT', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
  { metricKey: 'BMI', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
  { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
  { metricKey: 'MUSCLE_MASS_KG', weight: 1.2, directionType: 'FIXED', fixedDirection: 'UP' },
  { metricKey: 'PROTEIN_PCT', weight: 0.5, directionType: 'FIXED', fixedDirection: 'UP' },
];

describe('computeMetricChanges', () => {
  it('computes a change per configured metric for a LOSE goal', () => {
    const changes = computeMetricChanges(baseline, current, configs, 'LOSE');
    const byKey = Object.fromEntries(changes.map((c) => [c.metricKey, c.pctChange]));
    expect(byKey.WEIGHT).toBeCloseTo(5.5556, 3); // lost weight, goal LOSE -> positive
    expect(byKey.BODY_FAT_PCT).toBeCloseTo(20, 3); // fat dropped 25 -> 20
    expect(byKey.MUSCLE_MASS_KG).toBeCloseTo(3.5714, 3); // muscle gained
    expect(byKey.PROTEIN_PCT).toBeCloseTo(12.5, 3); // optional field present at both ends: (18-16)/16*100
  });

  it('excludes an optional metric missing at baseline', () => {
    const baselineNoProtein = { ...baseline, proteinPct: null };
    const changes = computeMetricChanges(baselineNoProtein, current, configs, 'LOSE');
    expect(changes.find((c) => c.metricKey === 'PROTEIN_PCT')).toBeUndefined();
  });

  it('excludes an optional metric missing at current', () => {
    const currentNoProtein = { ...current, proteinPct: null };
    const changes = computeMetricChanges(baseline, currentNoProtein, configs, 'LOSE');
    expect(changes.find((c) => c.metricKey === 'PROTEIN_PCT')).toBeUndefined();
  });

  it('flips WEIGHT/BMI direction for a GAIN goal', () => {
    const changes = computeMetricChanges(baseline, current, configs, 'GAIN');
    const byKey = Object.fromEntries(changes.map((c) => [c.metricKey, c.pctChange]));
    expect(byKey.WEIGHT).toBeCloseTo(-5.5556, 3); // lost weight, goal GAIN -> negative
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- metricChanges`
Expected: FAIL — `Cannot find module './metricChanges'`

- [ ] **Step 3: Implement `computeMetricChanges`**

Create `src/features/scoring/metricChanges.ts`:
```ts
import { getMetricValue } from './metricValues';
import { computeFixedPctChange, computeGoalRelativePctChange } from './pctChange';
import { MeasurementSnapshot, MetricConfigInput, MetricPctChange, WeightGoal } from './types';

export function computeMetricChanges(
  baseline: MeasurementSnapshot,
  current: MeasurementSnapshot,
  configs: MetricConfigInput[],
  weightGoal: WeightGoal
): MetricPctChange[] {
  const changes: MetricPctChange[] = [];

  for (const config of configs) {
    const baselineValue = getMetricValue(baseline, config.metricKey);
    const currentValue = getMetricValue(current, config.metricKey);
    if (baselineValue === null || currentValue === null) continue;

    const pctChange =
      config.directionType === 'GOAL_RELATIVE'
        ? computeGoalRelativePctChange(baselineValue, currentValue, weightGoal)
        : computeFixedPctChange(baselineValue, currentValue, config.fixedDirection ?? 'DOWN');

    changes.push({ metricKey: config.metricKey, pctChange });
  }

  return changes;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- metricChanges`
Expected: 4 passed

- [ ] **Step 5: Write failing tests for handicap logic**

Create `src/features/scoring/handicap.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { calculateAge, findHandicapMultiplier } from './handicap';
import { HandicapBracketInput } from './types';

describe('calculateAge', () => {
  it('computes age when birthday already passed this year', () => {
    expect(calculateAge(new Date('1990-01-01'), new Date('2026-07-25'))).toBe(36);
  });

  it('computes age when birthday has not happened yet this year', () => {
    expect(calculateAge(new Date('1990-12-01'), new Date('2026-07-25'))).toBe(35);
  });

  it('handles the exact birthday date as already had the birthday', () => {
    expect(calculateAge(new Date('1990-07-25'), new Date('2026-07-25'))).toBe(36);
  });
});

describe('findHandicapMultiplier', () => {
  const brackets: HandicapBracketInput[] = [
    { gender: 'MALE', minAge: 0, maxAge: 29, multiplier: 1.0 },
    { gender: 'MALE', minAge: 30, maxAge: 44, multiplier: 1.05 },
    { gender: 'FEMALE', minAge: 0, maxAge: 29, multiplier: 1.05 },
    { gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.2 },
  ];

  it('finds the matching bracket by gender and age', () => {
    expect(findHandicapMultiplier(brackets, 'MALE', 31)).toBe(1.05);
    expect(findHandicapMultiplier(brackets, 'FEMALE', 50)).toBe(1.2);
  });

  it('matches boundary ages inclusively', () => {
    expect(findHandicapMultiplier(brackets, 'MALE', 29)).toBe(1.0);
    expect(findHandicapMultiplier(brackets, 'MALE', 30)).toBe(1.05);
  });

  it('defaults to 1 when no bracket covers the age/gender', () => {
    expect(findHandicapMultiplier(brackets, 'FEMALE', 35)).toBe(1);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm test -- handicap`
Expected: FAIL — `Cannot find module './handicap'`

- [ ] **Step 7: Implement handicap logic**

Create `src/features/scoring/handicap.ts`:
```ts
import { Gender, HandicapBracketInput } from './types';

export function calculateAge(birthdate: Date, asOf: Date): number {
  let age = asOf.getFullYear() - birthdate.getFullYear();
  const hasHadBirthdayThisYear =
    asOf.getMonth() > birthdate.getMonth() ||
    (asOf.getMonth() === birthdate.getMonth() && asOf.getDate() >= birthdate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function findHandicapMultiplier(brackets: HandicapBracketInput[], gender: Gender, age: number): number {
  const match = brackets.find((b) => b.gender === gender && age >= b.minAge && age <= b.maxAge);
  return match?.multiplier ?? 1;
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npm test -- handicap`
Expected: 6 passed

- [ ] **Step 9: Write failing tests for raw score, final score, and full breakdown**

Create `src/features/scoring/score.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeRawScore, computeFinalScore, computeScoreBreakdown } from './score';
import { MeasurementSnapshot, MetricConfigInput, MetricPctChange, HandicapBracketInput } from './types';

describe('computeRawScore', () => {
  it('sums weighted pct changes', () => {
    const changes: MetricPctChange[] = [
      { metricKey: 'WEIGHT', pctChange: 5 },
      { metricKey: 'BODY_FAT_PCT', pctChange: 20 },
    ];
    const configs: MetricConfigInput[] = [
      { metricKey: 'WEIGHT', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
      { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
    ];
    expect(computeRawScore(changes, configs)).toBeCloseTo(5 * 1 + 20 * 1.5, 5);
  });

  it('treats an unconfigured metric as weight 0', () => {
    const changes: MetricPctChange[] = [{ metricKey: 'BMR', pctChange: 10 }];
    expect(computeRawScore(changes, [])).toBe(0);
  });
});

describe('computeFinalScore', () => {
  it('applies the age/gender multiplier with no conditions', () => {
    expect(computeFinalScore(100, 1.1, [])).toBeCloseTo(110, 5);
  });

  it('stacks multiple condition multipliers multiplicatively', () => {
    expect(computeFinalScore(100, 1.1, [1.2, 1.05])).toBeCloseTo(100 * 1.1 * 1.2 * 1.05, 5);
  });
});

describe('computeScoreBreakdown', () => {
  const baseline: MeasurementSnapshot = {
    weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18, visceralFatRating: 10,
    skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: null, bmr: null, metabolicAge: null,
  };
  const current: MeasurementSnapshot = {
    weightKg: 85, bmi: 26, bodyFatPct: 20, subcutaneousFatPct: 16, visceralFatRating: 8,
    skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: null, bmr: null, metabolicAge: null,
  };
  const configs: MetricConfigInput[] = [
    { metricKey: 'WEIGHT', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
    { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
  ];
  const brackets: HandicapBracketInput[] = [{ gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.2 }];

  it('combines metric changes, raw score, handicap, and conditions end-to-end', () => {
    const result = computeScoreBreakdown({
      baseline,
      current,
      configs,
      weightGoal: 'LOSE',
      gender: 'FEMALE',
      age: 50,
      brackets,
      conditionMultipliers: [1.1],
    });

    expect(result.metricChanges).toHaveLength(2);
    expect(result.ageGenderMultiplier).toBe(1.2);
    expect(result.conditionMultipliers).toEqual([1.1]);
    expect(result.finalScore).toBeCloseTo(result.rawScore * 1.2 * 1.1, 5);
  });
});
```

- [ ] **Step 10: Run to verify it fails**

Run: `npm test -- score.test`
Expected: FAIL — `Cannot find module './score'`

- [ ] **Step 11: Implement score computation**

Create `src/features/scoring/score.ts`:
```ts
import { computeMetricChanges } from './metricChanges';
import { calculateAge, findHandicapMultiplier } from './handicap';
import {
  Gender,
  HandicapBracketInput,
  MeasurementSnapshot,
  MetricConfigInput,
  MetricPctChange,
  ScoreBreakdown,
  WeightGoal,
} from './types';

export function computeRawScore(changes: MetricPctChange[], configs: MetricConfigInput[]): number {
  const weightByKey = new Map(configs.map((c) => [c.metricKey, c.weight]));
  return changes.reduce((sum, change) => sum + change.pctChange * (weightByKey.get(change.metricKey) ?? 0), 0);
}

export function computeFinalScore(rawScore: number, ageGenderMultiplier: number, conditionMultipliers: number[]): number {
  const conditionProduct = conditionMultipliers.reduce((product, multiplier) => product * multiplier, 1);
  return rawScore * ageGenderMultiplier * conditionProduct;
}

export function computeScoreBreakdown(params: {
  baseline: MeasurementSnapshot;
  current: MeasurementSnapshot;
  configs: MetricConfigInput[];
  weightGoal: WeightGoal;
  gender: Gender;
  age: number;
  brackets: HandicapBracketInput[];
  conditionMultipliers: number[];
}): ScoreBreakdown {
  const metricChanges = computeMetricChanges(params.baseline, params.current, params.configs, params.weightGoal);
  const rawScore = computeRawScore(metricChanges, params.configs);
  const ageGenderMultiplier = findHandicapMultiplier(params.brackets, params.gender, params.age);
  const finalScore = computeFinalScore(rawScore, ageGenderMultiplier, params.conditionMultipliers);

  return {
    metricChanges,
    rawScore,
    ageGenderMultiplier,
    conditionMultipliers: params.conditionMultipliers,
    finalScore,
  };
}

export { calculateAge };
```

- [ ] **Step 12: Run to verify it passes**

Run: `npm test -- score.test`
Expected: 5 passed

- [ ] **Step 13: Run the full scoring test suite**

Run: `npm test -- src/features/scoring`
Expected: all scoring tests pass (30 total across Tasks 3-4)

- [ ] **Step 14: Commit**

```bash
git add src/features/scoring
git commit -m "Add scoring engine: metric changes, handicap, raw/final score"
```

---

## Task 5: Auth — NextAuth Credentials, Registration, Route Protection

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/register/route.ts`
- Create: `src/features/auth/components/LoginForm.tsx`
- Create: `src/features/auth/components/RegisterForm.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/middleware.ts`
- Create: `src/features/auth/registerUser.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/lib/prisma.ts` (Task 2).
- Produces: `authOptions` (NextAuth config) from `src/lib/auth.ts`, used by GraphQL context in Task 6 to read the session; `registerUser(input): Promise<{id: string}>` service function used by the register route and its test.

- [ ] **Step 1: Write a failing test for the registration service**

Create `src/features/auth/registerUser.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser } from './registerUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn().mockResolvedValue({ id: 'user-1' }),
    },
  },
}));

describe('registerUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hashes the password before storing and returns the new user id', async () => {
    const result = await registerUser({
      displayName: 'Alice',
      password: 'secret123',
      gender: 'FEMALE',
      birthdate: '1990-05-01',
      weightGoal: 'LOSE',
    });

    expect(result.id).toBe('user-1');
    const createArgs = (prisma.user.create as any).mock.calls[0][0];
    expect(createArgs.data.displayName).toBe('Alice');
    expect(createArgs.data.passwordHash).not.toBe('secret123');
    expect(createArgs.data.gender).toBe('FEMALE');
    expect(createArgs.data.weightGoal).toBe('LOSE');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- registerUser`
Expected: FAIL — `Cannot find module './registerUser'`

- [ ] **Step 3: Implement the registration service**

Create `src/features/auth/registerUser.ts`:
```ts
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export interface RegisterUserInput {
  displayName: string;
  password: string;
  gender: 'MALE' | 'FEMALE';
  birthdate: string;
  weightGoal: 'LOSE' | 'GAIN' | 'MAINTAIN';
}

export async function registerUser(input: RegisterUserInput): Promise<{ id: string }> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      displayName: input.displayName,
      passwordHash,
      gender: input.gender,
      birthdate: new Date(input.birthdate),
      weightGoal: input.weightGoal,
    },
  });
  return { id: user.id };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- registerUser`
Expected: 1 passed

- [ ] **Step 5: Configure NextAuth**

Create `src/lib/auth.ts`:
```ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        displayName: { label: 'Display Name', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.displayName || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { displayName: credentials.displayName } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.displayName, isAdmin: user.isAdmin } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
};
```

Create `src/app/api/auth/[...nextauth]/route.ts`:
```ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 6: Create the registration API route**

Create `src/app/api/register/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/features/auth/registerUser';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { displayName, password, gender, birthdate, weightGoal } = body;

  if (!displayName || !password || !gender || !birthdate || !weightGoal) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  try {
    const result = await registerUser({ displayName, password, gender, birthdate, weightGoal });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'That display name is already taken.' }, { status: 409 });
  }
}
```

- [ ] **Step 7: Build the registration form component**

Create `src/features/auth/components/RegisterForm.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Box, TextField, Button, MenuItem, Alert, Stack } from '@mui/material';

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [birthdate, setBirthdate] = useState('');
  const [weightGoal, setWeightGoal] = useState<'LOSE' | 'GAIN' | 'MAINTAIN'>('LOSE');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, password, gender, birthdate, weightGoal }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? 'Registration failed.');
      return;
    }

    const signInResult = await signIn('credentials', { displayName, password, redirect: false });
    if (signInResult?.ok) {
      router.push('/leaderboard');
    } else {
      router.push('/login');
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <TextField select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}>
          <MenuItem value="MALE">Male</MenuItem>
          <MenuItem value="FEMALE">Female</MenuItem>
        </TextField>
        <TextField
          label="Birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} // MUI v6+ moved InputLabelProps to the slots API
          required
        />
        <TextField
          select
          label="Goal"
          value={weightGoal}
          onChange={(e) => setWeightGoal(e.target.value as 'LOSE' | 'GAIN' | 'MAINTAIN')}
        >
          <MenuItem value="LOSE">Lose weight</MenuItem>
          <MenuItem value="GAIN">Gain weight</MenuItem>
          <MenuItem value="MAINTAIN">Maintain weight</MenuItem>
        </TextField>
        <Button type="submit" variant="contained">Create account</Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 8: Build the login form component**

Create `src/features/auth/components/LoginForm.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Box, TextField, Button, Alert, Stack } from '@mui/material';

export function LoginForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const result = await signIn('credentials', { displayName, password, redirect: false });
    if (result?.ok) {
      router.push('/leaderboard');
    } else {
      setError('Invalid display name or password.');
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" variant="contained">Log in</Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 9: Wire up the login and register pages**

Create `src/app/login/page.tsx`:
```tsx
import { Container, Typography } from '@mui/material';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Log in</Typography>
      <LoginForm />
    </Container>
  );
}
```

Create `src/app/register/page.tsx`:
```tsx
import { Container, Typography } from '@mui/material';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Join the Challenge</Typography>
      <RegisterForm />
    </Container>
  );
}
```

- [ ] **Step 10: Add route-protection middleware**

Create `src/middleware.ts`:
```ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ['/leaderboard/:path*', '/measurements/:path*', '/users/:path*', '/admin/:path*'],
};
```

- [ ] **Step 11: Wrap the app in a session provider**

Modify `src/app/layout.tsx` — add a client-side session provider wrapper. Create `src/app/providers.tsx`:
```tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Modify `src/app/layout.tsx`, wrap `{children}` with `<Providers>`:
```tsx
import { Providers } from './providers';
// ...inside body, inside ThemeProvider:
<Providers>{children}</Providers>
```

- [ ] **Step 12: Run the full test suite**

Run: `npm test`
Expected: all tests pass, no failures

- [ ] **Step 13: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth src/app/api/register src/features/auth src/app/login src/app/register src/middleware.ts src/app/providers.tsx src/app/layout.tsx
git commit -m "Add NextAuth credentials auth, registration flow, and route protection"
```

---

## Task 6: GraphQL Server Infrastructure and Codegen

**Files:**
- Create: `src/lib/graphql/context.ts`
- Create: `src/lib/graphql/schema.ts`
- Create: `src/app/api/graphql/route.ts`
- Create: `scripts/generate-schema-sdl.ts` (works around a Windows codegen loader bug — see Step 4)
- Create: `codegen.yml`
- Create: `src/lib/apolloClient.ts`
- Create: `src/features/scoring/graphql/typeDefs.ts` (root placeholder types, extended by later tasks)

**Interfaces:**
- Produces: `GraphQLContext` interface `{ session: Session | null; prisma: PrismaClient }`, `schema` (merged executable schema) — every feature's `graphql/schema.ts` (Tasks 7-13) registers its typeDefs/resolvers into the arrays this file imports.
- Produces: `apolloClient` for use in client components.

- [ ] **Step 1: Define the GraphQL context**

Use the `Session` type imported directly from `next-auth` rather than
`Awaited<ReturnType<typeof getServerSession>>` — with this next-auth version
that inferred type resolves to `{}` due to `getServerSession`'s overloads,
which fails to type-check `context.session?.user` later in this file.

Create `src/lib/graphql/context.ts`:
```ts
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface GraphQLContext {
  session: Session | null;
  prisma: typeof prisma;
}

export async function createContext(): Promise<GraphQLContext> {
  const session = await getServerSession(authOptions);
  return { session, prisma };
}

export function requireUser(context: GraphQLContext): { id: string; isAdmin: boolean } {
  const user = context.session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!user?.id) throw new Error('Not authenticated.');
  return { id: user.id, isAdmin: !!user.isAdmin };
}

export function requireAdmin(context: GraphQLContext): { id: string; isAdmin: boolean } {
  const user = requireUser(context);
  if (!user.isAdmin) throw new Error('Admin access required.');
  return user;
}
```

- [ ] **Step 2: Create a placeholder root schema (extended by later tasks)**

Create `src/features/scoring/graphql/typeDefs.ts`:
```ts
export const rootTypeDefs = `#graphql
  type Query {
    _placeholder: Boolean
  }
  type Mutation {
    _placeholder: Boolean
  }
`;
```

Create `src/lib/graphql/schema.ts`:
```ts
import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { rootTypeDefs } from '@/features/scoring/graphql/typeDefs';

const typeDefs = [rootTypeDefs];
const resolvers = [{ Query: { _placeholder: () => true }, Mutation: { _placeholder: () => true } }];

export const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
});
```

> Note for later tasks: each feature's `graphql/schema.ts` (Measurements, Leaderboard, Users, Admin) exports its own `typeDefs`/`resolvers`; this file's `typeDefs`/`resolvers` arrays get one new entry appended per feature task, and the `_placeholder` fields are removed once real `Query`/`Mutation` fields exist.

- [ ] **Step 3: Wire up the Apollo Server route handler**

`@as-integrations/next`'s `startServerAndCreateNextHandler` returns a function
with an *overloaded* type (one overload for the old Pages API `(req, res)`
shape, one for the App Router `(req)` shape). Next.js 16's route-handler type
validator (`.next/types/validator.ts`) requires an exported `GET`/`POST` whose
type is a plain `(request: NextRequest, context: {...}) => Response |
Promise<Response>` — an overloaded union doesn't structurally match, so
exporting the handler directly fails `next build`'s type check. Wrap it in a
plain async function with an explicit `NextRequest` parameter instead; this
doesn't change runtime behavior, only the exported type shape.

Create `src/app/api/graphql/route.ts`:
```ts
import { NextRequest } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { schema } from '@/lib/graphql/schema';
import { createContext, GraphQLContext } from '@/lib/graphql/context';

const server = new ApolloServer<GraphQLContext>({ schema });

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: createContext,
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
```

- [ ] **Step 4: Configure codegen**

`graphql-code-generator`'s `code-file-loader` tries to `import()` the
`schema:` path directly when it's a `.ts` file. On Windows this fails with
`ERR_UNSUPPORTED_ESM_URL_SCHEME` because the loader passes a raw `C:\...`
path to Node's ESM loader instead of a `file://` URL — Node's dynamic
`import()` requires a proper URL scheme, and Windows absolute paths aren't one.
Work around this by pre-rendering the schema to a plain `.graphql` SDL file
with a small script (which loads the module through Node's normal `import`
inside a running process — that path works fine) and pointing codegen at the
SDL file, which the loader reads as plain text instead of executing.

Create `scripts/generate-schema-sdl.ts`:
```ts
import { writeFileSync } from 'fs';
import { printSchema } from 'graphql';
import { schema } from '../src/lib/graphql/schema';

writeFileSync('schema.graphql', printSchema(schema));
console.log('Wrote schema.graphql');
```

Create `codegen.yml`. Note `ignoreNoDocuments: true` — at this point in the
build no `*.graphql` operation documents exist yet (those start appearing in
Task 8), and without this flag codegen hard-fails on an empty glob match:
```yaml
overwrite: true
ignoreNoDocuments: true
schema: 'schema.graphql'
generates:
  src/lib/graphql/generated/types.ts:
    plugins:
      - typescript
      - typescript-resolvers
  src/lib/graphql/generated/operations.ts:
    documents: 'src/features/**/graphql/*.graphql'
    plugins:
      - typescript
      - typescript-operations
      - typed-document-node
```

Add to `package.json` scripts (note the two-step chain — generate the SDL
file first, then run codegen against it):
```json
{
  "scripts": {
    "codegen": "tsx scripts/generate-schema-sdl.ts && graphql-codegen --config codegen.yml"
  }
}
```

Run: `npm run codegen`
Expected: generates `src/lib/graphql/generated/types.ts` with a `Query`/`Mutation` type containing `_placeholder`. Add `/schema.graphql` and `/src/lib/graphql/generated/` to `.gitignore` (both regenerated via `npm run codegen`, not committed).

- [ ] **Step 5: Set up the Apollo Client for client components**

Apollo Client v4 split React bindings (`ApolloProvider`, `useQuery`,
`useMutation`, `MockedProvider`, ...) out of the main `@apollo/client` entry
point into a `@apollo/client/react` subpath — importing `ApolloProvider` from
`@apollo/client` itself fails with "export doesn't exist" under v4. Every
React-facing Apollo import in this plan (here and in later UI tasks) uses the
`/react` subpath; `ApolloClient`, `InMemoryCache`, and `HttpLink` stay on the
main entry point since those are framework-agnostic core APIs.

Create `src/lib/apolloClient.ts`:
```ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: '/api/graphql' }),
  cache: new InMemoryCache(),
});
```

Modify `src/app/providers.tsx` to also wrap children in `ApolloProvider`:
```tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ApolloProvider } from '@apollo/client/react';
import { ReactNode } from 'react';
import { apolloClient } from '@/lib/apolloClient';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 6: Manually verify the GraphQL endpoint**

Run: `npm run dev` (in background), then in another terminal:
```bash
curl -s -X POST http://localhost:3000/api/graphql -H "Content-Type: application/json" -d "{\"query\":\"{ _placeholder }\"}"
```
Expected: `{"data":{"_placeholder":true}}`. Note the actual port from the dev
server's startup log before curling — Next.js silently falls back to 3001,
3002, etc. if 3000 is already bound by another process (e.g. a dev server left
running from an earlier session). Stop the dev server, and confirm no `next
dev` process is still running in the background afterward — a leaked one will
keep holding its port for the rest of the session.

- [ ] **Step 7: Commit**

```bash
git add src/lib/graphql src/app/api/graphql src/features/scoring/graphql src/lib/apolloClient.ts src/app/providers.tsx scripts/generate-schema-sdl.ts codegen.yml package.json .gitignore
git commit -m "Add GraphQL server infrastructure, context, and codegen config"
```

---

## Task 7: Measurements — GraphQL API and Service

**Files:**
- Create: `src/features/measurements/service.ts`
- Create: `src/features/measurements/service.test.ts`
- Create: `src/features/measurements/graphql/typeDefs.ts`
- Create: `src/features/measurements/graphql/resolvers.ts`
- Modify: `src/lib/graphql/schema.ts` (register measurements typeDefs/resolvers)

**Interfaces:**
- Consumes: `prisma` (Task 2), `requireUser` from `src/lib/graphql/context.ts` (Task 6).
- Produces: `recordMeasurement(userId, challengeId, input): Promise<Measurement>` service function; GraphQL `Mutation.recordMeasurement` and `Query.myMeasurements`, consumed by the UI in Task 8 and the leaderboard/timeline resolvers in Tasks 9 and 11 (which read `Measurement` rows directly via Prisma).

- [ ] **Step 1: Write a failing test for the measurement service**

Create `src/features/measurements/service.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordMeasurement } from './service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    measurement: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('recordMeasurement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks the first measurement for a user/challenge as baseline', async () => {
    (prisma.measurement.count as any).mockResolvedValue(0);
    (prisma.measurement.create as any).mockResolvedValue({ id: 'm1', isBaseline: true });

    await recordMeasurement('user-1', 'challenge-1', { weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18, visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28 });

    const createArgs = (prisma.measurement.create as any).mock.calls[0][0];
    expect(createArgs.data.isBaseline).toBe(true);
  });

  it('does not mark a subsequent measurement as baseline', async () => {
    (prisma.measurement.count as any).mockResolvedValue(1);
    (prisma.measurement.create as any).mockResolvedValue({ id: 'm2', isBaseline: false });

    await recordMeasurement('user-1', 'challenge-1', { weightKg: 88, bmi: 27, bodyFatPct: 23, subcutaneousFatPct: 17, visceralFatRating: 9, skeletalMusclePct: 33, muscleMassKg: 28.5 });

    const createArgs = (prisma.measurement.create as any).mock.calls[0][0];
    expect(createArgs.data.isBaseline).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- features/measurements/service`
Expected: FAIL — `Cannot find module './service'`

- [ ] **Step 3: Implement the measurement service**

Create `src/features/measurements/service.ts`:
```ts
import { prisma } from '@/lib/prisma';

export interface RecordMeasurementInput {
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  subcutaneousFatPct: number;
  visceralFatRating: number;
  skeletalMusclePct: number;
  muscleMassKg: number;
  proteinPct?: number;
  bmr?: number;
  metabolicAge?: number;
}

export async function recordMeasurement(userId: string, challengeId: string, input: RecordMeasurementInput) {
  const existingCount = await prisma.measurement.count({ where: { userId, challengeId } });
  return prisma.measurement.create({
    data: {
      userId,
      challengeId,
      ...input,
      isBaseline: existingCount === 0,
    },
  });
}

export async function listMeasurementsForUser(userId: string, challengeId: string) {
  return prisma.measurement.findMany({
    where: { userId, challengeId },
    orderBy: { recordedAt: 'asc' },
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- features/measurements/service`
Expected: 2 passed

- [ ] **Step 5: Define the GraphQL schema for measurements**

Create `src/features/measurements/graphql/typeDefs.ts`:
```ts
export const typeDefs = `#graphql
  type Measurement {
    id: ID!
    recordedAt: String!
    weightKg: Float!
    bmi: Float!
    bodyFatPct: Float!
    subcutaneousFatPct: Float!
    visceralFatRating: Float!
    skeletalMusclePct: Float!
    muscleMassKg: Float!
    proteinPct: Float
    bmr: Float
    metabolicAge: Int
    isBaseline: Boolean!
  }

  input RecordMeasurementInput {
    weightKg: Float!
    bmi: Float!
    bodyFatPct: Float!
    subcutaneousFatPct: Float!
    visceralFatRating: Float!
    skeletalMusclePct: Float!
    muscleMassKg: Float!
    proteinPct: Float
    bmr: Float
    metabolicAge: Int
  }

  extend type Query {
    myMeasurements: [Measurement!]!
  }

  extend type Mutation {
    recordMeasurement(input: RecordMeasurementInput!): Measurement!
  }
`;
```

- [ ] **Step 6: Implement the resolvers**

Create `src/features/measurements/graphql/resolvers.ts`:
```ts
import { GraphQLContext, requireUser } from '@/lib/graphql/context';
import { recordMeasurement, listMeasurementsForUser } from '../service';

export const resolvers = {
  Query: {
    myMeasurements: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);
      const challenge = await context.prisma.challenge.findFirst({ where: { isActive: true } });
      if (!challenge) return [];
      return listMeasurementsForUser(user.id, challenge.id);
    },
  },
  Mutation: {
    recordMeasurement: async (_parent: unknown, args: { input: any }, context: GraphQLContext) => {
      const user = requireUser(context);
      const challenge = await context.prisma.challenge.findFirst({ where: { isActive: true } });
      if (!challenge) throw new Error('No active challenge.');
      return recordMeasurement(user.id, challenge.id, args.input);
    },
  },
};
```

- [ ] **Step 7: Register measurements schema in the merged schema**

Modify `src/lib/graphql/schema.ts`:
```ts
import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { rootTypeDefs } from '@/features/scoring/graphql/typeDefs';
import { typeDefs as measurementsTypeDefs } from '@/features/measurements/graphql/typeDefs';
import { resolvers as measurementsResolvers } from '@/features/measurements/graphql/resolvers';

const typeDefs = [rootTypeDefs, measurementsTypeDefs];
const resolvers = [
  { Query: { _placeholder: () => true }, Mutation: { _placeholder: () => true } },
  measurementsResolvers,
];

export const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs(typeDefs),
  resolvers: mergeResolvers(resolvers),
});
```

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all tests pass, no failures

- [ ] **Step 9: Commit**

```bash
git add src/features/measurements src/lib/graphql/schema.ts
git commit -m "Add measurements GraphQL API and recording service"
```

---

## Task 8: Measurements — Recording UI

**Files:**
- Create: `src/features/measurements/graphql/operations.graphql`
- Create: `src/features/measurements/components/MeasurementForm.tsx`
- Create: `src/features/measurements/components/MeasurementForm.test.tsx`
- Create: `src/app/measurements/new/page.tsx`

**Interfaces:**
- Consumes: `recordMeasurement` GraphQL mutation from Task 7.
- Produces: `<MeasurementForm />` component, rendered at `/measurements/new`.

- [ ] **Step 1: Define the GraphQL operation document**

Create `src/features/measurements/graphql/operations.graphql`:
```graphql
mutation RecordMeasurement($input: RecordMeasurementInput!) {
  recordMeasurement(input: $input) {
    id
    recordedAt
    isBaseline
  }
}
```

- [ ] **Step 2: Write a failing test for the form**

`MockedProvider` is a React-specific testing helper, so under Apollo Client
v4's core/react split (see Task 6) it lives at `@apollo/client/testing/react`,
not `@apollo/client/testing`.

Create `src/features/measurements/components/MeasurementForm.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MeasurementForm, RECORD_MEASUREMENT } from './MeasurementForm';

describe('MeasurementForm', () => {
  it('renders required fields and an optional-fields toggle', () => {
    render(
      <MockedProvider mocks={[]}>
        <MeasurementForm onSaved={() => {}} />
      </MockedProvider>
    );
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/body fat/i)).toBeInTheDocument();
    expect(screen.getByText(/optional fields/i)).toBeInTheDocument();
  });

  it('submits the mutation with entered values', async () => {
    const onSaved = vi.fn();
    const mocks = [
      {
        request: {
          query: RECORD_MEASUREMENT,
          variables: {
            input: {
              weightKg: 85,
              bmi: 26,
              bodyFatPct: 20,
              subcutaneousFatPct: 16,
              visceralFatRating: 8,
              skeletalMusclePct: 34,
              muscleMassKg: 29,
              proteinPct: null,
              bmr: null,
              metabolicAge: null,
            },
          },
        },
        result: { data: { recordMeasurement: { id: 'm1', recordedAt: '2026-07-25', isBaseline: false } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MeasurementForm onSaved={onSaved} />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText(/^bmi/i), { target: { value: '26' } });
    fireEvent.change(screen.getByLabelText(/body fat/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/subcutaneous/i), { target: { value: '16' } });
    fireEvent.change(screen.getByLabelText(/visceral/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/skeletal muscle/i), { target: { value: '34' } });
    fireEvent.change(screen.getByLabelText(/muscle mass/i), { target: { value: '29' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // A bare `setTimeout(resolve, 0)` is flaky here — MockedProvider resolves
    // its mocked response and triggers the component's state update on a
    // microtask schedule that isn't guaranteed to have flushed after one
    // macrotask tick. `waitFor` polls until the assertion passes instead.
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- MeasurementForm`
Expected: FAIL — `Cannot find module './MeasurementForm'`

- [ ] **Step 4: Implement the form**

`gql` stays on the main `@apollo/client` entry point (it's re-exported from
`graphql-tag`, not React-specific), but `useMutation` moved to
`@apollo/client/react` — same core/react split as `MockedProvider` above.

Create `src/features/measurements/components/MeasurementForm.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { Box, TextField, Button, Stack, Collapse, Link } from '@mui/material';

export const RECORD_MEASUREMENT = gql`
  mutation RecordMeasurement($input: RecordMeasurementInput!) {
    recordMeasurement(input: $input) {
      id
      recordedAt
      isBaseline
    }
  }
`;

interface FormState {
  weightKg: string;
  bmi: string;
  bodyFatPct: string;
  subcutaneousFatPct: string;
  visceralFatRating: string;
  skeletalMusclePct: string;
  muscleMassKg: string;
  proteinPct: string;
  bmr: string;
  metabolicAge: string;
}

const emptyForm: FormState = {
  weightKg: '', bmi: '', bodyFatPct: '', subcutaneousFatPct: '', visceralFatRating: '',
  skeletalMusclePct: '', muscleMassKg: '', proteinPct: '', bmr: '', metabolicAge: '',
};

export function MeasurementForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showOptional, setShowOptional] = useState(false);
  const [recordMeasurement] = useMutation(RECORD_MEASUREMENT);

  function setField(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await recordMeasurement({
      variables: {
        input: {
          weightKg: Number(form.weightKg),
          bmi: Number(form.bmi),
          bodyFatPct: Number(form.bodyFatPct),
          subcutaneousFatPct: Number(form.subcutaneousFatPct),
          visceralFatRating: Number(form.visceralFatRating),
          skeletalMusclePct: Number(form.skeletalMusclePct),
          muscleMassKg: Number(form.muscleMassKg),
          proteinPct: form.proteinPct ? Number(form.proteinPct) : null,
          bmr: form.bmr ? Number(form.bmr) : null,
          metabolicAge: form.metabolicAge ? Number(form.metabolicAge) : null,
        },
      },
    });
    onSaved();
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField label="Weight (kg)" type="number" value={form.weightKg} onChange={setField('weightKg')} required />
        <TextField label="BMI" type="number" value={form.bmi} onChange={setField('bmi')} required />
        <TextField label="Body Fat %" type="number" value={form.bodyFatPct} onChange={setField('bodyFatPct')} required />
        <TextField label="Subcutaneous Fat %" type="number" value={form.subcutaneousFatPct} onChange={setField('subcutaneousFatPct')} required />
        <TextField label="Visceral Fat Rating" type="number" value={form.visceralFatRating} onChange={setField('visceralFatRating')} required />
        <TextField label="Skeletal Muscle %" type="number" value={form.skeletalMusclePct} onChange={setField('skeletalMusclePct')} required />
        <TextField label="Muscle Mass (kg)" type="number" value={form.muscleMassKg} onChange={setField('muscleMassKg')} required />

        <Link component="button" type="button" onClick={() => setShowOptional(!showOptional)}>
          {showOptional ? 'Hide' : 'Show'} optional fields
        </Link>
        <Collapse in={showOptional}>
          <Stack spacing={2}>
            <TextField label="Protein %" type="number" value={form.proteinPct} onChange={setField('proteinPct')} />
            <TextField label="BMR" type="number" value={form.bmr} onChange={setField('bmr')} />
            <TextField label="Metabolic Age" type="number" value={form.metabolicAge} onChange={setField('metabolicAge')} />
          </Stack>
        </Collapse>

        <Button type="submit" variant="contained">Save Measurement</Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- MeasurementForm`
Expected: 2 passed

- [ ] **Step 6: Wire up the page**

Create `src/app/measurements/new/page.tsx`:
```tsx
'use client';

import { Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MeasurementForm } from '@/features/measurements/components/MeasurementForm';

export default function NewMeasurementPage() {
  const router = useRouter();
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Record a Measurement</Typography>
      <MeasurementForm onSaved={() => router.push('/leaderboard')} />
    </Container>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/features/measurements/graphql/operations.graphql src/features/measurements/components src/app/measurements
git commit -m "Add measurement recording UI"
```

---

## Task 9: Leaderboard — GraphQL API

**Files:**
- Create: `src/features/leaderboard/service.ts`
- Create: `src/features/leaderboard/service.test.ts`
- Create: `src/features/leaderboard/graphql/typeDefs.ts`
- Create: `src/features/leaderboard/graphql/resolvers.ts`
- Modify: `src/lib/graphql/schema.ts`

**Interfaces:**
- Consumes: `computeScoreBreakdown`, `calculateAge` from `src/features/scoring/score.ts` (Task 4); `prisma` (Task 2).
- Produces: `getLeaderboard(filters): Promise<LeaderboardRow[]>` service, `Query.leaderboard` GraphQL field consumed by the UI in Task 10.

- [ ] **Step 1: Write a failing test for the leaderboard service**

Create `src/features/leaderboard/service.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLeaderboard } from './service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    challenge: { findFirst: vi.fn() },
    metricConfig: { findMany: vi.fn() },
    handicapBracket: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

const baseUser = {
  id: 'u1',
  displayName: 'Alice',
  gender: 'FEMALE' as const,
  birthdate: new Date('1990-01-01'),
  weightGoal: 'LOSE' as const,
  conditions: [],
  measurements: [
    { isBaseline: true, weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18, visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: null, bmr: null, metabolicAge: null },
    { isBaseline: false, weightKg: 85, bmi: 26, bodyFatPct: 20, subcutaneousFatPct: 16, visceralFatRating: 8, skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: null, bmr: null, metabolicAge: null },
  ],
};

describe('getLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.challenge.findFirst as any).mockResolvedValue({ id: 'c1' });
    (prisma.metricConfig.findMany as any).mockResolvedValue([
      { metricKey: 'WEIGHT', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
      { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
    ]);
    (prisma.handicapBracket.findMany as any).mockResolvedValue([
      { gender: 'FEMALE', minAge: 30, maxAge: 44, multiplier: 1.1 },
    ]);
  });

  it('ranks users by final score descending', async () => {
    (prisma.user.findMany as any).mockResolvedValue([baseUser]);
    const rows = await getLeaderboard({});
    expect(rows).toHaveLength(1);
    expect(rows[0].displayName).toBe('Alice');
    expect(rows[0].rank).toBe(1);
    expect(rows[0].finalScore).toBeGreaterThan(0);
  });

  it('excludes users with only a baseline measurement (no progress yet)', async () => {
    const onlyBaseline = { ...baseUser, measurements: [baseUser.measurements[0]] };
    (prisma.user.findMany as any).mockResolvedValue([onlyBaseline]);
    const rows = await getLeaderboard({});
    expect(rows).toHaveLength(0);
  });

  it('filters by gender', async () => {
    (prisma.user.findMany as any).mockResolvedValue([baseUser]);
    await getLeaderboard({ gender: 'FEMALE' });
    const whereArg = (prisma.user.findMany as any).mock.calls[0][0].where;
    expect(whereArg.gender).toBe('FEMALE');
  });

  it('filters by age bracket, excluding users outside the range', async () => {
    const olderUser = { ...baseUser, id: 'u2', displayName: 'Old Alice', birthdate: new Date('1950-01-01') };
    (prisma.user.findMany as any).mockResolvedValue([baseUser, olderUser]);
    const rows = await getLeaderboard({ minAge: 30, maxAge: 44 }, new Date('2026-07-25'));
    expect(rows.map((r) => r.displayName)).toEqual(['Alice']);
  });

  it('ranks by a single metric, unhandicapped, when metricKey is provided', async () => {
    const other = {
      ...baseUser,
      id: 'u2',
      displayName: 'Slower Bob',
      measurements: [
        { ...baseUser.measurements[0] },
        { ...baseUser.measurements[1], bodyFatPct: 24 }, // smaller fat-% improvement than Alice
      ],
    };
    (prisma.user.findMany as any).mockResolvedValue([baseUser, other]);
    const rows = await getLeaderboard({ metricKey: 'BODY_FAT_PCT' });
    expect(rows[0].displayName).toBe('Alice');
    expect(rows[0]).toHaveProperty('metricPctChange');
    expect(rows[0].finalScore).toBe(rows[0].rawScore); // unhandicapped per spec §7
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- features/leaderboard/service`
Expected: FAIL — `Cannot find module './service'`

- [ ] **Step 3: Implement the leaderboard service**

Create `src/features/leaderboard/service.ts`:
```ts
import { prisma } from '@/lib/prisma';
import { computeScoreBreakdown, calculateAge } from '@/features/scoring/score';
import { computeMetricChanges } from '@/features/scoring/metricChanges';
import { Gender, MetricKey } from '@/features/scoring/types';

export interface LeaderboardFilters {
  gender?: Gender;
  scoreType?: 'RAW' | 'FINAL';
  minAge?: number;
  maxAge?: number;
  /** When set, ranks by this single metric's unhandicapped % change instead of the combined score (spec §7). */
  metricKey?: MetricKey;
}

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  rank: number;
  rawScore: number;
  finalScore: number;
  /** Present only when filters.metricKey is set. */
  metricPctChange?: number;
}

export async function getLeaderboard(filters: LeaderboardFilters, asOf: Date = new Date()): Promise<LeaderboardRow[]> {
  const challenge = await prisma.challenge.findFirst({ where: { isActive: true } });
  if (!challenge) return [];

  const [configs, brackets] = await Promise.all([
    prisma.metricConfig.findMany({ where: { OR: [{ challengeId: null }, { challengeId: challenge.id }] } }),
    prisma.handicapBracket.findMany(),
  ]);

  const users = await prisma.user.findMany({
    where: filters.gender ? { gender: filters.gender } : {},
    include: {
      conditions: { include: { condition: true } },
      measurements: { where: { challengeId: challenge.id } },
    },
  });

  const configInputs = configs.map((c) => ({
    metricKey: c.metricKey,
    weight: c.weight,
    directionType: c.directionType,
    fixedDirection: c.fixedDirection,
  }));

  const rows: LeaderboardRow[] = [];

  for (const user of users) {
    const age = calculateAge(user.birthdate, asOf);
    if (filters.minAge !== undefined && age < filters.minAge) continue;
    if (filters.maxAge !== undefined && age > filters.maxAge) continue;

    const baseline = user.measurements.find((m) => m.isBaseline);
    const latest = user.measurements
      .filter((m) => !m.isBaseline)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
    if (!baseline || !latest) continue;

    if (filters.metricKey) {
      // Per-metric leaderboard: single metric, unhandicapped, per spec §7.
      const changes = computeMetricChanges(baseline, latest, configInputs, user.weightGoal);
      const change = changes.find((c) => c.metricKey === filters.metricKey);
      if (!change) continue;
      rows.push({
        userId: user.id,
        displayName: user.displayName,
        rank: 0,
        rawScore: change.pctChange,
        finalScore: change.pctChange,
        metricPctChange: change.pctChange,
      });
      continue;
    }

    const breakdown = computeScoreBreakdown({
      baseline,
      current: latest,
      configs: configInputs,
      weightGoal: user.weightGoal,
      gender: user.gender,
      age,
      brackets,
      conditionMultipliers: user.conditions.map((uc) => uc.condition.multiplier),
    });

    rows.push({
      userId: user.id,
      displayName: user.displayName,
      rank: 0,
      rawScore: breakdown.rawScore,
      finalScore: breakdown.finalScore,
    });
  }

  const scoreKey = filters.scoreType === 'RAW' ? 'rawScore' : 'finalScore';
  rows.sort((a, b) => b[scoreKey] - a[scoreKey]);
  rows.forEach((row, index) => { row.rank = index + 1; });

  return rows;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- features/leaderboard/service`
Expected: 5 passed

- [ ] **Step 5: Define the GraphQL schema for leaderboard**

Create `src/features/leaderboard/graphql/typeDefs.ts`:
```ts
export const typeDefs = `#graphql
  enum Gender {
    MALE
    FEMALE
  }

  enum ScoreType {
    RAW
    FINAL
  }

  type LeaderboardRow {
    userId: ID!
    displayName: String!
    rank: Int!
    rawScore: Float!
    finalScore: Float!
    metricPctChange: Float
  }

  extend type Query {
    leaderboard(
      gender: Gender
      scoreType: ScoreType
      minAge: Int
      maxAge: Int
      metricKey: String
    ): [LeaderboardRow!]!
  }
`;
```

- [ ] **Step 6: Implement the resolver**

Create `src/features/leaderboard/graphql/resolvers.ts`:
```ts
import { GraphQLContext, requireUser } from '@/lib/graphql/context';
import { getLeaderboard } from '../service';
import { MetricKey } from '@/features/scoring/types';

export const resolvers = {
  Query: {
    leaderboard: async (
      _parent: unknown,
      args: {
        gender?: 'MALE' | 'FEMALE';
        scoreType?: 'RAW' | 'FINAL';
        minAge?: number;
        maxAge?: number;
        metricKey?: MetricKey;
      },
      context: GraphQLContext
    ) => {
      requireUser(context);
      return getLeaderboard({
        gender: args.gender,
        scoreType: args.scoreType,
        minAge: args.minAge,
        maxAge: args.maxAge,
        metricKey: args.metricKey,
      });
    },
  },
};
```

- [ ] **Step 7: Register in the merged schema**

Modify `src/lib/graphql/schema.ts` — add `leaderboardTypeDefs`/`leaderboardResolvers` to the arrays following the same pattern as Task 7's Step 7.

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all tests pass, no failures

- [ ] **Step 9: Commit**

```bash
git add src/features/leaderboard/service.ts src/features/leaderboard/service.test.ts src/features/leaderboard/graphql src/lib/graphql/schema.ts
git commit -m "Add leaderboard GraphQL API with gender and score-type filters"
```

---

## Task 10: Leaderboard — UI

**Files:**
- Create: `src/features/leaderboard/graphql/operations.graphql`
- Create: `src/features/leaderboard/components/LeaderboardTable.tsx`
- Create: `src/features/leaderboard/components/LeaderboardFilters.tsx`
- Create: `src/features/leaderboard/components/LeaderboardTable.test.tsx`
- Create: `src/app/leaderboard/page.tsx`

**Interfaces:**
- Consumes: `leaderboard` GraphQL query from Task 9.
- Produces: `<LeaderboardTable />`, `<LeaderboardFilters />`, rendered at `/leaderboard` (the app's landing page after login).

- [ ] **Step 1: Define the GraphQL operation**

Create `src/features/leaderboard/graphql/operations.graphql`:
```graphql
query Leaderboard($gender: Gender, $scoreType: ScoreType, $minAge: Int, $maxAge: Int, $metricKey: String) {
  leaderboard(gender: $gender, scoreType: $scoreType, minAge: $minAge, maxAge: $maxAge, metricKey: $metricKey) {
    userId
    displayName
    rank
    rawScore
    finalScore
    metricPctChange
  }
}
```

- [ ] **Step 2: Write a failing test for the table**

Create `src/features/leaderboard/components/LeaderboardTable.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardTable } from './LeaderboardTable';

describe('LeaderboardTable', () => {
  it('renders rows ranked and shows the correct score type', () => {
    render(
      <LeaderboardTable
        rows={[
          { userId: '1', displayName: 'Alice', rank: 1, rawScore: 30, finalScore: 33 },
          { userId: '2', displayName: 'Bob', rank: 2, rawScore: 20, finalScore: 20 },
        ]}
        scoreType="FINAL"
        isPerMetric={false}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('33.00')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the unhandicapped metric %% change column in per-metric mode', () => {
    render(
      <LeaderboardTable
        rows={[{ userId: '1', displayName: 'Alice', rank: 1, rawScore: 12.5, finalScore: 12.5, metricPctChange: 12.5 }]}
        scoreType="FINAL"
        isPerMetric
      />
    );
    expect(screen.getByText('12.50%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- LeaderboardTable`
Expected: FAIL — `Cannot find module './LeaderboardTable'`

- [ ] **Step 4: Implement the table component**

Create `src/features/leaderboard/components/LeaderboardTable.tsx`:
```tsx
import { Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

export interface LeaderboardRowData {
  userId: string;
  displayName: string;
  rank: number;
  rawScore: number;
  finalScore: number;
  metricPctChange?: number;
}

export function LeaderboardTable({
  rows,
  scoreType,
  isPerMetric,
}: {
  rows: LeaderboardRowData[];
  scoreType: 'RAW' | 'FINAL';
  isPerMetric: boolean;
}) {
  return (
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">{isPerMetric ? '% Improvement' : 'Score'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.userId}>
              <TableCell>{row.rank}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell align="right">
                {isPerMetric
                  ? `${(row.metricPctChange ?? 0).toFixed(2)}%`
                  : (scoreType === 'RAW' ? row.rawScore : row.finalScore).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- LeaderboardTable`
Expected: 2 passed

- [ ] **Step 6: Build the filters component**

Create `src/features/leaderboard/components/LeaderboardFilters.tsx`:
```tsx
import { ToggleButtonGroup, ToggleButton, Stack, TextField, MenuItem } from '@mui/material';

export type AgeBracketOption = 'ALL' | '0-29' | '30-44' | '45-120';

export const METRIC_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'COMBINED', label: 'Combined Score' },
  { value: 'WEIGHT', label: 'Weight' },
  { value: 'BMI', label: 'BMI' },
  { value: 'BODY_FAT_PCT', label: 'Body Fat %' },
  { value: 'SUBCUTANEOUS_FAT_PCT', label: 'Subcutaneous Fat %' },
  { value: 'VISCERAL_FAT_RATING', label: 'Visceral Fat Rating' },
  { value: 'SKELETAL_MUSCLE_PCT', label: 'Skeletal Muscle %' },
  { value: 'MUSCLE_MASS_KG', label: 'Muscle Mass' },
  { value: 'PROTEIN_PCT', label: 'Protein %' },
  { value: 'BMR', label: 'BMR' },
  { value: 'METABOLIC_AGE', label: 'Metabolic Age' },
];

export interface LeaderboardFilterState {
  gender: 'ALL' | 'MALE' | 'FEMALE';
  scoreType: 'RAW' | 'FINAL';
  ageBracket: AgeBracketOption;
  metricKey: string; // 'COMBINED' or a MetricKey
}

const AGE_BRACKET_RANGES: Record<Exclude<AgeBracketOption, 'ALL'>, { minAge: number; maxAge: number }> = {
  '0-29': { minAge: 0, maxAge: 29 },
  '30-44': { minAge: 30, maxAge: 44 },
  '45-120': { minAge: 45, maxAge: 120 },
};

export function ageBracketToRange(bracket: AgeBracketOption): { minAge?: number; maxAge?: number } {
  if (bracket === 'ALL') return {};
  return AGE_BRACKET_RANGES[bracket];
}

export function LeaderboardFilters({
  value,
  onChange,
}: {
  value: LeaderboardFilterState;
  onChange: (value: LeaderboardFilterState) => void;
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
      <ToggleButtonGroup
        exclusive
        value={value.gender}
        onChange={(_e, gender) => gender && onChange({ ...value, gender })}
      >
        <ToggleButton value="ALL">Everyone</ToggleButton>
        <ToggleButton value="MALE">Men</ToggleButton>
        <ToggleButton value="FEMALE">Women</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        exclusive
        value={value.scoreType}
        onChange={(_e, scoreType) => scoreType && onChange({ ...value, scoreType })}
      >
        <ToggleButton value="FINAL">Handicapped</ToggleButton>
        <ToggleButton value="RAW">Raw</ToggleButton>
      </ToggleButtonGroup>
      <TextField
        select
        label="Age Bracket"
        size="small"
        value={value.ageBracket}
        onChange={(e) => onChange({ ...value, ageBracket: e.target.value as AgeBracketOption })}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="ALL">All Ages</MenuItem>
        <MenuItem value="0-29">0-29</MenuItem>
        <MenuItem value="30-44">30-44</MenuItem>
        <MenuItem value="45-120">45+</MenuItem>
      </TextField>
      <TextField
        select
        label="Rank By"
        size="small"
        value={value.metricKey}
        onChange={(e) => onChange({ ...value, metricKey: e.target.value })}
        sx={{ minWidth: 180 }}
      >
        {METRIC_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
```

- [ ] **Step 7: Wire up the leaderboard page**

Create `src/app/leaderboard/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Container, Typography, CircularProgress, Button } from '@mui/material';
import Link from 'next/link';
import { LeaderboardTable } from '@/features/leaderboard/components/LeaderboardTable';
import { LeaderboardFilters, LeaderboardFilterState, ageBracketToRange } from '@/features/leaderboard/components/LeaderboardFilters';

const LEADERBOARD_QUERY = gql`
  query Leaderboard($gender: Gender, $scoreType: ScoreType, $minAge: Int, $maxAge: Int, $metricKey: String) {
    leaderboard(gender: $gender, scoreType: $scoreType, minAge: $minAge, maxAge: $maxAge, metricKey: $metricKey) {
      userId
      displayName
      rank
      rawScore
      finalScore
      metricPctChange
    }
  }
`;

export default function LeaderboardPage() {
  const [filters, setFilters] = useState<LeaderboardFilterState>({
    gender: 'ALL',
    scoreType: 'FINAL',
    ageBracket: 'ALL',
    metricKey: 'COMBINED',
  });
  const { minAge, maxAge } = ageBracketToRange(filters.ageBracket);
  const { data, loading } = useQuery(LEADERBOARD_QUERY, {
    variables: {
      gender: filters.gender === 'ALL' ? null : filters.gender,
      scoreType: filters.scoreType,
      minAge: minAge ?? null,
      maxAge: maxAge ?? null,
      metricKey: filters.metricKey === 'COMBINED' ? null : filters.metricKey,
    },
  });

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Leaderboard</Typography>
      <Button component={Link} href="/measurements/new" variant="contained" sx={{ mb: 2 }}>
        Record a Measurement
      </Button>
      <LeaderboardFilters value={filters} onChange={setFilters} />
      {loading ? (
        <CircularProgress />
      ) : (
        <LeaderboardTable
          rows={data?.leaderboard ?? []}
          scoreType={filters.scoreType}
          isPerMetric={filters.metricKey !== 'COMBINED'}
        />
      )}
    </Container>
  );
}
```

- [ ] **Step 8: Point the root page at the leaderboard**

Modify `src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/leaderboard');
}
```

- [ ] **Step 9: Commit**

```bash
git add src/features/leaderboard/graphql/operations.graphql src/features/leaderboard/components src/app/leaderboard src/app/page.tsx
git commit -m "Add leaderboard UI with gender and score-type filters"
```

---

## Task 11: User Detail — Timeline and Score Breakdown API

**Files:**
- Create: `src/features/users/service.ts`
- Create: `src/features/users/service.test.ts`
- Create: `src/features/users/graphql/typeDefs.ts`
- Create: `src/features/users/graphql/resolvers.ts`
- Modify: `src/lib/graphql/schema.ts`

**Interfaces:**
- Consumes: `computeMetricChanges`, `computeScoreBreakdown`, `calculateAge` (Task 4); `prisma` (Task 2).
- Produces: `getUserTimeline(userId): Promise<TimelinePoint[]>`, `getUserScoreBreakdown(userId): Promise<ScoreBreakdown | null>`, GraphQL `Query.userDetail`, consumed by Task 12's UI.

- [ ] **Step 1: Write a failing test for the timeline service**

Create `src/features/users/service.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserTimeline } from './service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    challenge: { findFirst: vi.fn() },
    metricConfig: { findMany: vi.fn() },
    measurement: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

describe('getUserTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.challenge.findFirst as any).mockResolvedValue({ id: 'c1', startDate: new Date('2026-01-01') });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', weightGoal: 'LOSE' });
    (prisma.metricConfig.findMany as any).mockResolvedValue([
      { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
    ]);
  });

  it('produces one timeline point per non-baseline snapshot', async () => {
    (prisma.measurement.findMany as any).mockResolvedValue([
      { recordedAt: new Date('2026-01-01'), isBaseline: true, bodyFatPct: 25, weightKg: 90, bmi: 28, subcutaneousFatPct: 18, visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: null, bmr: null, metabolicAge: null },
      { recordedAt: new Date('2026-02-01'), isBaseline: false, bodyFatPct: 22, weightKg: 88, bmi: 27, subcutaneousFatPct: 17, visceralFatRating: 9, skeletalMusclePct: 33, muscleMassKg: 28.5, proteinPct: null, bmr: null, metabolicAge: null },
      { recordedAt: new Date('2026-03-01'), isBaseline: false, bodyFatPct: 20, weightKg: 85, bmi: 26, subcutaneousFatPct: 16, visceralFatRating: 8, skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: null, bmr: null, metabolicAge: null },
    ]);

    const timeline = await getUserTimeline('u1');
    expect(timeline).toHaveLength(2);
    expect(timeline[0].metricChanges.find((c) => c.metricKey === 'BODY_FAT_PCT')?.pctChange).toBeCloseTo(12, 3);
    expect(timeline[1].metricChanges.find((c) => c.metricKey === 'BODY_FAT_PCT')?.pctChange).toBeCloseTo(20, 3);
  });

  it('returns an empty timeline when there is no baseline yet', async () => {
    (prisma.measurement.findMany as any).mockResolvedValue([]);
    const timeline = await getUserTimeline('u1');
    expect(timeline).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- features/users/service`
Expected: FAIL — `Cannot find module './service'`

- [ ] **Step 3: Implement the timeline service**

Create `src/features/users/service.ts`:
```ts
import { prisma } from '@/lib/prisma';
import { computeMetricChanges } from '@/features/scoring/metricChanges';
import { computeScoreBreakdown, calculateAge } from '@/features/scoring/score';
import { MetricPctChange } from '@/features/scoring/types';

export interface TimelinePoint {
  recordedAt: Date;
  metricChanges: MetricPctChange[];
}

export async function getUserTimeline(userId: string): Promise<TimelinePoint[]> {
  const challenge = await prisma.challenge.findFirst({ where: { isActive: true } });
  if (!challenge) return [];

  const [user, configs, measurements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.metricConfig.findMany({ where: { OR: [{ challengeId: null }, { challengeId: challenge.id }] } }),
    prisma.measurement.findMany({ where: { userId, challengeId: challenge.id }, orderBy: { recordedAt: 'asc' } }),
  ]);
  if (!user) return [];

  const baseline = measurements.find((m) => m.isBaseline);
  if (!baseline) return [];

  const configInputs = configs.map((c) => ({
    metricKey: c.metricKey,
    weight: c.weight,
    directionType: c.directionType,
    fixedDirection: c.fixedDirection,
  }));

  return measurements
    .filter((m) => !m.isBaseline)
    .map((snapshot) => ({
      recordedAt: snapshot.recordedAt,
      metricChanges: computeMetricChanges(baseline, snapshot, configInputs, user.weightGoal),
    }));
}

export async function getUserScoreBreakdown(userId: string) {
  const challenge = await prisma.challenge.findFirst({ where: { isActive: true } });
  if (!challenge) return null;

  const [user, configs, brackets, measurements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { conditions: { include: { condition: true } } } }),
    prisma.metricConfig.findMany({ where: { OR: [{ challengeId: null }, { challengeId: challenge.id }] } }),
    prisma.handicapBracket.findMany(),
    prisma.measurement.findMany({ where: { userId, challengeId: challenge.id }, orderBy: { recordedAt: 'asc' } }),
  ]);
  if (!user) return null;

  const baseline = measurements.find((m) => m.isBaseline);
  const latest = measurements.filter((m) => !m.isBaseline).slice(-1)[0];
  if (!baseline || !latest) return null;

  return computeScoreBreakdown({
    baseline,
    current: latest,
    configs: configs.map((c) => ({
      metricKey: c.metricKey,
      weight: c.weight,
      directionType: c.directionType,
      fixedDirection: c.fixedDirection,
    })),
    weightGoal: user.weightGoal,
    gender: user.gender,
    age: calculateAge(user.birthdate, challenge.startDate),
    brackets,
    conditionMultipliers: user.conditions.map((uc) => uc.condition.multiplier),
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- features/users/service`
Expected: 2 passed

- [ ] **Step 5: Define the GraphQL schema**

Create `src/features/users/graphql/typeDefs.ts`:
```ts
export const typeDefs = `#graphql
  type MetricChange {
    metricKey: String!
    pctChange: Float!
  }

  type TimelinePoint {
    recordedAt: String!
    metricChanges: [MetricChange!]!
  }

  type ScoreBreakdown {
    metricChanges: [MetricChange!]!
    rawScore: Float!
    ageGenderMultiplier: Float!
    conditionMultipliers: [Float!]!
    finalScore: Float!
  }

  type UserDetail {
    userId: ID!
    displayName: String!
    timeline: [TimelinePoint!]!
    scoreBreakdown: ScoreBreakdown
  }

  extend type Query {
    userDetail(userId: ID!): UserDetail
  }
`;
```

- [ ] **Step 6: Implement the resolver**

Create `src/features/users/graphql/resolvers.ts`:
```ts
import { GraphQLContext, requireUser } from '@/lib/graphql/context';
import { getUserTimeline, getUserScoreBreakdown } from '../service';

export const resolvers = {
  Query: {
    userDetail: async (_parent: unknown, args: { userId: string }, context: GraphQLContext) => {
      requireUser(context);
      const user = await context.prisma.user.findUnique({ where: { id: args.userId } });
      if (!user) return null;

      const [timeline, scoreBreakdown] = await Promise.all([
        getUserTimeline(args.userId),
        getUserScoreBreakdown(args.userId),
      ]);

      return { userId: user.id, displayName: user.displayName, timeline, scoreBreakdown };
    },
  },
};
```

- [ ] **Step 7: Register in the merged schema**

Modify `src/lib/graphql/schema.ts` — add `usersTypeDefs`/`usersResolvers`, following the same pattern as prior tasks.

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all tests pass, no failures

- [ ] **Step 9: Commit**

```bash
git add src/features/users/service.ts src/features/users/service.test.ts src/features/users/graphql src/lib/graphql/schema.ts
git commit -m "Add user detail GraphQL API: timeline and score breakdown"
```

---

## Task 12: User Detail — Timeline Chart and Score Breakdown UI

**Files:**
- Create: `src/features/users/graphql/operations.graphql`
- Create: `src/features/users/components/TimelineChart.tsx`
- Create: `src/features/users/components/ScoreBreakdownPanel.tsx`
- Create: `src/features/users/components/ScoreBreakdownPanel.test.tsx`
- Create: `src/app/users/[id]/page.tsx`
- Modify: `src/features/leaderboard/components/LeaderboardTable.tsx` (link each row to its user detail page)

**Interfaces:**
- Consumes: `userDetail` GraphQL query from Task 11.
- Produces: `<TimelineChart />`, `<ScoreBreakdownPanel />`, rendered at `/users/[id]`.

- [ ] **Step 1: Define the GraphQL operation**

Create `src/features/users/graphql/operations.graphql`:
```graphql
query UserDetail($userId: ID!) {
  userDetail(userId: $userId) {
    userId
    displayName
    timeline {
      recordedAt
      metricChanges {
        metricKey
        pctChange
      }
    }
    scoreBreakdown {
      rawScore
      ageGenderMultiplier
      conditionMultipliers
      finalScore
      metricChanges {
        metricKey
        pctChange
      }
    }
  }
}
```

- [ ] **Step 2: Write a failing test for the breakdown panel**

Create `src/features/users/components/ScoreBreakdownPanel.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';

describe('ScoreBreakdownPanel', () => {
  it('lists each metric contribution and the final score', () => {
    render(
      <ScoreBreakdownPanel
        breakdown={{
          rawScore: 30,
          ageGenderMultiplier: 1.1,
          conditionMultipliers: [1.05],
          finalScore: 34.65,
          metricChanges: [{ metricKey: 'BODY_FAT_PCT', pctChange: 20 }],
        }}
      />
    );
    expect(screen.getByText('BODY_FAT_PCT')).toBeInTheDocument();
    expect(screen.getByText(/34.65/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- ScoreBreakdownPanel`
Expected: FAIL — `Cannot find module './ScoreBreakdownPanel'`

- [ ] **Step 4: Implement the breakdown panel**

Create `src/features/users/components/ScoreBreakdownPanel.tsx`:
```tsx
import { Paper, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

interface MetricChange {
  metricKey: string;
  pctChange: number;
}

export interface ScoreBreakdown {
  rawScore: number;
  ageGenderMultiplier: number;
  conditionMultipliers: number[];
  finalScore: number;
  metricChanges: MetricChange[];
}

export function ScoreBreakdownPanel({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Score Breakdown</Typography>
      <List dense>
        {breakdown.metricChanges.map((change) => (
          <ListItem key={change.metricKey}>
            <ListItemText primary={change.metricKey} secondary={`${change.pctChange.toFixed(2)}% improvement`} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <Typography>Raw score: {breakdown.rawScore.toFixed(2)}</Typography>
      <Typography>Age/gender multiplier: ×{breakdown.ageGenderMultiplier.toFixed(2)}</Typography>
      {breakdown.conditionMultipliers.map((multiplier, index) => (
        <Typography key={index}>Condition multiplier: ×{multiplier.toFixed(2)}</Typography>
      ))}
      <Typography variant="h6" sx={{ mt: 1 }}>Final score: {breakdown.finalScore.toFixed(2)}</Typography>
    </Paper>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- ScoreBreakdownPanel`
Expected: 1 passed

- [ ] **Step 6: Implement the timeline chart**

Create `src/features/users/components/TimelineChart.tsx`:
```tsx
'use client';

import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography } from '@mui/material';

interface MetricChange {
  metricKey: string;
  pctChange: number;
}

interface TimelinePoint {
  recordedAt: string;
  metricChanges: MetricChange[];
}

export function TimelineChart({ timeline, metricKey }: { timeline: TimelinePoint[]; metricKey: string }) {
  const points = timeline
    .map((point) => ({
      recordedAt: point.recordedAt,
      value: point.metricChanges.find((c) => c.metricKey === metricKey)?.pctChange,
    }))
    .filter((point): point is { recordedAt: string; value: number } => point.value !== undefined);

  if (points.length === 0) {
    return <Typography color="text.secondary">No data yet for {metricKey}.</Typography>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <LineChart
        xAxis={[{ data: points.map((_, i) => i), scaleType: 'point', valueFormatter: (i) => points[i]?.recordedAt.slice(0, 10) ?? '' }]}
        series={[{ data: points.map((p) => p.value), label: `${metricKey} % change` }]}
        height={300}
      />
    </Paper>
  );
}
```

- [ ] **Step 7: Wire up the user detail page**

Create `src/app/users/[id]/page.tsx`:
```tsx
'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useParams } from 'next/navigation';
import { Container, Typography, CircularProgress, Stack } from '@mui/material';
import { TimelineChart } from '@/features/users/components/TimelineChart';
import { ScoreBreakdownPanel } from '@/features/users/components/ScoreBreakdownPanel';

const USER_DETAIL_QUERY = gql`
  query UserDetail($userId: ID!) {
    userDetail(userId: $userId) {
      displayName
      timeline {
        recordedAt
        metricChanges {
          metricKey
          pctChange
        }
      }
      scoreBreakdown {
        rawScore
        ageGenderMultiplier
        conditionMultipliers
        finalScore
        metricChanges {
          metricKey
          pctChange
        }
      }
    }
  }
`;

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading } = useQuery(USER_DETAIL_QUERY, { variables: { userId: params.id } });

  if (loading) return <CircularProgress />;
  if (!data?.userDetail) return <Typography>User not found.</Typography>;

  const { displayName, timeline, scoreBreakdown } = data.userDetail;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>{displayName}</Typography>
      <Stack spacing={3}>
        {scoreBreakdown && <ScoreBreakdownPanel breakdown={scoreBreakdown} />}
        <TimelineChart timeline={timeline} metricKey="BODY_FAT_PCT" />
      </Stack>
    </Container>
  );
}
```

- [ ] **Step 8: Link leaderboard rows to user detail**

Modify `src/features/leaderboard/components/LeaderboardTable.tsx` — wrap the name cell in a link:
```tsx
import Link from 'next/link';
// ...
<TableCell>
  <Link href={`/users/${row.userId}`}>{row.displayName}</Link>
</TableCell>
```

- [ ] **Step 9: Commit**

```bash
git add src/features/users/graphql/operations.graphql src/features/users/components src/app/users src/features/leaderboard/components/LeaderboardTable.tsx
git commit -m "Add user detail page with timeline chart and score breakdown"
```

---

## Task 13: Admin — GraphQL API (Metrics, Handicaps, Conditions, Challenge)

**Files:**
- Create: `src/features/admin/service.ts`
- Create: `src/features/admin/service.test.ts`
- Create: `src/features/admin/graphql/typeDefs.ts`
- Create: `src/features/admin/graphql/resolvers.ts`
- Modify: `src/lib/graphql/schema.ts`

**Interfaces:**
- Consumes: `requireAdmin` from `src/lib/graphql/context.ts` (Task 6); `prisma` (Task 2).
- Produces: `updateMetricConfig`, `upsertHandicapBracket`, `deleteHandicapBracket`, `createCondition`, `updateCondition`, `deleteCondition`, `assignConditionToUser`, `unassignConditionFromUser`, `endChallenge`, `startChallenge` service functions and matching GraphQL mutations, consumed by Task 14's UI.

- [ ] **Step 1: Write failing tests for the admin service**

Create `src/features/admin/service.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  updateMetricConfig,
  upsertHandicapBracket,
  createCondition,
  assignConditionToUser,
} from './service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    metricConfig: { upsert: vi.fn() },
    handicapBracket: { upsert: vi.fn() },
    condition: { create: vi.fn() },
    userCondition: { upsert: vi.fn() },
  },
}));

describe('admin service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updateMetricConfig upserts by challengeId + metricKey', async () => {
    (prisma.metricConfig.upsert as any).mockResolvedValue({ id: 'mc1' });
    await updateMetricConfig({ metricKey: 'BODY_FAT_PCT', weight: 2, directionType: 'FIXED', fixedDirection: 'DOWN' });
    expect(prisma.metricConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { challengeId_metricKey: { challengeId: null, metricKey: 'BODY_FAT_PCT' } },
      })
    );
  });

  it('upsertHandicapBracket creates or updates a bracket', async () => {
    (prisma.handicapBracket.upsert as any).mockResolvedValue({ id: 'hb1' });
    const result = await upsertHandicapBracket({ gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.25 });
    expect(result.id).toBe('hb1');
  });

  it('createCondition stores name, description, multiplier', async () => {
    (prisma.condition.create as any).mockResolvedValue({ id: 'cond1' });
    await createCondition({ name: 'Hypothyroidism', description: 'Slows metabolism', multiplier: 1.15 });
    expect(prisma.condition.create).toHaveBeenCalledWith({
      data: { name: 'Hypothyroidism', description: 'Slows metabolism', multiplier: 1.15 },
    });
  });

  it('assignConditionToUser links a user and condition idempotently', async () => {
    (prisma.userCondition.upsert as any).mockResolvedValue({ userId: 'u1', conditionId: 'cond1' });
    await assignConditionToUser('u1', 'cond1');
    expect(prisma.userCondition.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_conditionId: { userId: 'u1', conditionId: 'cond1' } } })
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- features/admin/service`
Expected: FAIL — `Cannot find module './service'`

- [ ] **Step 3: Implement the admin service**

Create `src/features/admin/service.ts`:
```ts
import { prisma } from '@/lib/prisma';
import { DirectionType, FixedDirection, Gender, MetricKey } from '@prisma/client';

export async function updateMetricConfig(input: {
  metricKey: MetricKey;
  weight: number;
  directionType: DirectionType;
  fixedDirection: FixedDirection | null;
}) {
  return prisma.metricConfig.upsert({
    where: { challengeId_metricKey: { challengeId: null as unknown as string, metricKey: input.metricKey } },
    update: { weight: input.weight, directionType: input.directionType, fixedDirection: input.fixedDirection },
    create: { ...input, challengeId: null },
  });
}

export async function upsertHandicapBracket(input: {
  id?: string;
  gender: Gender;
  minAge: number;
  maxAge: number;
  multiplier: number;
}) {
  if (input.id) {
    return prisma.handicapBracket.update({ where: { id: input.id }, data: input });
  }
  return prisma.handicapBracket.create({ data: input });
}

export async function deleteHandicapBracket(id: string) {
  return prisma.handicapBracket.delete({ where: { id } });
}

export async function createCondition(input: { name: string; description?: string; multiplier: number }) {
  return prisma.condition.create({ data: { name: input.name, description: input.description ?? null, multiplier: input.multiplier } });
}

export async function updateCondition(input: { id: string; name: string; description?: string; multiplier: number }) {
  return prisma.condition.update({
    where: { id: input.id },
    data: { name: input.name, description: input.description ?? null, multiplier: input.multiplier },
  });
}

export async function deleteCondition(id: string) {
  return prisma.condition.delete({ where: { id } });
}

export async function assignConditionToUser(userId: string, conditionId: string) {
  return prisma.userCondition.upsert({
    where: { userId_conditionId: { userId, conditionId } },
    update: {},
    create: { userId, conditionId },
  });
}

export async function unassignConditionFromUser(userId: string, conditionId: string) {
  return prisma.userCondition.delete({ where: { userId_conditionId: { userId, conditionId } } });
}

export async function endChallenge(challengeId: string) {
  return prisma.challenge.update({ where: { id: challengeId }, data: { isActive: false, endDate: new Date() } });
}

export async function startChallenge(input: { name: string; startDate: string }) {
  await prisma.challenge.updateMany({ where: { isActive: true }, data: { isActive: false, endDate: new Date() } });
  return prisma.challenge.create({ data: { name: input.name, startDate: new Date(input.startDate), isActive: true } });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- features/admin/service`
Expected: 4 passed

- [ ] **Step 5: Define the GraphQL schema**

Create `src/features/admin/graphql/typeDefs.ts`:
```ts
export const typeDefs = `#graphql
  enum DirectionType {
    FIXED
    GOAL_RELATIVE
  }

  enum FixedDirection {
    UP
    DOWN
  }

  input UpdateMetricConfigInput {
    metricKey: String!
    weight: Float!
    directionType: DirectionType!
    fixedDirection: FixedDirection
  }

  input HandicapBracketInput {
    id: ID
    gender: Gender!
    minAge: Int!
    maxAge: Int!
    multiplier: Float!
  }

  input ConditionInput {
    id: ID
    name: String!
    description: String
    multiplier: Float!
  }

  type Condition {
    id: ID!
    name: String!
    description: String
    multiplier: Float!
  }

  type HandicapBracketType {
    id: ID!
    gender: Gender!
    minAge: Int!
    maxAge: Int!
    multiplier: Float!
  }

  extend type Query {
    conditions: [Condition!]!
    handicapBrackets: [HandicapBracketType!]!
  }

  extend type Mutation {
    updateMetricConfig(input: UpdateMetricConfigInput!): Boolean!
    upsertHandicapBracket(input: HandicapBracketInput!): HandicapBracketType!
    deleteHandicapBracket(id: ID!): Boolean!
    createCondition(input: ConditionInput!): Condition!
    updateCondition(input: ConditionInput!): Condition!
    deleteCondition(id: ID!): Boolean!
    assignConditionToUser(userId: ID!, conditionId: ID!): Boolean!
    unassignConditionFromUser(userId: ID!, conditionId: ID!): Boolean!
    endChallenge(challengeId: ID!): Boolean!
    startChallenge(name: String!, startDate: String!): Boolean!
  }
`;
```

- [ ] **Step 6: Implement the resolvers**

Create `src/features/admin/graphql/resolvers.ts`:
```ts
import { GraphQLContext, requireAdmin } from '@/lib/graphql/context';
import * as adminService from '../service';

export const resolvers = {
  Query: {
    conditions: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      return context.prisma.condition.findMany();
    },
    handicapBrackets: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      return context.prisma.handicapBracket.findMany();
    },
  },
  Mutation: {
    updateMetricConfig: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.updateMetricConfig(args.input);
      return true;
    },
    upsertHandicapBracket: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      return adminService.upsertHandicapBracket(args.input);
    },
    deleteHandicapBracket: async (_p: unknown, args: { id: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.deleteHandicapBracket(args.id);
      return true;
    },
    createCondition: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      return adminService.createCondition(args.input);
    },
    updateCondition: async (_p: unknown, args: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);
      return adminService.updateCondition(args.input);
    },
    deleteCondition: async (_p: unknown, args: { id: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.deleteCondition(args.id);
      return true;
    },
    assignConditionToUser: async (_p: unknown, args: { userId: string; conditionId: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.assignConditionToUser(args.userId, args.conditionId);
      return true;
    },
    unassignConditionFromUser: async (_p: unknown, args: { userId: string; conditionId: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.unassignConditionFromUser(args.userId, args.conditionId);
      return true;
    },
    endChallenge: async (_p: unknown, args: { challengeId: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.endChallenge(args.challengeId);
      return true;
    },
    startChallenge: async (_p: unknown, args: { name: string; startDate: string }, context: GraphQLContext) => {
      requireAdmin(context);
      await adminService.startChallenge(args);
      return true;
    },
  },
};
```

- [ ] **Step 7: Register in the merged schema**

Modify `src/lib/graphql/schema.ts` — add `adminTypeDefs`/`adminResolvers`, following the same pattern as prior tasks. At this point also remove the now-unused `_placeholder` root `Query`/`Mutation` fields and their resolver, since real fields exist across all registered features.

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all tests pass, no failures

- [ ] **Step 9: Commit**

```bash
git add src/features/admin/service.ts src/features/admin/service.test.ts src/features/admin/graphql src/lib/graphql/schema.ts
git commit -m "Add admin GraphQL API: metric configs, handicaps, conditions, challenge management"
```

---

## Task 14: Admin — UI, Navigation Shell, and Final Wiring

**Files:**
- Create: `src/features/admin/components/MetricConfigEditor.tsx`
- Create: `src/features/admin/components/HandicapBracketEditor.tsx`
- Create: `src/features/admin/components/ConditionManager.tsx`
- Create: `src/features/admin/components/ConditionManager.test.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/features/navigation/components/AppNavBar.tsx`
- Modify: `src/app/layout.tsx` (render nav bar)

**Interfaces:**
- Consumes: admin GraphQL mutations/queries from Task 13.
- Produces: `/admin` page with tabs for metrics, handicaps, and conditions; a persistent nav bar linking Leaderboard / Record Measurement / Admin (Admin link only shown when `session.user.isAdmin`).

- [ ] **Step 1: Write a failing test for the condition manager**

Create `src/features/admin/components/ConditionManager.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ConditionManager, CONDITIONS_QUERY, CREATE_CONDITION } from './ConditionManager';

describe('ConditionManager', () => {
  it('lists existing conditions and allows creating a new one', async () => {
    const mocks = [
      { request: { query: CONDITIONS_QUERY }, result: { data: { conditions: [{ id: 'c1', name: 'Hypothyroidism', description: null, multiplier: 1.15 }] } } },
      {
        request: { query: CREATE_CONDITION, variables: { input: { name: 'PCOS', description: null, multiplier: 1.1 } } },
        result: { data: { createCondition: { id: 'c2', name: 'PCOS', description: null, multiplier: 1.1 } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ConditionManager />
      </MockedProvider>
    );

    expect(await screen.findByText('Hypothyroidism')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/condition name/i), { target: { value: 'PCOS' } });
    fireEvent.change(screen.getByLabelText(/multiplier/i), { target: { value: '1.1' } });
    fireEvent.click(screen.getByRole('button', { name: /add condition/i }));

    expect(await screen.findByText('PCOS')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- ConditionManager`
Expected: FAIL — `Cannot find module './ConditionManager'`

- [ ] **Step 3: Implement the condition manager**

Create `src/features/admin/components/ConditionManager.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { List, ListItem, ListItemText, TextField, Button, Stack, Typography } from '@mui/material';

export const CONDITIONS_QUERY = gql`
  query Conditions {
    conditions {
      id
      name
      description
      multiplier
    }
  }
`;

export const CREATE_CONDITION = gql`
  mutation CreateCondition($input: ConditionInput!) {
    createCondition(input: $input) {
      id
      name
      description
      multiplier
    }
  }
`;

export function ConditionManager() {
  const { data, loading } = useQuery(CONDITIONS_QUERY);
  const [createCondition] = useMutation(CREATE_CONDITION, {
    refetchQueries: [{ query: CONDITIONS_QUERY }],
  });
  const [name, setName] = useState('');
  const [multiplier, setMultiplier] = useState('');

  async function handleAdd() {
    await createCondition({ variables: { input: { name, description: null, multiplier: Number(multiplier) } } });
    setName('');
    setMultiplier('');
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Health Conditions</Typography>
      {!loading && (
        <List>
          {data?.conditions.map((condition: { id: string; name: string; multiplier: number }) => (
            <ListItem key={condition.id}>
              <ListItemText primary={condition.name} secondary={`×${condition.multiplier}`} />
            </ListItem>
          ))}
        </List>
      )}
      <Stack direction="row" spacing={2}>
        <TextField label="Condition Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Multiplier" type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
        <Button variant="contained" onClick={handleAdd}>Add Condition</Button>
      </Stack>
    </Stack>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- ConditionManager`
Expected: 1 passed

- [ ] **Step 5: Implement the metric config editor**

Create `src/features/admin/components/MetricConfigEditor.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { TextField, Button, Stack, Typography, MenuItem } from '@mui/material';

const UPDATE_METRIC_CONFIG = gql`
  mutation UpdateMetricConfig($input: UpdateMetricConfigInput!) {
    updateMetricConfig(input: $input)
  }
`;

const METRIC_KEYS = [
  'WEIGHT', 'BMI', 'BODY_FAT_PCT', 'SUBCUTANEOUS_FAT_PCT', 'VISCERAL_FAT_RATING',
  'SKELETAL_MUSCLE_PCT', 'MUSCLE_MASS_KG', 'PROTEIN_PCT', 'BMR', 'METABOLIC_AGE',
];

export function MetricConfigEditor() {
  const [metricKey, setMetricKey] = useState('BODY_FAT_PCT');
  const [weight, setWeight] = useState('1');
  const [directionType, setDirectionType] = useState<'FIXED' | 'GOAL_RELATIVE'>('FIXED');
  const [fixedDirection, setFixedDirection] = useState<'UP' | 'DOWN'>('DOWN');
  const [updateMetricConfig, { data }] = useMutation(UPDATE_METRIC_CONFIG);

  async function handleSave() {
    await updateMetricConfig({
      variables: {
        input: {
          metricKey,
          weight: Number(weight),
          directionType,
          fixedDirection: directionType === 'FIXED' ? fixedDirection : null,
        },
      },
    });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Metric Weights</Typography>
      <TextField select label="Metric" value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
        {METRIC_KEYS.map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)}
      </TextField>
      <TextField label="Weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
      <TextField select label="Direction Type" value={directionType} onChange={(e) => setDirectionType(e.target.value as 'FIXED' | 'GOAL_RELATIVE')}>
        <MenuItem value="FIXED">Fixed</MenuItem>
        <MenuItem value="GOAL_RELATIVE">Goal-relative</MenuItem>
      </TextField>
      {directionType === 'FIXED' && (
        <TextField select label="Fixed Direction" value={fixedDirection} onChange={(e) => setFixedDirection(e.target.value as 'UP' | 'DOWN')}>
          <MenuItem value="UP">Up is improvement</MenuItem>
          <MenuItem value="DOWN">Down is improvement</MenuItem>
        </TextField>
      )}
      <Button variant="contained" onClick={handleSave}>Save</Button>
      {data && <Typography color="success.main">Saved.</Typography>}
    </Stack>
  );
}
```

- [ ] **Step 6: Implement the handicap bracket editor**

Create `src/features/admin/components/HandicapBracketEditor.tsx`:
```tsx
'use client';

import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { List, ListItem, ListItemText, TextField, Button, Stack, Typography, MenuItem } from '@mui/material';

const BRACKETS_QUERY = gql`
  query HandicapBrackets {
    handicapBrackets {
      id
      gender
      minAge
      maxAge
      multiplier
    }
  }
`;

const UPSERT_BRACKET = gql`
  mutation UpsertHandicapBracket($input: HandicapBracketInput!) {
    upsertHandicapBracket(input: $input) {
      id
      gender
      minAge
      maxAge
      multiplier
    }
  }
`;

export function HandicapBracketEditor() {
  const { data, loading } = useQuery(BRACKETS_QUERY);
  const [upsertBracket] = useMutation(UPSERT_BRACKET, { refetchQueries: [{ query: BRACKETS_QUERY }] });
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [minAge, setMinAge] = useState('45');
  const [maxAge, setMaxAge] = useState('120');
  const [multiplier, setMultiplier] = useState('1.2');

  async function handleAdd() {
    await upsertBracket({
      variables: { input: { gender, minAge: Number(minAge), maxAge: Number(maxAge), multiplier: Number(multiplier) } },
    });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Age/Gender Handicap Brackets</Typography>
      {!loading && (
        <List>
          {data?.handicapBrackets.map((bracket: { id: string; gender: string; minAge: number; maxAge: number; multiplier: number }) => (
            <ListItem key={bracket.id}>
              <ListItemText primary={`${bracket.gender}, ${bracket.minAge}-${bracket.maxAge}`} secondary={`×${bracket.multiplier}`} />
            </ListItem>
          ))}
        </List>
      )}
      <Stack direction="row" spacing={2}>
        <TextField select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}>
          <MenuItem value="MALE">Male</MenuItem>
          <MenuItem value="FEMALE">Female</MenuItem>
        </TextField>
        <TextField label="Min Age" type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        <TextField label="Max Age" type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        <TextField label="Multiplier" type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
        <Button variant="contained" onClick={handleAdd}>Add / Update</Button>
      </Stack>
    </Stack>
  );
}
```

- [ ] **Step 7: Wire up the admin page with tabs**

Create `src/app/admin/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Typography, Tabs, Tab, Box } from '@mui/material';
import { MetricConfigEditor } from '@/features/admin/components/MetricConfigEditor';
import { HandicapBracketEditor } from '@/features/admin/components/HandicapBracketEditor';
import { ConditionManager } from '@/features/admin/components/ConditionManager';

export default function AdminPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState(0);

  if (!(session?.user as any)?.isAdmin) {
    return <Typography sx={{ mt: 4 }}>Admin access required.</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Admin</Typography>
      <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
        <Tab label="Metric Weights" />
        <Tab label="Handicap Brackets" />
        <Tab label="Conditions" />
      </Tabs>
      <Box sx={{ mt: 3 }}>
        {tab === 0 && <MetricConfigEditor />}
        {tab === 1 && <HandicapBracketEditor />}
        {tab === 2 && <ConditionManager />}
      </Box>
    </Container>
  );
}
```

- [ ] **Step 8: Build the nav bar**

Create `src/features/navigation/components/AppNavBar.tsx`:
```tsx
'use client';

import { AppBar, Toolbar, Button, Box } from '@mui/material';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function AppNavBar() {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <Button component={Link} href="/leaderboard" color="inherit">Leaderboard</Button>
        <Button component={Link} href="/measurements/new" color="inherit">Record Measurement</Button>
        {(session.user as any)?.isAdmin && (
          <Button component={Link} href="/admin" color="inherit">Admin</Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button color="inherit" onClick={() => signOut({ callbackUrl: '/login' })}>Log out</Button>
      </Toolbar>
    </AppBar>
  );
}
```

- [ ] **Step 9: Render the nav bar in the root layout**

Modify `src/app/layout.tsx` — add `<AppNavBar />` inside `<Providers>`, above `{children}`:
```tsx
import { AppNavBar } from '@/features/navigation/components/AppNavBar';
// ...
<Providers>
  <AppNavBar />
  {children}
</Providers>
```

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all tests pass, no failures

- [ ] **Step 11: Manual end-to-end smoke test**

Run: `npm run dev`, then in a browser:
1. Visit `/register`, create two accounts (one MALE, one FEMALE, different birthdates/goals).
2. Log in as each, record a baseline measurement, then a second "improved" measurement.
3. Visit `/leaderboard`, confirm both users appear, ranked, and gender filters work.
4. Click a user's name, confirm the timeline chart and score breakdown render.
5. Log in as the seeded admin (`Gabriel` / `changeme123`), visit `/admin`, add a handicap bracket and a condition, assign the condition to a user via `assignConditionToUser` (can be tested via the GraphQL endpoint directly with `curl` if no assignment UI row exists yet — this confirms the mutation works; a dedicated per-user assignment control can be added as a follow-up if desired).
6. Confirm the leaderboard re-ranks after changing a metric weight.

Stop the dev server once verified.

- [ ] **Step 12: Commit**

```bash
git add src/features/admin/components src/app/admin src/features/navigation src/app/layout.tsx
git commit -m "Add admin UI, navigation shell, and wire up the full app"
```
