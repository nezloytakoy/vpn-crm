-- AlterTable
ALTER TABLE "Rewards" ADD COLUMN     "periodRequestCount" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "referralPeriodRequestCount" INTEGER NOT NULL DEFAULT 10;
