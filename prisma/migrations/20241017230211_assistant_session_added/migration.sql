-- CreateTable
CREATE TABLE "AssistantSession" (
    "id" BIGSERIAL NOT NULL,
    "assistantId" BIGINT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AssistantSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssistantSession" ADD CONSTRAINT "AssistantSession_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;
