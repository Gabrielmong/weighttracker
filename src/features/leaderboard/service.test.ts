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
    { isBaseline: true, recordedAt: new Date('2026-01-01'), weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18, visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: null, bmr: null, metabolicAge: null },
    { isBaseline: false, recordedAt: new Date('2026-02-01'), weightKg: 85, bmi: 26, bodyFatPct: 20, subcutaneousFatPct: 16, visceralFatRating: 8, skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: null, bmr: null, metabolicAge: null },
  ],
};

describe('getLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.challenge.findFirst as any).mockResolvedValue({ id: 'c1', startDate: new Date('2026-01-01') });
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
