-- AlterTable
ALTER TABLE "Arbitration" ADD COLUMN     "ignoredModerators" BIGINT[] DEFAULT ARRAY[]::BIGINT[];
