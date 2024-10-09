/*
  Warnings:

  - You are about to drop the column `telegramId` on the `Moderator` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Moderator` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Moderator_telegramId_key";

-- AlterTable
ALTER TABLE "Moderator" DROP COLUMN "telegramId",
ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_id_key" ON "Moderator"("id");
