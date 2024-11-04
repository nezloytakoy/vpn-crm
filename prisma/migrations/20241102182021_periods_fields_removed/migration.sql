/*
  Warnings:

  - You are about to drop the column `periodRequestCount` on the `Rewards` table. All the data in the column will be lost.
  - You are about to drop the column `referralPeriodRequestCount` on the `Rewards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Rewards" DROP COLUMN "periodRequestCount",
DROP COLUMN "referralPeriodRequestCount";
