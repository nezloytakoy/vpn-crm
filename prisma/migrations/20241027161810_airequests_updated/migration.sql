/*
  Warnings:

  - You are about to drop the column `requestCount` on the `AIRequests` table. All the data in the column will be lost.
  - Added the required column `aiRequestCount` to the `AIRequests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assistantRequestCount` to the `AIRequests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AIRequests" DROP COLUMN "requestCount",
ADD COLUMN     "aiRequestCount" INTEGER NOT NULL,
ADD COLUMN     "assistantRequestCount" INTEGER NOT NULL;
