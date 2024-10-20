-- AlterTable
ALTER TABLE "Assistant" ADD COLUMN     "mentorId" BIGINT;

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Assistant"("telegramId") ON DELETE SET NULL ON UPDATE CASCADE;
