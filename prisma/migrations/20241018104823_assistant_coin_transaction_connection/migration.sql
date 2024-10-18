-- CreateTable
CREATE TABLE "AssistantCoinTransaction" (
    "id" BIGSERIAL NOT NULL,
    "assistantId" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantCoinTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssistantCoinTransaction" ADD CONSTRAINT "AssistantCoinTransaction_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;
