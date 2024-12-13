-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_assistantId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "assistantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("telegramId") ON DELETE SET NULL ON UPDATE CASCADE;
