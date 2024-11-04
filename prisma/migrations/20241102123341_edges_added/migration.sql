/*
  Warnings:

  - You are about to drop the column `maxIgnores` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `maxRejects` on the `Assistant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assistant" DROP COLUMN "maxIgnores",
DROP COLUMN "maxRejects";

-- CreateTable
CREATE TABLE "Edges" (
    "id" SERIAL NOT NULL,
    "maxRejects" INTEGER NOT NULL DEFAULT 7,
    "maxIgnores" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "Edges_pkey" PRIMARY KEY ("id")
);
