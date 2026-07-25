import { prisma } from '@/lib/prisma';
import { computeMetricChanges } from '@/features/scoring/metricChanges';
import { getMetricValue } from '@/features/scoring/metricValues';
import { computeScoreBreakdown, calculateAge } from '@/features/scoring/score';
import { MeasurementSnapshot, MetricConfigInput, TimelineMetricPoint } from '@/features/scoring/types';

export interface TimelinePoint {
  recordedAt: Date;
  metricChanges: TimelineMetricPoint[];
}

function withRawValues(
  changes: { metricKey: TimelineMetricPoint['metricKey']; pctChange: number }[],
  snapshot: MeasurementSnapshot
): TimelineMetricPoint[] {
  return changes.map((change) => ({ ...change, rawValue: getMetricValue(snapshot, change.metricKey) }));
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

  const configInputs: MetricConfigInput[] = configs.map((c) => ({
    metricKey: c.metricKey,
    weight: c.weight,
    directionType: c.directionType,
    fixedDirection: c.fixedDirection,
  }));

  // Anchor the timeline at the baseline itself (0% change, by definition,
  // relative to itself) so a user with only one follow-up measurement still
  // has two points to draw a line between — same fix as the leaderboard's
  // per-user timeline.
  const baselineChanges: TimelineMetricPoint[] = configInputs
    .map((config) => getMetricValue(baseline, config.metricKey))
    .map((value, index) => ({ metricKey: configInputs[index].metricKey, pctChange: 0, rawValue: value }))
    .filter((change) => change.rawValue !== null);

  const baselinePoint: TimelinePoint = { recordedAt: baseline.recordedAt, metricChanges: baselineChanges };

  const followUpPoints: TimelinePoint[] = measurements
    .filter((m) => !m.isBaseline)
    .map((snapshot) => ({
      recordedAt: snapshot.recordedAt,
      metricChanges: withRawValues(computeMetricChanges(baseline, snapshot, configInputs, user.weightGoal), snapshot),
    }));

  return [baselinePoint, ...followUpPoints];
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
