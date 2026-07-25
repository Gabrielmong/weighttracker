import { describe, it, expect } from 'vitest';
import { computeRawScore, computeFinalScore, computeScoreBreakdown } from './score';
import { MeasurementSnapshot, MetricConfigInput, MetricPctChange, HandicapBracketInput } from './types';

describe('computeRawScore', () => {
  it('sums weighted pct changes', () => {
    const changes: MetricPctChange[] = [
      { metricKey: 'WEIGHT', pctChange: 5 },
      { metricKey: 'BODY_FAT_PCT', pctChange: 20 },
    ];
    const configs: MetricConfigInput[] = [
      { metricKey: 'WEIGHT', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
      { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
    ];
    expect(computeRawScore(changes, configs)).toBeCloseTo(5 * 1 + 20 * 1.5, 5);
  });

  it('treats an unconfigured metric as weight 0', () => {
    const changes: MetricPctChange[] = [{ metricKey: 'BMR', pctChange: 10 }];
    expect(computeRawScore(changes, [])).toBe(0);
  });
});

describe('computeFinalScore', () => {
  it('applies the age/gender multiplier with no conditions', () => {
    expect(computeFinalScore(100, 1.1, [])).toBeCloseTo(110, 5);
  });

  it('stacks multiple condition multipliers multiplicatively', () => {
    expect(computeFinalScore(100, 1.1, [1.2, 1.05])).toBeCloseTo(100 * 1.1 * 1.2 * 1.05, 5);
  });
});

describe('computeScoreBreakdown', () => {
  const baseline: MeasurementSnapshot = {
    weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18, visceralFatRating: 10,
    skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: null, bmr: null, metabolicAge: null,
  };
  const current: MeasurementSnapshot = {
    weightKg: 85, bmi: 26, bodyFatPct: 20, subcutaneousFatPct: 16, visceralFatRating: 8,
    skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: null, bmr: null, metabolicAge: null,
  };
  const configs: MetricConfigInput[] = [
    { metricKey: 'WEIGHT', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
    { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
  ];
  const brackets: HandicapBracketInput[] = [{ gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.2 }];

  it('combines metric changes, raw score, handicap, and conditions end-to-end', () => {
    const result = computeScoreBreakdown({
      baseline,
      current,
      configs,
      weightGoal: 'LOSE',
      gender: 'FEMALE',
      age: 50,
      brackets,
      conditionMultipliers: [1.1],
    });

    expect(result.metricChanges).toHaveLength(2);
    expect(result.ageGenderMultiplier).toBe(1.2);
    expect(result.conditionMultipliers).toEqual([1.1]);

    const bodyFat = result.metricChanges.find((c) => c.metricKey === 'BODY_FAT_PCT')!;
    expect(bodyFat.weight).toBe(1.5);
    expect(bodyFat.contribution).toBeCloseTo(bodyFat.pctChange * 1.5, 5);
    const sumOfContributions = result.metricChanges.reduce((sum, c) => sum + c.contribution, 0);
    expect(sumOfContributions).toBeCloseTo(result.rawScore, 5);
    expect(result.finalScore).toBeCloseTo(result.rawScore * 1.2 * 1.1, 5);
  });
});
