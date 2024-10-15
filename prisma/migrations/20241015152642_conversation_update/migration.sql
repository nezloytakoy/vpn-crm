-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "assistantResponseTimes" JSONB NOT NULL DEFAULT '[]';
