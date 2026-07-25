import { computeMetricChanges } from './metricChanges';
import { calculateAge, findHandicapMultiplier } from './handicap';
import {
  Gender,
  HandicapBracketInput,
  MeasurementSnapshot,
  MetricConfigInput,
  MetricPctChange,
  ScoreBreakdown,
  WeightGoal,
} from './types';

export function computeRawScore(changes: MetricPctChange[], configs: MetricConfigInput[]): number {
  const weightByKey = new Map(configs.map((c) => [c.metricKey, c.weight]));
  return changes.reduce((sum, change) => sum + change.pctChange * (weightByKey.get(change.metricKey) ?? 0), 0);
}

export function computeFinalScore(rawScore: number, ageGenderMultiplier: number, conditionMultipliers: number[]): number {
  const conditionProduct = conditionMultipliers.reduce((product, multiplier) => product * multiplier, 1);
  return rawScore * ageGenderMultiplier * conditionProduct;
}

export function computeScoreBreakdown(params: {
  baseline: MeasurementSnapshot;
  current: MeasurementSnapshot;
  configs: MetricConfigInput[];
  weightGoal: WeightGoal;
  gender: Gender;
  age: number;
  brackets: HandicapBracketInput[];
  conditionMultipliers: number[];
}): ScoreBreakdown {
  const metricChanges = computeMetricChanges(params.baseline, params.current, params.configs, params.weightGoal);
  const rawScore = computeRawScore(metricChanges, params.configs);
  const ageGenderMultiplier = findHandicapMultiplier(params.brackets, params.gender, params.age);
  const finalScore = computeFinalScore(rawScore, ageGenderMultiplier, params.conditionMultipliers);

  return {
    metricChanges,
    rawScore,
    ageGenderMultiplier,
    conditionMultipliers: params.conditionMultipliers,
    finalScore,
  };
}

export { calculateAge };
