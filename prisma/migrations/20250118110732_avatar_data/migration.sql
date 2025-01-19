/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Moderator` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Moderator" DROP COLUMN "avatarUrl",
ADD COLUMN     "avatarData" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUrl",
ADD COLUMN     "avatarData" TEXT;
