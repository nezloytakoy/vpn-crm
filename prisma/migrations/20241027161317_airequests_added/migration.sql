-- CreateTable
CREATE TABLE "AIRequests" (
    "id" BIGSERIAL NOT NULL,
    "subscriptionType" "SubscriptionType" NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIRequests_subscriptionType_key" ON "AIRequests"("subscriptionType");
