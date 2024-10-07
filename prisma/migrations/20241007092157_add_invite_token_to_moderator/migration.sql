/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Moderator` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Moderator" ADD COLUMN     "inviteToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_inviteToken_key" ON "Moderator"("inviteToken");
