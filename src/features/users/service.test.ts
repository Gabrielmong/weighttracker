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

  it('anchors the timeline at the baseline (0% change, raw value included) plus one point per non-baseline snapshot', async () => {
    (prisma.measurement.findMany as any).mockResolvedValue([
      { recordedAt: new Date('2026-01-01'), isBaseline: true, bodyFatPct: 25, weightKg: 90, bmi: 28, subcutaneousFatPct: 18, visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: null, bmr: null, metabolicAge: null },
      { recordedAt: new Date('2026-02-01'), isBaseline: false, bodyFatPct: 22, weightKg: 88, bmi: 27, subcutaneousFatPct: 17, visceralFatRating: 9, skeletalMusclePct: 33, muscleMassKg: 28.5, proteinPct: null, bmr: null, metabolicAge: null },
      { recordedAt: new Date('2026-03-01'), isBaseline: false, bodyFatPct: 20, weightKg: 85, bmi: 26, subcutaneousFatPct: 16, visceralFatRating: 8, skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: null, bmr: null, metabolicAge: null },
    ]);

    const timeline = await getUserTimeline('u1');
    expect(timeline).toHaveLength(3);

    const baselineChange = timeline[0].metricChanges.find((c) => c.metricKey === 'BODY_FAT_PCT');
    expect(baselineChange?.pctChange).toBe(0);
    expect(baselineChange?.rawValue).toBe(25);

    const firstFollowUp = timeline[1].metricChanges.find((c) => c.metricKey === 'BODY_FAT_PCT');
    expect(firstFollowUp?.pctChange).toBeCloseTo(12, 3);
    expect(firstFollowUp?.rawValue).toBe(22);

    const secondFollowUp = timeline[2].metricChanges.find((c) => c.metricKey === 'BODY_FAT_PCT');
    expect(secondFollowUp?.pctChange).toBeCloseTo(20, 3);
    expect(secondFollowUp?.rawValue).toBe(20);
  });

  it('still produces a two-point timeline (baseline + latest) with only one follow-up measurement', async () => {
    (prisma.measurement.findMany as any).mockResolvedValue([
      { recordedAt: new Date('2026-01-01'), isBaseline: true, bodyFatPct: 25, weightKg: 90, bmi: 28, subcutaneousFatPct: 18, visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: null, bmr: null, metabolicAge: null },
      { recordedAt: new Date('2026-02-01'), isBaseline: false, bodyFatPct: 22, weightKg: 88, bmi: 27, subcutaneousFatPct: 17, visceralFatRating: 9, skeletalMusclePct: 33, muscleMassKg: 28.5, proteinPct: null, bmr: null, metabolicAge: null },
    ]);

    const timeline = await getUserTimeline('u1');
    expect(timeline).toHaveLength(2);
  });

  it('returns an empty timeline when there is no baseline yet', async () => {
    (prisma.measurement.findMany as any).mockResolvedValue([]);
    const timeline = await getUserTimeline('u1');
    expect(timeline).toEqual([]);
  });
});
