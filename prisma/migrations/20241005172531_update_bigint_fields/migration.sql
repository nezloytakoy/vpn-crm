/*
  Warnings:

  - Changed the type of `telegramId` on the `Assistant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `telegramId` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Assistant" DROP COLUMN "telegramId",
ADD COLUMN     "telegramId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "AssistantRequest" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "telegramId",
ADD COLUMN     "telegramId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Assistant_telegramId_key" ON "Assistant"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
