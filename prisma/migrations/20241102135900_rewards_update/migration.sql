-- AlterTable
ALTER TABLE "Rewards" ADD COLUMN     "referralRequestCount" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "rewardRequestCount" INTEGER NOT NULL DEFAULT 10;
