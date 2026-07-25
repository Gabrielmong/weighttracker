import { FixedDirection, WeightGoal } from './types';

export function computeFixedPctChange(baseline: number, current: number, direction: FixedDirection): number {
  if (baseline === 0) return 0;
  const rawPct = ((current - baseline) / baseline) * 100;
  const directionSign = direction === 'UP' ? 1 : -1;
  return rawPct * directionSign;
}

export function computeGoalRelativePctChange(baseline: number, current: number, goal: WeightGoal): number {
  if (baseline === 0) return 0;
  const rawPct = ((current - baseline) / baseline) * 100;
  if (goal === 'LOSE') return -rawPct;
  if (goal === 'GAIN') return rawPct;
  return -Math.abs(rawPct) || 0; // normalize -0 to 0 (Math.abs(0) === 0, so -0 can leak out here)
}
