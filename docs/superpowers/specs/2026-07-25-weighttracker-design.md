# WeightTracker — Family Weight-Loss Challenge App

Design spec. Status: approved by user, pending final written-spec review.

## 1. Purpose

A family weight-loss/body-composition challenge tracker. Raw measurements aren't
comparable across people with very different starting bodies, so the app scores
each participant on their *individual % improvement* across multiple body
composition metrics, combines those into a single weighted score, and applies
fairness adjustments (age/gender handicap + optional health-condition modifiers)
so people with different bodies, ages, sexes, and medical conditions can compete
on a level footing. Includes a leaderboard with multiple comparison views and a
per-user timeline graph of progress.

## 2. Tech Stack

- **Next.js** (App Router) + TypeScript
- **MUI** for components, with a central `theme.ts`
- **GraphQL** API (Apollo Server via a Next.js route handler), resolvers call a
  service layer — not Prisma directly
- **Prisma + PostgreSQL**
- **Auth**: NextAuth Credentials provider (display name + password), session
  cookies, middleware-protected routes. No email/OAuth — this is a closed family
  app.
- **Deployment**: Vercel + managed Postgres (Neon/Supabase/Railway), Prisma
  migrations run at deploy time.

## 3. Project Structure

Feature-based layout under `src/`:

```
src/
  features/
    measurements/   components/, graphql/, hooks/, types.ts
    scoring/         (scoring engine — see §5)
    leaderboard/     components/, graphql/, hooks/
    admin/           components/, graphql/, hooks/
    auth/            components/ (login/register), graphql/
  lib/               prisma client, auth config, constants.ts
  theme/             theme.ts, theme-related tokens
```

Presentational MUI components stay separate from data-fetching hooks (Apollo
`useQuery`/`useMutation` in `hooks/`); components receive typed props and stay
"dumb." Shared types are generated from the GraphQL schema via codegen so
frontend and resolvers share one source of truth. Domain-specific types (e.g.
`MetricDirection`, `ScoreBreakdown`) live in `src/features/scoring/types.ts`.

## 4. Data Model (Prisma, conceptual)

```
User
  id, displayName, passwordHash
  gender            MALE | FEMALE
  birthdate
  weightGoal        LOSE | GAIN | MAINTAIN
  isAdmin           Boolean
  createdAt

Challenge
  id, name, startDate, endDate, isActive

Measurement            // one snapshot per recording
  id, userId, challengeId, recordedAt
  weightKg, bmi, bodyFatPct, subcutaneousFatPct,
  visceralFatRating, skeletalMusclePct, muscleMassKg
  proteinPct        Float?   // optional
  bmr               Float?   // optional
  metabolicAge      Int?     // optional
  isBaseline        Boolean  // true for the user's first snapshot in the challenge

MetricConfig
  id, challengeId (nullable = global default), metricKey (enum, see §5)
  weight              Float   // admin-editable
  directionType       FIXED | GOAL_RELATIVE
  fixedDirection      UP | DOWN | null   // used when directionType = FIXED

HandicapBracket
  id, gender, minAge, maxAge, multiplier   // admin-editable

Condition                          // e.g. "Hypothyroidism"
  id, name, description, multiplier   // admin CRUD

UserCondition                      // join table, many-to-many
  userId, conditionId
```

Baseline rule: a user's **first recorded measurement** (after they exist in the
active challenge) becomes `isBaseline = true` and is the reference point for all
% change calculations for that user in that challenge. Challenges are single/
sequential — one active `Challenge` at a time; when admin ends it, results
freeze and a new one can be started later.

## 5. Scoring Engine

Computed on-demand in a `scoring` service (not persisted), so admin edits to
weights/brackets/conditions immediately re-rank everyone.

**Metrics and their direction type:**

| Metric | Direction |
|---|---|
| `WEIGHT` | GOAL_RELATIVE |
| `BMI` | GOAL_RELATIVE |
| `BODY_FAT_PCT` | FIXED (down) |
| `SUBCUTANEOUS_FAT_PCT` | FIXED (down) |
| `VISCERAL_FAT_RATING` | FIXED (down) |
| `SKELETAL_MUSCLE_PCT` | FIXED (up) |
| `MUSCLE_MASS_KG` | FIXED (up) |
| `PROTEIN_PCT` (optional) | FIXED (up) |
| `BMR` (optional) | FIXED (up) |
| `METABOLIC_AGE` (optional) | FIXED (down) |

