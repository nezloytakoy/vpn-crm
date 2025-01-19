/*
  Warnings:

  - The `avatarData` column on the `Moderator` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `avatarData` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Moderator" DROP COLUMN "avatarData",
ADD COLUMN     "avatarData" BYTEA;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarData",
ADD COLUMN     "avatarData" BYTEA;
