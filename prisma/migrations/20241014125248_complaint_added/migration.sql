-- CreateTable
CREATE TABLE "Complaint" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "assistantId" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);
