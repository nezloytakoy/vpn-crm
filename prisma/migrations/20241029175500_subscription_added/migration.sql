/*
  Warnings:

  - You are about to drop the column `subscriptionType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AIRequests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tariff` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "subscriptionType",
ADD COLUMN     "lastPaidSubscriptionId" BIGINT;

-- DropTable
DROP TABLE "AIRequests";

-- DropTable
DROP TABLE "Tariff";

-- DropEnum
DROP TYPE "SubscriptionType";

-- CreateTable
CREATE TABLE "Subscription" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "allowVoiceToAI" BOOLEAN NOT NULL DEFAULT false,
    "allowVoiceToAssistant" BOOLEAN NOT NULL DEFAULT false,
    "allowVideoToAssistant" BOOLEAN NOT NULL DEFAULT false,
    "allowFilesToAssistant" BOOLEAN NOT NULL DEFAULT false,
    "aiRequestCount" INTEGER NOT NULL,
    "assistantRequestCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastPaidSubscriptionId_fkey" FOREIGN KEY ("lastPaidSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
