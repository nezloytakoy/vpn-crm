import {
    awardAssistantBonus,
    awardMentorBonus
} from './helpers';

import { sendTelegramMessageWithButtons } from './telegram'

import { findAvailableAssistant } from './assistant'

import { PrismaClient } from '@prisma/client';

import axios from 'axios';


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

export async function processPendingRequest(request: {
    id: bigint;
    userId: bigint;
    assistantId: bigint | null;
    message: string;
    status: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    ignoredAssistants: bigint[];
  }) {
    console.log(`processPendingRequest: Начало обработки запроса ID: ${request.id.toString()}`);
  
    let ignoredAssistants = request.ignoredAssistants || [];
    console.log(`Игнорируемые ассистенты на старте: ${ignoredAssistants.map((id) => id.toString())}`);
  
    if (request.assistantId) {
      console.log(`Обработка ассистента ID: ${request.assistantId.toString()} из запроса`);
  
      try {
        console.log(`Добавление ассистента ID: ${request.assistantId.toString()} в список игнорированных`);
        await addIgnoreAction(request.assistantId, request.id);
  
        const ignoredCount = await countIgnoredActionsInLast24Hours(request.assistantId);
        console.log(`Ассистент ID: ${request.assistantId.toString()} игнорировал ${ignoredCount} запросов за последние 24 часа`);
  
        const maxIgnores = await prisma.edges.findFirst({ select: { maxIgnores: true } });
        if (ignoredCount >= (maxIgnores?.maxIgnores || 0)) {
          console.log(`Блокировка ассистента ID: ${request.assistantId.toString()} за превышение лимита`);
          await prisma.assistant.update({
            where: { telegramId: request.assistantId },
            data: {
              isBlocked: true,
              unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
          console.log(`Ассистент ID: ${request.assistantId.toString()} успешно заблокирован`);
        }
      } catch (error) {
        console.error(`Ошибка при обработке ассистента ID: ${request.assistantId.toString()}`, error);
      }
    }
  
    console.log(`Поиск доступного ассистента, игнорируя: ${ignoredAssistants.map((id) => id.toString())}`);
    let selectedAssistant;
    try {
      selectedAssistant = await findAvailableAssistant(ignoredAssistants);
    } catch (error) {
      console.error(`Ошибка при поиске доступного ассистента`, error);
    }
  
    if (!selectedAssistant) {
      console.log('Нет доступных ассистентов, очистка списка игнорированных');
      ignoredAssistants = [];
      try {
        selectedAssistant = await findAvailableAssistant(ignoredAssistants);
      } catch (error) {
        console.error(`Ошибка при повторном поиске доступного ассистента`, error);
      }
  
      if (!selectedAssistant) {
        console.log(`Нет доступных ассистентов для запроса ID: ${request.id.toString()}`);
        return;
      }
    }
  
    console.log(`Отправка темы запроса ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    try {
      await sendTelegramMessage(
        selectedAssistant.telegramId.toString(),
        `Тема запроса: ${request.message}`
      );
      console.log(`Тема успешно отправлена ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    } catch (error) {
      console.error(`Ошибка при отправке темы ассистенту ID: ${selectedAssistant.telegramId.toString()}`, error);
    }
  
    console.log(`Назначение запроса ID: ${request.id.toString()} ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    try {
      await prisma.assistantRequest.update({
        where: { id: request.id },
        data: {
          assistantId: selectedAssistant.telegramId,
          ignoredAssistants: request.assistantId
            ? {
                push: request.assistantId,
              }
            : undefined,
        },
      });
      console.log(`Запрос ID: ${request.id.toString()} успешно назначен ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    } catch (error) {
      console.error(`Ошибка при назначении запроса ассистенту ID: ${selectedAssistant.telegramId.toString()}`, error);
    }
  
    console.log(`Отправка уведомления ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    try {
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        `Новый запрос от пользователя`,
        [
          { text: 'Принять', callback_data: `accept_${request.id.toString()}` },
          { text: 'Отклонить', callback_data: `reject_${request.id.toString()}` },
        ]
      );
      console.log(`Уведомление успешно отправлено ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    } catch (error) {
      console.error(`Ошибка при отправке уведомления ассистенту ID: ${selectedAssistant.telegramId.toString()}`, error);
    }
  
    console.log(`processPendingRequest: Завершение обработки запроса ID: ${request.id.toString()}`);
  }
  
  async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const telegramBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN; // Убедитесь, что токен сохранен в переменной окружения
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  
    try {
      console.log(`Sending message to chat ID: ${chatId}`);
      const response = await axios.post(telegramApiUrl, {
        chat_id: chatId,
        text: text,
      });
  
      if (response.data.ok) {
        console.log(`Message successfully sent to chat ID: ${chatId}`);
      } else {
        console.error(`Failed to send message: ${response.data}`);
      }
    } catch (error) {
      console.error(`Error sending message to chat ID: ${chatId}`, error);
      throw error;
    }
  }

async function addIgnoreAction(assistantId: bigint, requestId: bigint) {
    console.log(
        `addIgnoreAction: Ассистент ID: ${assistantId.toString()} игнорировал запрос ID: ${requestId.toString()}`
    );
    await prisma.requestAction.create({
        data: {
            assistantId: assistantId,
            requestId: requestId,
            action: 'IGNORED',
        },
    });
}

async function countIgnoredActionsInLast24Hours(assistantId: bigint) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    console.log(`Подсчет игнорирований с ${oneDayAgo.toISOString()}`);

    const ignoredCount = await prisma.requestAction.count({
        where: {
            assistantId: assistantId,
            action: 'IGNORED',
            createdAt: {
                gte: oneDayAgo,
            },
        },
    });

    console.log(
        `Ассистент ID: ${assistantId.toString()} игнорировал ${ignoredCount} запросов за последние 24 часа`
    );
    return ignoredCount;
}
