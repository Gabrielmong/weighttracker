export type Gender = 'MALE' | 'FEMALE';
export type WeightGoal = 'LOSE' | 'GAIN' | 'MAINTAIN';

export type MetricKey =
  | 'WEIGHT'
  | 'BMI'
  | 'BODY_FAT_PCT'
  | 'SUBCUTANEOUS_FAT_PCT'
  | 'VISCERAL_FAT_RATING'
  | 'SKELETAL_MUSCLE_PCT'
  | 'MUSCLE_MASS_KG'
  | 'PROTEIN_PCT'
  | 'BMR'
  | 'METABOLIC_AGE';

export type DirectionType = 'FIXED' | 'GOAL_RELATIVE';
export type FixedDirection = 'UP' | 'DOWN';

export interface MetricConfigInput {
  metricKey: MetricKey;
  weight: number;
  directionType: DirectionType;
  fixedDirection: FixedDirection | null;
}

export interface MeasurementSnapshot {
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  subcutaneousFatPct: number;
  visceralFatRating: number;
  skeletalMusclePct: number;
  muscleMassKg: number;
  proteinPct: number | null;
  bmr: number | null;
  metabolicAge: number | null;
}

export interface MetricPctChange {
  metricKey: MetricKey;
  pctChange: number;
}

export interface ScoredMetricChange extends MetricPctChange {
  weight: number;
  /** pctChange * weight — this metric's contribution to the raw score. */
  contribution: number;
}

export interface HandicapBracketInput {
  gender: Gender;
  minAge: number;
  maxAge: number;
  multiplier: number;
}

export interface ScoreBreakdown {
  metricChanges: ScoredMetricChange[];
  rawScore: number;
  ageGenderMultiplier: number;
  conditionMultipliers: number[];
  finalScore: number;
}
