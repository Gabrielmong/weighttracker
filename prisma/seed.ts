import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const challenge =
    (await prisma.challenge.findFirst({ where: { isActive: true } })) ??
    (await prisma.challenge.create({
      data: { name: 'Family Challenge 2026', startDate: new Date(), isActive: true },
    }));

  const defaultMetrics: Array<{
    metricKey:
      | 'WEIGHT' | 'BMI' | 'BODY_FAT_PCT' | 'SUBCUTANEOUS_FAT_PCT' | 'VISCERAL_FAT_RATING'
      | 'SKELETAL_MUSCLE_PCT' | 'MUSCLE_MASS_KG' | 'PROTEIN_PCT' | 'BMR' | 'METABOLIC_AGE';
    weight: number;
    directionType: 'FIXED' | 'GOAL_RELATIVE';
    fixedDirection: 'UP' | 'DOWN' | null;
  }> = [
    { metricKey: 'WEIGHT', weight: 1.0, directionType: 'GOAL_RELATIVE', fixedDirection: null },
    { metricKey: 'BMI', weight: 1.0, directionType: 'GOAL_RELATIVE', fixedDirection: null },
    { metricKey: 'BODY_FAT_PCT', weight: 1.5, directionType: 'FIXED', fixedDirection: 'DOWN' },
    { metricKey: 'SUBCUTANEOUS_FAT_PCT', weight: 1.0, directionType: 'FIXED', fixedDirection: 'DOWN' },
    { metricKey: 'VISCERAL_FAT_RATING', weight: 1.0, directionType: 'FIXED', fixedDirection: 'DOWN' },
    { metricKey: 'SKELETAL_MUSCLE_PCT', weight: 1.2, directionType: 'FIXED', fixedDirection: 'UP' },
    { metricKey: 'MUSCLE_MASS_KG', weight: 1.2, directionType: 'FIXED', fixedDirection: 'UP' },
    // Optional fields (only entered by users who have the equipment to measure
    // them) don't count toward the score — weight 0 means their contribution
    // is always zero, whether or not a user fills them in.
    { metricKey: 'PROTEIN_PCT', weight: 0, directionType: 'FIXED', fixedDirection: 'UP' },
    { metricKey: 'BMR', weight: 0, directionType: 'FIXED', fixedDirection: 'UP' },
    { metricKey: 'METABOLIC_AGE', weight: 0, directionType: 'FIXED', fixedDirection: 'DOWN' },
  ];

  for (const metric of defaultMetrics) {
    // Compound unique indexes can't be looked up with `null` as a key component
    // via Prisma's generated shorthand (SQL treats NULLs as distinct values), so
    // global-default rows (challengeId: null) must be found manually rather than
    // upserted by the compound key.
    const existing = await prisma.metricConfig.findFirst({
      where: { challengeId: null, metricKey: metric.metricKey },
    });
    if (existing) {
      await prisma.metricConfig.update({
        where: { id: existing.id },
        data: { weight: metric.weight, directionType: metric.directionType, fixedDirection: metric.fixedDirection },
      });
    } else {
      await prisma.metricConfig.create({ data: { ...metric, challengeId: null } });
    }
  }

  const brackets = [
    { gender: 'MALE' as const, minAge: 0, maxAge: 29, multiplier: 1.0 },
    { gender: 'MALE' as const, minAge: 30, maxAge: 44, multiplier: 1.05 },
    { gender: 'MALE' as const, minAge: 45, maxAge: 120, multiplier: 1.1 },
    { gender: 'FEMALE' as const, minAge: 0, maxAge: 29, multiplier: 1.05 },
    { gender: 'FEMALE' as const, minAge: 30, maxAge: 44, multiplier: 1.1 },
    { gender: 'FEMALE' as const, minAge: 45, maxAge: 120, multiplier: 1.2 },
  ];
  const existingBrackets = await prisma.handicapBracket.count();
  if (existingBrackets === 0) {
    for (const bracket of brackets) {
      await prisma.handicapBracket.create({ data: bracket });
    }
  }

  const adminPasswordHash = await bcrypt.hash('changeme123', 10);
  await prisma.user.upsert({
    where: { displayName: 'Gabriel' },
    update: {},
    create: {
      displayName: 'Gabriel',
      passwordHash: adminPasswordHash,
      gender: 'MALE',
      birthdate: new Date('1995-01-01'),
      weightGoal: 'LOSE',
      isAdmin: true,
    },
  });

  console.log('Seed complete:', { challengeId: challenge.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
