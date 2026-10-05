-- CreateEnum
CREATE TYPE "FertilizerCategory" AS ENUM ('ORGANIC', 'SYNTHETIC', 'INTEGRATED');

-- CreateEnum
CREATE TYPE "OrganicFertilizerType" AS ENUM ('COMPOST', 'FARMYARD_MANURE', 'VERMICOMPOST', 'BIOFERTILIZER', 'GREEN_MANURE', 'OTHER');

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "fertilizerCategory" "FertilizerCategory",
ADD COLUMN     "organicFertilizerType" "OrganicFertilizerType",
ALTER COLUMN "fertilizerUsage" SET DEFAULT 'NOT_SPECIFIED';
