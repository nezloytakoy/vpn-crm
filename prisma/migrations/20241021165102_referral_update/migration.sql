/*
  Warnings:

  - You are about to drop the column `referredUserId` on the `Referral` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referredUserId_fkey";

-- DropIndex
DROP INDEX "Referral_referredUserId_key";

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "referredUserId",
ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false;
