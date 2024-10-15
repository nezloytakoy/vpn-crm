/*
  Warnings:

  - A unique constraint covering the columns `[requestId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requestId` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "requestId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_requestId_key" ON "Conversation"("requestId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AssistantRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
