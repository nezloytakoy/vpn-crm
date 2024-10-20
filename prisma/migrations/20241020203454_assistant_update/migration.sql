-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Assistant"("telegramId") ON DELETE SET NULL ON UPDATE CASCADE;
