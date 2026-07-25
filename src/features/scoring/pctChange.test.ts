import { describe, it, expect } from 'vitest';
import { computeFixedPctChange, computeGoalRelativePctChange } from './pctChange';

describe('computeFixedPctChange', () => {
  it('scores a decrease as positive when direction is DOWN (e.g. body fat %)', () => {
    expect(computeFixedPctChange(20, 15, 'DOWN')).toBeCloseTo(25, 5); // dropped 25% of baseline
  });

  it('scores an increase as negative when direction is DOWN', () => {
    expect(computeFixedPctChange(20, 22, 'DOWN')).toBeCloseTo(-10, 5);
  });

  it('scores an increase as positive when direction is UP (e.g. muscle mass)', () => {
    expect(computeFixedPctChange(30, 33, 'UP')).toBeCloseTo(10, 5);
  });

  it('scores a decrease as negative when direction is UP', () => {
    expect(computeFixedPctChange(30, 27, 'UP')).toBeCloseTo(-10, 5);
  });

  it('guards against a zero baseline', () => {
    expect(computeFixedPctChange(0, 5, 'UP')).toBe(0);
  });
});

describe('computeGoalRelativePctChange', () => {
  it('LOSE: scores a decrease as positive', () => {
    expect(computeGoalRelativePctChange(100, 90, 'LOSE')).toBeCloseTo(10, 5);
  });

  it('LOSE: scores an increase as negative', () => {
    expect(computeGoalRelativePctChange(100, 105, 'LOSE')).toBeCloseTo(-5, 5);
  });

  it('GAIN: scores an increase as positive', () => {
    expect(computeGoalRelativePctChange(100, 108, 'GAIN')).toBeCloseTo(8, 5);
  });

  it('GAIN: scores a decrease as negative', () => {
    expect(computeGoalRelativePctChange(100, 95, 'GAIN')).toBeCloseTo(-5, 5);
  });

  it('MAINTAIN: penalizes drift in either direction', () => {
    expect(computeGoalRelativePctChange(100, 105, 'MAINTAIN')).toBeCloseTo(-5, 5);
    expect(computeGoalRelativePctChange(100, 95, 'MAINTAIN')).toBeCloseTo(-5, 5);
  });

  it('MAINTAIN: no drift scores zero', () => {
    expect(computeGoalRelativePctChange(100, 100, 'MAINTAIN')).toBe(0);
  });

  it('guards against a zero baseline', () => {
    expect(computeGoalRelativePctChange(0, 5, 'LOSE')).toBe(0);
  });
});
