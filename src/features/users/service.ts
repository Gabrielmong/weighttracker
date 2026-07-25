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
