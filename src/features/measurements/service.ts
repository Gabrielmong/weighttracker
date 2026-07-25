import { prisma } from '@/lib/prisma';

export interface RecordMeasurementInput {
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  subcutaneousFatPct: number;
  visceralFatRating: number;
  skeletalMusclePct: number;
  muscleMassKg: number;
  proteinPct?: number;
  bmr?: number;
  metabolicAge?: number;
  /** ISO date string. Defaults to now when omitted — lets a measurement be backdated. */
  recordedAt?: string;
}

export async function recordMeasurement(userId: string, challengeId: string, input: RecordMeasurementInput) {
  const { recordedAt, ...rest } = input;

  const created = await prisma.measurement.create({
    data: {
      userId,
      challengeId,
      ...rest,
      recordedAt: recordedAt ? new Date(recordedAt) : undefined,
      isBaseline: false,
    },
  });

  // Backdating means "first recorded" and "chronologically first" can
  // diverge — the baseline must always be the earliest measurement by date,
  // not whichever row happened to be inserted first.
  await recomputeBaseline(userId, challengeId);

  return prisma.measurement.findUniqueOrThrow({ where: { id: created.id } });
}

async function recomputeBaseline(userId: string, challengeId: string) {
  const measurements = await prisma.measurement.findMany({
    where: { userId, challengeId },
    orderBy: { recordedAt: 'asc' },
    select: { id: true },
  });
  if (measurements.length === 0) return;

  const earliestId = measurements[0].id;
  await prisma.$transaction([
    prisma.measurement.updateMany({
      where: { userId, challengeId, NOT: { id: earliestId } },
      data: { isBaseline: false },
    }),
    prisma.measurement.update({ where: { id: earliestId }, data: { isBaseline: true } }),
  ]);
}

export async function listMeasurementsForUser(userId: string, challengeId: string) {
  return prisma.measurement.findMany({
    where: { userId, challengeId },
    orderBy: { recordedAt: 'asc' },
  });
}
