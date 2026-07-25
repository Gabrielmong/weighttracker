import { prisma } from '@/lib/prisma';
import { computeScoreBreakdown, calculateAge } from '@/features/scoring/score';
import { computeMetricChanges } from '@/features/scoring/metricChanges';
import { Gender, MeasurementSnapshot, MetricConfigInput, MetricKey, WeightGoal } from '@/features/scoring/types';

export interface LeaderboardFilters {
  gender?: Gender;
  scoreType?: 'RAW' | 'FINAL';
  minAge?: number;
  maxAge?: number;
  /** When set, ranks by this single metric's unhandicapped % change instead of the combined score (spec §7). */
  metricKey?: MetricKey;
}

export interface LeaderboardTimelinePoint {
  recordedAt: string;
  value: number;
}

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  rank: number;
  rawScore: number;
  finalScore: number;
  /** Present only when filters.metricKey is set. */
  metricPctChange?: number;
  /** One point per non-baseline snapshot, in the same value terms as rawScore/finalScore/metricPctChange above. */
  timeline: LeaderboardTimelinePoint[];
}

interface SnapshotWithDate extends MeasurementSnapshot {
  recordedAt: Date;
}

function computeSnapshotValue(params: {
  baseline: MeasurementSnapshot;
  snapshot: SnapshotWithDate;
  configInputs: MetricConfigInput[];
  weightGoal: WeightGoal;
  gender: Gender;
  age: number;
  brackets: Parameters<typeof computeScoreBreakdown>[0]['brackets'];
  conditionMultipliers: number[];
  metricKey?: MetricKey;
  scoreType?: 'RAW' | 'FINAL';
}): number | null {
  if (params.metricKey) {
    const changes = computeMetricChanges(params.baseline, params.snapshot, params.configInputs, params.weightGoal);
    const change = changes.find((c) => c.metricKey === params.metricKey);
    return change ? change.pctChange : null;
  }

  const breakdown = computeScoreBreakdown({
    baseline: params.baseline,
    current: params.snapshot,
    configs: params.configInputs,
    weightGoal: params.weightGoal,
    gender: params.gender,
    age: params.age,
    brackets: params.brackets,
    conditionMultipliers: params.conditionMultipliers,
  });
  return params.scoreType === 'RAW' ? breakdown.rawScore : breakdown.finalScore;
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
    // Use != null (not !== undefined) so an explicit GraphQL `null` variable
    // — sent verbatim by the client for "no filter", not omitted — isn't
    // mistaken for a real filter value. `age > null` coerces null to 0 and
    // is true for any positive age, which previously excluded every user.
    if (filters.minAge != null && age < filters.minAge) continue;
    if (filters.maxAge != null && age > filters.maxAge) continue;

    const baseline = user.measurements.find((m) => m.isBaseline);
    const nonBaseline = user.measurements
      .filter((m) => !m.isBaseline)
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    const latest = nonBaseline[nonBaseline.length - 1];
    if (!baseline || !latest) continue;

    const conditionMultipliers = user.conditions.map((uc) => uc.condition.multiplier);

    const timeline: LeaderboardTimelinePoint[] = [];
    for (const snapshot of nonBaseline) {
      const value = computeSnapshotValue({
        baseline,
        snapshot,
        configInputs,
        weightGoal: user.weightGoal,
        gender: user.gender,
        age,
        brackets,
        conditionMultipliers,
        metricKey: filters.metricKey,
        scoreType: filters.scoreType,
      });
      if (value !== null) {
        timeline.push({ recordedAt: snapshot.recordedAt.toISOString(), value });
      }
    }

    if (filters.metricKey) {
      // Per-metric leaderboard: single metric, unhandicapped, per spec §7.
      const change = computeMetricChanges(baseline, latest, configInputs, user.weightGoal).find(
        (c) => c.metricKey === filters.metricKey
      );
      if (!change) continue;
      rows.push({
        userId: user.id,
        displayName: user.displayName,
        rank: 0,
        rawScore: change.pctChange,
        finalScore: change.pctChange,
        metricPctChange: change.pctChange,
        timeline,
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
      conditionMultipliers,
    });

    rows.push({
      userId: user.id,
      displayName: user.displayName,
      rank: 0,
      rawScore: breakdown.rawScore,
      finalScore: breakdown.finalScore,
      timeline,
    });
  }

  const scoreKey = filters.scoreType === 'RAW' ? 'rawScore' : 'finalScore';
  rows.sort((a, b) => b[scoreKey] - a[scoreKey]);
  rows.forEach((row, index) => { row.rank = index + 1; });

  return rows;
}
