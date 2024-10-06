/*
  Warnings:

  - The primary key for the `Assistant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Assistant` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AssistantRequest" DROP CONSTRAINT "AssistantRequest_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "AssistantRequest" DROP CONSTRAINT "AssistantRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Admin_id_seq";

-- AlterTable
ALTER TABLE "Assistant" DROP CONSTRAINT "Assistant_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Assistant_pkey" PRIMARY KEY ("telegramId");

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Invitation_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("telegramId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;
