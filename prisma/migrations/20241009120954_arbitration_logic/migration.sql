-- CreateEnum
CREATE TYPE "ArbitrationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Arbitration" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "assistantId" BIGINT NOT NULL,
    "moderatorId" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "decision" TEXT,
    "status" "ArbitrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arbitration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Arbitration" ADD CONSTRAINT "Arbitration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arbitration" ADD CONSTRAINT "Arbitration_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arbitration" ADD CONSTRAINT "Arbitration_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "Moderator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
