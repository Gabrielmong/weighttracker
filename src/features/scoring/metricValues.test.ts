import { describe, it, expect } from 'vitest';
import { getMetricValue } from './metricValues';
import { MeasurementSnapshot } from './types';

const snapshot: MeasurementSnapshot = {
  weightKg: 80,
  bmi: 25,
  bodyFatPct: 20,
  subcutaneousFatPct: 15,
  visceralFatRating: 8,
  skeletalMusclePct: 35,
  muscleMassKg: 30,
  proteinPct: 17,
  bmr: 1700,
  metabolicAge: 30,
};

describe('getMetricValue', () => {
  it('reads required fields', () => {
    expect(getMetricValue(snapshot, 'WEIGHT')).toBe(80);
    expect(getMetricValue(snapshot, 'BODY_FAT_PCT')).toBe(20);
    expect(getMetricValue(snapshot, 'MUSCLE_MASS_KG')).toBe(30);
  });

  it('reads optional fields when present', () => {
    expect(getMetricValue(snapshot, 'PROTEIN_PCT')).toBe(17);
    expect(getMetricValue(snapshot, 'BMR')).toBe(1700);
    expect(getMetricValue(snapshot, 'METABOLIC_AGE')).toBe(30);
  });

  it('returns null for missing optional fields', () => {
    const partial: MeasurementSnapshot = { ...snapshot, proteinPct: null, bmr: null, metabolicAge: null };
    expect(getMetricValue(partial, 'PROTEIN_PCT')).toBeNull();
    expect(getMetricValue(partial, 'BMR')).toBeNull();
    expect(getMetricValue(partial, 'METABOLIC_AGE')).toBeNull();
  });
});
