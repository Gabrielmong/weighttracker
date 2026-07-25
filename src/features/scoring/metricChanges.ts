import { getMetricValue } from './metricValues';
import { computeFixedPctChange, computeGoalRelativePctChange } from './pctChange';
import { MeasurementSnapshot, MetricConfigInput, MetricPctChange, WeightGoal } from './types';

export function computeMetricChanges(
  baseline: MeasurementSnapshot,
  current: MeasurementSnapshot,
  configs: MetricConfigInput[],
  weightGoal: WeightGoal
): MetricPctChange[] {
  const changes: MetricPctChange[] = [];

  for (const config of configs) {
    const baselineValue = getMetricValue(baseline, config.metricKey);
    const currentValue = getMetricValue(current, config.metricKey);
    if (baselineValue === null || currentValue === null) continue;

    const pctChange =
      config.directionType === 'GOAL_RELATIVE'
        ? computeGoalRelativePctChange(baselineValue, currentValue, weightGoal)
        : computeFixedPctChange(baselineValue, currentValue, config.fixedDirection ?? 'DOWN');

    changes.push({ metricKey: config.metricKey, pctChange });
  }

  return changes;
}
