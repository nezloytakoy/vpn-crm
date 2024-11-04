/*
  Warnings:

  - You are about to drop the column `maxRequests` on the `OpenAi` table. All the data in the column will be lost.
  - You are about to drop the column `promt` on the `OpenAi` table. All the data in the column will be lost.
  - Added the required column `maxTokensPerRequest` to the `OpenAi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `OpenAi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OpenAi" DROP COLUMN "maxRequests",
DROP COLUMN "promt",
ADD COLUMN     "maxTokensPerRequest" INTEGER NOT NULL,
ADD COLUMN     "prompt" TEXT NOT NULL;
