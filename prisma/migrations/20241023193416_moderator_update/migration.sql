-- AlterTable
ALTER TABLE "Moderator" ADD COLUMN     "assistantMessagesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userMessagesCount" INTEGER NOT NULL DEFAULT 0;
