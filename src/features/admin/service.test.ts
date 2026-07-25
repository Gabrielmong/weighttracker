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
    metricConfig: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    handicapBracket: { create: vi.fn(), update: vi.fn() },
    condition: { create: vi.fn() },
    userCondition: { upsert: vi.fn() },
  },
}));

describe('admin service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updateMetricConfig creates a new global-default row when none exists', async () => {
    (prisma.metricConfig.findFirst as any).mockResolvedValue(null);
    (prisma.metricConfig.create as any).mockResolvedValue({ id: 'mc1' });
    await updateMetricConfig({ metricKey: 'BODY_FAT_PCT', weight: 2, directionType: 'FIXED', fixedDirection: 'DOWN' });
    expect(prisma.metricConfig.findFirst).toHaveBeenCalledWith({
      where: { challengeId: null, metricKey: 'BODY_FAT_PCT' },
    });
    expect(prisma.metricConfig.create).toHaveBeenCalledWith({
      data: { metricKey: 'BODY_FAT_PCT', weight: 2, directionType: 'FIXED', fixedDirection: 'DOWN', challengeId: null },
    });
  });

  it('updateMetricConfig updates the existing row by id when one exists', async () => {
    (prisma.metricConfig.findFirst as any).mockResolvedValue({ id: 'existing-1' });
    (prisma.metricConfig.update as any).mockResolvedValue({ id: 'existing-1' });
    await updateMetricConfig({ metricKey: 'BODY_FAT_PCT', weight: 2, directionType: 'FIXED', fixedDirection: 'DOWN' });
    expect(prisma.metricConfig.update).toHaveBeenCalledWith({
      where: { id: 'existing-1' },
      data: { weight: 2, directionType: 'FIXED', fixedDirection: 'DOWN' },
    });
  });

  it('upsertHandicapBracket creates a new bracket when no id is given', async () => {
    (prisma.handicapBracket.create as any).mockResolvedValue({ id: 'hb1' });
    const result = await upsertHandicapBracket({ gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.25 });
    expect(result.id).toBe('hb1');
    expect(prisma.handicapBracket.create).toHaveBeenCalledWith({
      data: { gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.25 },
    });
  });

  it('upsertHandicapBracket updates an existing bracket when an id is given', async () => {
    (prisma.handicapBracket.update as any).mockResolvedValue({ id: 'hb1' });
    const result = await upsertHandicapBracket({ id: 'hb1', gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.3 });
    expect(result.id).toBe('hb1');
    expect(prisma.handicapBracket.update).toHaveBeenCalledWith({
      where: { id: 'hb1' },
      data: { id: 'hb1', gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.3 },
    });
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
