/*
  Warnings:

  - The primary key for the `Assistant` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Assistant" DROP CONSTRAINT "Assistant_mentorId_fkey";

-- AlterTable
ALTER TABLE "Assistant" DROP CONSTRAINT "Assistant_pkey",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "Assistant_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Assistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
