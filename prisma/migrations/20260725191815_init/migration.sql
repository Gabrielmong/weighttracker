-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "WeightGoal" AS ENUM ('LOSE', 'GAIN', 'MAINTAIN');

-- CreateEnum
CREATE TYPE "MetricKey" AS ENUM ('WEIGHT', 'BMI', 'BODY_FAT_PCT', 'SUBCUTANEOUS_FAT_PCT', 'VISCERAL_FAT_RATING', 'SKELETAL_MUSCLE_PCT', 'MUSCLE_MASS_KG', 'PROTEIN_PCT', 'BMR', 'METABOLIC_AGE');

-- CreateEnum
CREATE TYPE "DirectionType" AS ENUM ('FIXED', 'GOAL_RELATIVE');

-- CreateEnum
CREATE TYPE "FixedDirection" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "weightGoal" "WeightGoal" NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "bodyFatPct" DOUBLE PRECISION NOT NULL,
    "subcutaneousFatPct" DOUBLE PRECISION NOT NULL,
    "visceralFatRating" DOUBLE PRECISION NOT NULL,
    "skeletalMusclePct" DOUBLE PRECISION NOT NULL,
    "muscleMassKg" DOUBLE PRECISION NOT NULL,
    "proteinPct" DOUBLE PRECISION,
    "bmr" DOUBLE PRECISION,
    "metabolicAge" INTEGER,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricConfig" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT,
    "metricKey" "MetricKey" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "directionType" "DirectionType" NOT NULL,
    "fixedDirection" "FixedDirection",

    CONSTRAINT "MetricConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandicapBracket" (
    "id" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HandicapBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "multiplier" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCondition" (
    "userId" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,

    CONSTRAINT "UserCondition_pkey" PRIMARY KEY ("userId","conditionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_displayName_key" ON "User"("displayName");

-- CreateIndex
CREATE INDEX "Measurement_userId_challengeId_recordedAt_idx" ON "Measurement"("userId", "challengeId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetricConfig_challengeId_metricKey_key" ON "MetricConfig"("challengeId", "metricKey");

-- CreateIndex
CREATE UNIQUE INDEX "Condition_name_key" ON "Condition"("name");

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCondition" ADD CONSTRAINT "UserCondition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCondition" ADD CONSTRAINT "UserCondition_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
