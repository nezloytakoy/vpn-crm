import {
    awardAssistantBonus,
    awardMentorBonus
} from './bonusHandlers';


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processAssistantRewards(assistantId: bigint) {
    console.log(`processAssistantRewards: Обработка бонусов для ассистента ID: ${assistantId.toString()}`);
    
    try {
        // Подсчет завершенных диалогов
        const totalCompletedConversations = await prisma.conversation.count({
            where: {
                assistantId: assistantId,
                status: 'COMPLETED',
            },
        });
        console.log(`Ассистент ID: ${assistantId.toString()} завершил всего диалогов: ${totalCompletedConversations}`);
        
        // Получение параметров наград
        const rewards = await prisma.rewards.findFirst();
        console.log(`Параметры наград: ${JSON.stringify(rewards, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )}`);
        
        const periodRequestCount = rewards?.rewardRequestCount ?? 10;
        const assistantReward = rewards?.assistantReward ?? 5;
        const isPermanentBonus = rewards?.isPermanentBonus ?? false;
        const referralPeriodRequestCount = rewards?.referralRequestCount ?? 20;
        const isPermanentReferral = rewards?.isPermanentReferral ?? false;
        const mentorReward = rewards?.mentorReward ?? 10;

        // Получение данных об ассистенте
        const assistantData = await prisma.assistant.findUnique({
            where: { telegramId: assistantId },
            select: { mentorId: true },
        });
        console.log(`Наставник ассистента ID: ${assistantId.toString()} - ${assistantData?.mentorId?.toString()}`);

        const mentorId = assistantData?.mentorId;

        // Начисление бонусов ассистенту
        if (rewards?.isRegularBonusEnabled) {
            if (!isPermanentBonus) {
                if (totalCompletedConversations === periodRequestCount) {
                    await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
                    console.log(`✅ Начислен бонус ассистенту ID: ${assistantId.toString()}`);
                }
            } else {
                if (totalCompletedConversations % periodRequestCount === 0) {
                    await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
                    console.log(`✅ Начислен постоянный бонус ассистенту ID: ${assistantId.toString()}`);
                }
            }
        }

        // Начисление бонусов наставнику
        if (!isPermanentReferral) {
            if (totalCompletedConversations === referralPeriodRequestCount) {
                if (mentorId) {
                    await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
                    console.log(`✅ Начислен бонус наставнику ID: ${mentorId?.toString()}`);
                }
            }
        } else {
            if (totalCompletedConversations % referralPeriodRequestCount === 0) {
                if (mentorId) {
                    await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
                    console.log(`✅ Начислен постоянный бонус наставнику ID: ${mentorId?.toString()}`);
                }
            }
        }
    } catch (error) {
        console.error(`❌ Ошибка в процессе обработки бонусов:`, error);
    }
}