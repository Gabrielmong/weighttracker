import { prisma } from '@/lib/prisma';
import { DirectionType, FixedDirection, Gender, MetricKey } from '@prisma/client';

export async function updateMetricConfig(input: {
  metricKey: MetricKey;
  weight: number;
  directionType: DirectionType;
  fixedDirection: FixedDirection | null;
}) {
  // Same limitation as prisma/seed.ts: a compound unique index can't be
  // looked up with `null` as a key component via Prisma's generated
  // shorthand, so global-default rows (challengeId: null) must be found
  // manually rather than upserted by the compound key.
  const existing = await prisma.metricConfig.findFirst({
    where: { challengeId: null, metricKey: input.metricKey },
  });
  if (existing) {
    return prisma.metricConfig.update({
      where: { id: existing.id },
      data: { weight: input.weight, directionType: input.directionType, fixedDirection: input.fixedDirection },
    });
  }
  return prisma.metricConfig.create({ data: { ...input, challengeId: null } });
}

export async function upsertHandicapBracket(input: {
  id?: string;
  gender: Gender;
  minAge: number;
  maxAge: number;
  multiplier: number;
}) {
  if (input.id) {
    return prisma.handicapBracket.update({ where: { id: input.id }, data: input });
  }
  return prisma.handicapBracket.create({ data: input });
}

export async function deleteHandicapBracket(id: string) {
  return prisma.handicapBracket.delete({ where: { id } });
}

export async function createCondition(input: { name: string; description?: string; multiplier: number }) {
  return prisma.condition.create({ data: { name: input.name, description: input.description ?? null, multiplier: input.multiplier } });
}

export async function updateCondition(input: { id: string; name: string; description?: string; multiplier: number }) {
  return prisma.condition.update({
    where: { id: input.id },
    data: { name: input.name, description: input.description ?? null, multiplier: input.multiplier },
  });
}

export async function deleteCondition(id: string) {
  return prisma.condition.delete({ where: { id } });
}

export async function assignConditionToUser(userId: string, conditionId: string) {
  return prisma.userCondition.upsert({
    where: { userId_conditionId: { userId, conditionId } },
    update: {},
    create: { userId, conditionId },
  });
}

export async function unassignConditionFromUser(userId: string, conditionId: string) {
  return prisma.userCondition.delete({ where: { userId_conditionId: { userId, conditionId } } });
}

export async function endChallenge(challengeId: string) {
  return prisma.challenge.update({ where: { id: challengeId }, data: { isActive: false, endDate: new Date() } });
}

export async function startChallenge(input: { name: string; startDate: string }) {
  await prisma.challenge.updateMany({ where: { isActive: true }, data: { isActive: false, endDate: new Date() } });
  return prisma.challenge.create({ data: { name: input.name, startDate: new Date(input.startDate), isActive: true } });
}
