-- DropForeignKey
ALTER TABLE "Arbitration" DROP CONSTRAINT "Arbitration_moderatorId_fkey";

-- AlterTable
ALTER TABLE "Arbitration" ALTER COLUMN "moderatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Arbitration" ADD CONSTRAINT "Arbitration_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "Moderator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
