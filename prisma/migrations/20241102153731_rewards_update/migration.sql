-- AlterTable
ALTER TABLE "Rewards" ADD COLUMN     "isPermanentBonus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPermanentReferral" BOOLEAN NOT NULL DEFAULT false;
