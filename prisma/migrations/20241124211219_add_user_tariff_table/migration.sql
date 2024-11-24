-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "UserTariff" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "tariffId" BIGINT NOT NULL,
    "totalAssistantRequests" INTEGER NOT NULL,
    "totalAIRequests" INTEGER NOT NULL,
    "remainingAssistantRequests" INTEGER NOT NULL,
    "remainingAIRequests" INTEGER NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTariff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserTariff" ADD CONSTRAINT "UserTariff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTariff" ADD CONSTRAINT "UserTariff_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
