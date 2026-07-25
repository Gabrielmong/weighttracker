import { describe, it, expect } from 'vitest';
import { computeMetricChanges } from './metricChanges';
import { MeasurementSnapshot, MetricConfigInput } from './types';

const baseline: MeasurementSnapshot = {
  weightKg: 90, bmi: 28, bodyFatPct: 25, subcutaneousFatPct: 18, visceralFatRating: 10,
  skeletalMusclePct: 32, muscleMassKg: 28, proteinPct: 16, bmr: null, metabolicAge: null,
};
const current: MeasurementSnapshot = {
  weightKg: 85, bmi: 26, bodyFatPct: 20, subcutaneousFatPct: 16, visceralFatRating: 8,
  skeletalMusclePct: 34, muscleMassKg: 29, proteinPct: 18, bmr: 1600, metabolicAge: 28,
};

const configs: MetricConfigInput[] = [
  { metricKey: 'WEIGHT', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
  { metricKey: 'BMI', weight: 1, directionType: 'GOAL_RELATIVE', fixedDirection: null },
  { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
  { metricKey: 'MUSCLE_MASS_KG', weight: 1.2, directionType: 'FIXED', fixedDirection: 'UP' },
  { metricKey: 'PROTEIN_PCT', weight: 0.5, directionType: 'FIXED', fixedDirection: 'UP' },
];

describe('computeMetricChanges', () => {
  it('computes a change per configured metric for a LOSE goal', () => {
    const changes = computeMetricChanges(baseline, current, configs, 'LOSE');
    const byKey = Object.fromEntries(changes.map((c) => [c.metricKey, c.pctChange]));
    expect(byKey.WEIGHT).toBeCloseTo(5.5556, 3); // lost weight, goal LOSE -> positive
    expect(byKey.BODY_FAT_PCT).toBeCloseTo(20, 3); // fat dropped 25 -> 20
    expect(byKey.MUSCLE_MASS_KG).toBeCloseTo(3.5714, 3); // muscle gained
    expect(byKey.PROTEIN_PCT).toBeCloseTo(12.5, 3); // optional field present at both ends: (18-16)/16*100
  });

  it('excludes an optional metric missing at baseline', () => {
    const baselineNoProtein = { ...baseline, proteinPct: null };
    const changes = computeMetricChanges(baselineNoProtein, current, configs, 'LOSE');
    expect(changes.find((c) => c.metricKey === 'PROTEIN_PCT')).toBeUndefined();
  });

  it('excludes an optional metric missing at current', () => {
    const currentNoProtein = { ...current, proteinPct: null };
    const changes = computeMetricChanges(baseline, currentNoProtein, configs, 'LOSE');
    expect(changes.find((c) => c.metricKey === 'PROTEIN_PCT')).toBeUndefined();
  });

  it('flips WEIGHT/BMI direction for a GAIN goal', () => {
    const changes = computeMetricChanges(baseline, current, configs, 'GAIN');
    const byKey = Object.fromEntries(changes.map((c) => [c.metricKey, c.pctChange]));
    expect(byKey.WEIGHT).toBeCloseTo(-5.5556, 3); // lost weight, goal GAIN -> negative
  });
});
