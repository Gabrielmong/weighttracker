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
}

export async function recordMeasurement(userId: string, challengeId: string, input: RecordMeasurementInput) {
  const existingCount = await prisma.measurement.count({ where: { userId, challengeId } });
  return prisma.measurement.create({
    data: {
      userId,
      challengeId,
      ...input,
      isBaseline: existingCount === 0,
    },
  });
}

export async function listMeasurementsForUser(userId: string, challengeId: string) {
  return prisma.measurement.findMany({
    where: { userId, challengeId },
    orderBy: { recordedAt: 'asc' },
  });
}
