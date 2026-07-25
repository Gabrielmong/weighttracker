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
