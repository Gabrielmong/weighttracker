import { describe, it, expect } from 'vitest';
import { calculateAge, findHandicapMultiplier } from './handicap';
import { HandicapBracketInput } from './types';

describe('calculateAge', () => {
  it('computes age when birthday already passed this year', () => {
    expect(calculateAge(new Date('1990-01-01'), new Date('2026-07-25'))).toBe(36);
  });

  it('computes age when birthday has not happened yet this year', () => {
    expect(calculateAge(new Date('1990-12-01'), new Date('2026-07-25'))).toBe(35);
  });

  it('handles the exact birthday date as already had the birthday', () => {
    expect(calculateAge(new Date('1990-07-25'), new Date('2026-07-25'))).toBe(36);
  });
});

describe('findHandicapMultiplier', () => {
  const brackets: HandicapBracketInput[] = [
    { gender: 'MALE', minAge: 0, maxAge: 29, multiplier: 1.0 },
    { gender: 'MALE', minAge: 30, maxAge: 44, multiplier: 1.05 },
    { gender: 'FEMALE', minAge: 0, maxAge: 29, multiplier: 1.05 },
    { gender: 'FEMALE', minAge: 45, maxAge: 120, multiplier: 1.2 },
  ];

  it('finds the matching bracket by gender and age', () => {
    expect(findHandicapMultiplier(brackets, 'MALE', 31)).toBe(1.05);
    expect(findHandicapMultiplier(brackets, 'FEMALE', 50)).toBe(1.2);
  });

  it('matches boundary ages inclusively', () => {
    expect(findHandicapMultiplier(brackets, 'MALE', 29)).toBe(1.0);
    expect(findHandicapMultiplier(brackets, 'MALE', 30)).toBe(1.05);
  });

  it('defaults to 1 when no bracket covers the age/gender', () => {
    expect(findHandicapMultiplier(brackets, 'FEMALE', 35)).toBe(1);
  });
});
