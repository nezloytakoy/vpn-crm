/*
  Warnings:

  - You are about to drop the `CoinTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CoinTransaction" DROP CONSTRAINT "CoinTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_userId_fkey";

-- DropTable
DROP TABLE "CoinTransaction";

-- DropTable
DROP TABLE "Request";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "RequestStatus";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
