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