Fixed directions above are the defaults seeded at setup; all are admin-editable
via `MetricConfig`.

**Step 1 — per-metric % change** (baseline → current snapshot), sign-normalized
so positive always means "improvement":

- `FIXED` metrics:
  `pctChange = ((current - baseline) / baseline) * 100 * directionSign`, where
  `directionSign = +1` if `fixedDirection = UP`, `-1` if `fixedDirection = DOWN`.
  This makes a raw increase register as positive (improvement) for UP metrics
  and negative (regression) for DOWN metrics, and vice versa for a decrease.
- `GOAL_RELATIVE` metrics (`WEIGHT`, `BMI`): resolved per-user from
  `weightGoal`:
  - `LOSE`: improvement = decrease → `pctChange = ((baseline - current) / baseline) * 100`
  - `GAIN`: improvement = increase → `pctChange = ((current - baseline) / baseline) * 100`
  - `MAINTAIN`: improvement = staying close to baseline →
    `pctChange = -abs((current - baseline) / baseline) * 100`
- Optional fields (`PROTEIN_PCT`, `BMR`, `METABOLIC_AGE`) only contribute if the
  user recorded them at **both** baseline and the current snapshot.

**Step 2 — weighted metric score:**
`metricScore = pctChange * MetricConfig.weight`, summed across all metrics with
available data → **raw score**.

**Step 3 — handicap multiplier:**
Look up `HandicapBracket` by the user's gender + age (computed from birthdate as
of challenge start) → `ageGenderMultiplier`.

**Step 4 — condition multipliers:**
For every `Condition` assigned to the user via `UserCondition`, multiply in its
`multiplier`. Multiple conditions stack multiplicatively.

**Final score:**
```
finalScore = rawScore * ageGenderMultiplier * Π(conditionMultipliers)
```

Final scores drive leaderboard ranking (highest wins). The same per-metric
`pctChange` formula, applied at every snapshot (not just the latest), produces
the data for each user's timeline graph.

## 6. Auth, Registration, Admin

- **Registration**: single shared link (`/register`) — display name + password
  only, no email/verification. Anyone with the link can create an account.
- **Login**: display name + password via NextAuth Credentials.
- **Admin panel** (`/admin`, gated on `User.isAdmin`):
  - Edit `MetricConfig` weights and directions
  - Edit `HandicapBracket` table (gender × age band × multiplier)
  - CRUD `Condition`s and assign/unassign them to users
  - Manage `Challenge` (start/end dates, end current + start new)
- Admin is a boolean flag; the user (Gabriel) is seeded as the sole admin at
  setup. No promotion UI in v1 — additional admins are granted by editing the
  DB directly if ever needed.

## 7. Leaderboard & Comparison Views

- **Default view**: all family members, ranked by final (handicapped) score,
  descending.
- **Filters** (combinable):
  - Gender: men-only / women-only / mixed
  - Age bracket
  - Score type: raw (unhandicapped) vs. final (handicapped)
  - Per-metric leaderboard (e.g. "most body-fat% improvement, unhandicapped")
- **Per-user detail page**:
  - Timeline chart(s): one line per metric, % change from baseline across all
    recorded snapshots
  - Score breakdown: each metric's contribution to raw score, plus the
    handicap/condition multipliers applied, so a user can see exactly why
    they're ranked where they are

## 8. Testing

Scoring engine is the highest-risk logic (this is the whole point of the app
being "fair") — unit tests must cover:

- Each direction type: FIXED-down, FIXED-up, GOAL_RELATIVE × {LOSE, GAIN,
  MAINTAIN}
- Optional-field omission (missing at baseline, missing at current, missing at
  both)
- Condition stacking (0, 1, multiple conditions)
- Handicap bracket lookup (boundary ages, missing bracket coverage)
- Edge cases: user with only a baseline snapshot (no current data), zero or
  near-zero baseline value (division-by-zero guard)

## 9. Out of Scope (v1)

- Multiple concurrent/historical challenges (single active challenge only)
- Multi-admin promotion UI
- Non-metric (kg/cm) unit systems
- Gender options beyond male/female (handicap brackets are binary by design)
- Email verification / password reset flows (family closed-group app; a lost
  password is handled informally, e.g. admin resets it directly in the DB)
