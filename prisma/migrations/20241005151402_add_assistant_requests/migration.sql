-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "AssistantRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "assistantId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
