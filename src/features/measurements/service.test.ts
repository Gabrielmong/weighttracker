import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordMeasurement } from './service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    measurement: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

const baseInput = {
  weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18,
  visceralFatRating: 10, skeletalMusclePct: 32, muscleMassKg: 28,
};

describe('recordMeasurement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks a user\'s first-ever measurement as baseline', async () => {
    (prisma.measurement.create as any).mockResolvedValue({ id: 'm1' });
    (prisma.measurement.findMany as any).mockResolvedValue([{ id: 'm1' }]);
    (prisma.measurement.findUniqueOrThrow as any).mockResolvedValue({ id: 'm1', isBaseline: true });

    const result = await recordMeasurement('user-1', 'challenge-1', baseInput);

    expect(prisma.measurement.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { isBaseline: true } });
    expect(result.isBaseline).toBe(true);
  });

  it('does not disturb the baseline when a chronologically later measurement is recorded', async () => {
    (prisma.measurement.create as any).mockResolvedValue({ id: 'm2' });
    // findMany is ordered by recordedAt asc — the original baseline (m1) is still earliest.
    (prisma.measurement.findMany as any).mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
    (prisma.measurement.findUniqueOrThrow as any).mockResolvedValue({ id: 'm2', isBaseline: false });

    const result = await recordMeasurement('user-1', 'challenge-1', { ...baseInput, weightKg: 88 });

    expect(prisma.measurement.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', challengeId: 'challenge-1', NOT: { id: 'm1' } },
      data: { isBaseline: false },
    });
    expect(prisma.measurement.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { isBaseline: true } });
    expect(result.isBaseline).toBe(false);
  });

  it('moves the baseline when a backdated measurement is recorded earlier than the existing baseline', async () => {
    (prisma.measurement.create as any).mockResolvedValue({ id: 'm3' });
    // The new backdated entry (m3) sorts first once ordered by recordedAt asc.
    (prisma.measurement.findMany as any).mockResolvedValue([{ id: 'm3' }, { id: 'm1' }, { id: 'm2' }]);
    (prisma.measurement.findUniqueOrThrow as any).mockResolvedValue({ id: 'm3', isBaseline: true, recordedAt: '2026-01-01' });

    const result = await recordMeasurement('user-1', 'challenge-1', {
      ...baseInput,
      recordedAt: '2026-01-01T00:00:00.000Z',
    });

    const createArgs = (prisma.measurement.create as any).mock.calls[0][0];
    expect(createArgs.data.recordedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));

    expect(prisma.measurement.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', challengeId: 'challenge-1', NOT: { id: 'm3' } },
      data: { isBaseline: false },
    });
    expect(prisma.measurement.update).toHaveBeenCalledWith({ where: { id: 'm3' }, data: { isBaseline: true } });
    expect(result.isBaseline).toBe(true);
  });
});
