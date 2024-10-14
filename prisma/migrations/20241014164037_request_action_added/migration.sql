-- CreateTable
CREATE TABLE "RequestAction" (
    "id" BIGSERIAL NOT NULL,
    "requestId" BIGINT NOT NULL,
    "assistantId" BIGINT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestAction" ADD CONSTRAINT "RequestAction_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAction" ADD CONSTRAINT "RequestAction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AssistantRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
