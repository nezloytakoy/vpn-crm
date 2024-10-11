-- AlterTable
ALTER TABLE "WithdrawalRequest" ADD COLUMN     "userNickname" TEXT,
ADD COLUMN     "userRole" TEXT NOT NULL DEFAULT 'user';
