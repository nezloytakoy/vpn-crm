import { sendTelegramMessageToAssistant } from './telegramHelpers';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export async function awardAssistantBonus(assistantId: bigint, amount: number, periodCount: number) {
    await prisma.assistant.update({
        where: { telegramId: assistantId },
        data: { coins: { increment: amount } },
    });

    await prisma.assistantCoinTransaction.create({
        data: {
            assistantId: assistantId,
            amount: amount,
            reason: `Бонус за ${periodCount} завершенных диалогов`,
        },
    });

    await sendTelegramMessageToAssistant(
        assistantId.toString(),
        `Поздравляем! Вам начислен бонус ${amount} коинов за ${periodCount} завершенных диалогов.`
    );
}

export async function awardMentorBonus(mentorId: bigint, amount: number, periodCount: number) {
    await prisma.assistant.update({
        where: { telegramId: mentorId },
        data: { coins: { increment: amount } },
    });

    await prisma.assistantCoinTransaction.create({
        data: {
            assistantId: mentorId,
            amount: amount,
            reason: `Бонус наставника за ${periodCount} завершенных диалогов подопечного`,
        },
    });

    await sendTelegramMessageToAssistant(
        mentorId.toString(),
        `Поздравляем! Вам начислен бонус ${amount} коинов за ${periodCount} завершенных диалогов вашего подопечного.`
    );
}