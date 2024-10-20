/*
  Warnings:

  - The primary key for the `Assistant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Assistant` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Assistant" DROP CONSTRAINT "Assistant_mentorId_fkey";

-- AlterTable
ALTER TABLE "Assistant" DROP CONSTRAINT "Assistant_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Assistant_pkey" PRIMARY KEY ("telegramId");

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Assistant"("telegramId") ON DELETE SET NULL ON UPDATE CASCADE;
