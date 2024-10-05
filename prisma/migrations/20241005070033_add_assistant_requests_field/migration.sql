-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('FREE', 'FIRST', 'SECOND', 'THIRD', 'FOURTH');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'FREE',
    "hasUpdatedSubscription" BOOLEAN NOT NULL DEFAULT false,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "aiRequests" INTEGER NOT NULL DEFAULT 0,
    "assistantRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
