-- AlterTable
ALTER TABLE "Assistant" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unblockDate" TIMESTAMP(3);
