/*
  Warnings:

  - You are about to drop the column `seconds` on the `RequestDuration` table. All the data in the column will be lost.
  - Added the required column `minutes` to the `RequestDuration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestDuration" DROP COLUMN "seconds",
ADD COLUMN     "minutes" INTEGER NOT NULL;
