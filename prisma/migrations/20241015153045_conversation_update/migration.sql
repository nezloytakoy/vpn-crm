/*
  Warnings:

  - You are about to drop the column `lastMessageAt` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "lastMessageAt",
ADD COLUMN     "lastUserMessageAt" TIMESTAMP(3);
