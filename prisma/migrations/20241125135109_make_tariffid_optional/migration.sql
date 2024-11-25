-- DropForeignKey
ALTER TABLE "UserTariff" DROP CONSTRAINT "UserTariff_tariffId_fkey";

-- AlterTable
ALTER TABLE "UserTariff" ALTER COLUMN "tariffId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserTariff" ADD CONSTRAINT "UserTariff_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
