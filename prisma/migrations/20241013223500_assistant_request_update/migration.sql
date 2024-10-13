-- DropForeignKey
ALTER TABLE "AssistantRequest" DROP CONSTRAINT "AssistantRequest_assistantId_fkey";

-- AlterTable
ALTER TABLE "AssistantRequest" ALTER COLUMN "assistantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("telegramId") ON DELETE SET NULL ON UPDATE CASCADE;
