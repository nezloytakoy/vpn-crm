/*
  Warnings:

  - You are about to drop the column `arbitrations` on the `Moderator` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "moderatorId" BIGINT;

-- AlterTable
ALTER TABLE "Moderator" DROP COLUMN "arbitrations";

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "Moderator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
