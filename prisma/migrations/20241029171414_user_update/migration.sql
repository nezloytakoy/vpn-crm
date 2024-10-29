/*
  Warnings:

  - You are about to drop the column `lastPaidTariff` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastPaidTariff",
ADD COLUMN     "lastPaidTariffId" BIGINT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastPaidTariffId_fkey" FOREIGN KEY ("lastPaidTariffId") REFERENCES "Tariff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
