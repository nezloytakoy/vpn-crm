-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "allowFilesToAssistant" BOOLEAN DEFAULT false,
ADD COLUMN     "allowVideoToAssistant" BOOLEAN DEFAULT false,
ADD COLUMN     "allowVoiceToAI" BOOLEAN DEFAULT false,
ADD COLUMN     "allowVoiceToAssistant" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastPaidTariff" VARCHAR;
