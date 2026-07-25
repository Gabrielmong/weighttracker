import { MeasurementSnapshot, MetricKey } from './types';

export function getMetricValue(snapshot: MeasurementSnapshot, key: MetricKey): number | null {
  switch (key) {
    case 'WEIGHT':
      return snapshot.weightKg;
    case 'BMI':
      return snapshot.bmi;
    case 'BODY_FAT_PCT':
      return snapshot.bodyFatPct;
    case 'SUBCUTANEOUS_FAT_PCT':
      return snapshot.subcutaneousFatPct;
    case 'VISCERAL_FAT_RATING':
      return snapshot.visceralFatRating;
    case 'SKELETAL_MUSCLE_PCT':
      return snapshot.skeletalMusclePct;
    case 'MUSCLE_MASS_KG':
      return snapshot.muscleMassKg;
    case 'PROTEIN_PCT':
      return snapshot.proteinPct;
    case 'BMR':
      return snapshot.bmr;
    case 'METABOLIC_AGE':
      return snapshot.metabolicAge;
  }
}
