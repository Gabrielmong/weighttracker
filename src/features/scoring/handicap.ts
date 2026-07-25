import { Gender, HandicapBracketInput } from './types';

export function calculateAge(birthdate: Date, asOf: Date): number {
  let age = asOf.getFullYear() - birthdate.getFullYear();
  const hasHadBirthdayThisYear =
    asOf.getMonth() > birthdate.getMonth() ||
    (asOf.getMonth() === birthdate.getMonth() && asOf.getDate() >= birthdate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function findHandicapMultiplier(brackets: HandicapBracketInput[], gender: Gender, age: number): number {
  const match = brackets.find((b) => b.gender === gender && age >= b.minAge && age <= b.maxAge);
  return match?.multiplier ?? 1;
}
