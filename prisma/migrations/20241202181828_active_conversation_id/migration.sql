/*
  Warnings:

  - You are about to drop the column `activeRequestId` on the `Assistant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assistant" DROP COLUMN "activeRequestId",
ADD COLUMN     "activeConversationId" BIGINT;
