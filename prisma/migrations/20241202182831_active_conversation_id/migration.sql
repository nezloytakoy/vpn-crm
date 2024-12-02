/*
  Warnings:

  - A unique constraint covering the columns `[activeConversationId]` on the table `Assistant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Assistant_activeConversationId_key" ON "Assistant"("activeConversationId");

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_activeConversationId_fkey" FOREIGN KEY ("activeConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
