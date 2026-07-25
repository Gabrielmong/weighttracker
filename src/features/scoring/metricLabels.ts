import { MetricKey } from './types';

export const METRIC_LABELS: Record<MetricKey, string> = {
  WEIGHT: 'Peso',
  BMI: 'IMC',
  BODY_FAT_PCT: '% Grasa Corporal',
  SUBCUTANEOUS_FAT_PCT: '% Grasa Subcutánea',
  VISCERAL_FAT_RATING: 'Nivel de Grasa Visceral',
  SKELETAL_MUSCLE_PCT: '% Músculo Esquelético',
  MUSCLE_MASS_KG: 'Masa Muscular',
  PROTEIN_PCT: '% Proteína',
  BMR: 'TMB',
  METABOLIC_AGE: 'Edad Metabólica',
};
