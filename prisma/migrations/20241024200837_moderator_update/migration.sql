/*
  Warnings:

  - You are about to drop the `Arbitration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Arbitration" DROP CONSTRAINT "Arbitration_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "Arbitration" DROP CONSTRAINT "Arbitration_moderatorId_fkey";

-- DropForeignKey
ALTER TABLE "Arbitration" DROP CONSTRAINT "Arbitration_userId_fkey";

-- AlterTable
ALTER TABLE "Moderator" ADD COLUMN     "arbitrations" BIGINT[];

-- DropTable
DROP TABLE "Arbitration";

-- DropEnum
DROP TYPE "ArbitrationStatus";
