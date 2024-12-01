import { PrismaClient } from '@prisma/client';
import {
  sendTelegramMessageToUser,
  sendTelegramMessageToAssistant,
} from './telegramHelpers';
import {
  handleRejectRequest,
  handleIgnoredRequest
} from './helpers';

import { processPendingRequest } from './assistantHelpers'

import { processAssistantRewards } from './processAssistantRewards'

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET() {
  console.log('GET-запрос получен, перенаправляем в POST...');
  return await POST();
}

export async function POST() {
  try {
    console.log('--- Начало выполнения POST ---');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    console.log(`Время для сравнения: ${oneHourAgo.toISOString()}`);

    // Закрытие диалогов с ИИ, которые длятся более часа
    const usersWithAIChat = await prisma.user.findMany({
      where: {
        isActiveAIChat: true,
        lastAIChatOpenedAt: {
          lt: oneHourAgo,
        },
      },
    });
    console.log(`Найдено пользователей с активным AI-чатом: ${usersWithAIChat.length}`);

    for (const user of usersWithAIChat) {
      console.log(`Завершаем AI-чат для пользователя ${user.telegramId.toString()}`);
      await prisma.user.update({
        where: { telegramId: user.telegramId },
        data: { isActiveAIChat: false },
      });

      await sendTelegramMessageToUser(user.telegramId.toString(), 'Диалог с ИИ окончен.');
      console.log(`Диалог с ИИ для пользователя ${user.telegramId.toString()} завершен.`);
    }

    // Закрытие активных разговоров, которые длятся более часа
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
        updatedAt: { lt: oneHourAgo },
      },
      include: { user: true, assistant: true },
    });
    console.log(`Найдено диалогов со статусом 'IN_PROGRESS': ${conversations.length}`);

    console.log(
      'Список диалогов:',
      JSON.stringify(
        conversations,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      )
    );

    for (const conversation of conversations) {
      console.log(`Обработка диалога ID: ${conversation.id.toString()}`);
      if (conversation.lastMessageFrom === 'ASSISTANT') {
        const activeRequest = await prisma.assistantRequest.findFirst({
          where: {
            id: conversation.requestId,
            isActive: true,
          },
          include: { assistant: true },
        });

        if (activeRequest) {
          console.log(
            `Найден активный запрос ID: ${activeRequest.id.toString()} для диалога ID: ${conversation.id.toString()}`
          );

          await prisma.assistantRequest.update({
            where: { id: activeRequest.id },
            data: { status: 'COMPLETED', isActive: false },
          });

          if (activeRequest.assistant) {
            await prisma.assistant.update({
              where: { telegramId: activeRequest.assistant.telegramId },
              data: { isBusy: false },
            });
          } else {
            console.error('Ошибка: ассистент не найден для запроса');
          }

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: 'COMPLETED' },
          });

          const assistantId = activeRequest.assistantId;
          if (assistantId) {
            // Обработка бонусов и наград
            await processAssistantRewards(assistantId);
          } else {
            console.error('Ошибка: assistantId is null');
            continue;
          }

          const coinsToAdd = 1;
          const reason = 'Автоматическое завершение диалога';

          if (activeRequest.assistant) {
            const updatedAssistant = await prisma.assistant.update({
              where: { telegramId: activeRequest.assistant.telegramId },
              data: { coins: { increment: coinsToAdd } },
            });

            await prisma.assistantCoinTransaction.create({
              data: {
                assistantId: activeRequest.assistant.telegramId,
                amount: coinsToAdd,
                reason: reason,
              },
            });

            await sendTelegramMessageToAssistant(
              updatedAssistant.telegramId.toString(),
              `Вам начислен ${coinsToAdd} коин за завершение диалога.`
            );
          } else {
            console.error('Ошибка: ассистент не найден при начислении коинов');
          }

          await sendTelegramMessageToUser(
            conversation.userId.toString(),
            'Ваш сеанс закончился! Если остались вопросы, то вы можете продлить сеанс.',
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Продлить', callback_data: 'extend_session' }],
                  [{ text: 'Я доволен', callback_data: 'satisfied' }],
                  [{ text: 'Пожаловаться - Мне не помогло', callback_data: 'complain' }],
                ],
              },
            }
          );
          console.log(
            `Пользователю ID: ${conversation.userId.toString()} отправлено сообщение о завершении сеанса`
          );
        } else {
          console.error('Ошибка: активный запрос не найден');
        }
      } else {
        console.log(`Последнее сообщение от пользователя в диалоге ID: ${conversation.id.toString()}`);

        await sendTelegramMessageToUser(
          conversation.userId.toString(),
          'Связь с ассистентом утеряна, вы будете переключены на другого ассистента.'
        );
        await sendTelegramMessageToAssistant(
          conversation.assistantId.toString(),
          'Вы оставили вопрос пользователя без ответа. Койн не будет засчитан.'
        );

        await handleRejectRequest(conversation.requestId.toString(), conversation.assistantId);
        console.log(`Запрос ID: ${conversation.requestId.toString()} обработан как отклоненный`);
      }
    }

    // *** Новая логика: Проверка активных бесед на наличие непрочитанных сообщений от пользователя ***

    console.log('Проверка активных бесед на наличие непрочитанных сообщений от пользователя...');

    const activeConversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      include: {
        assistant: true,
        assistantRequest: true,
      },
    });

    for (const conversation of activeConversations) {
      if (conversation.lastMessageFrom === 'USER') {
        console.log(`Последнее сообщение от пользователя в диалоге ID: ${conversation.id.toString()}`);

        if (!conversation.reminderSent) {
          // Отправляем напоминание ассистенту
          const assistantTelegramId = conversation.assistantId;
          const requestId = conversation.assistantRequest.id.toString();

          await sendTelegramMessageToAssistant(
            assistantTelegramId.toString(),
            `Пожалуйста, дайте ответ пользователю, запрос - ${requestId}`
          );

          // Обновляем беседу, помечая, что напоминание отправлено
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { reminderSent: true },
          });

          console.log(`Напоминание отправлено ассистенту ${assistantTelegramId.toString()} для диалога ${conversation.id.toString()}`);

          // *** Отправляем 5 одинаковых сообщений пользователю с интервалом в 1 секунду ***
          const userTelegramId = conversation.userId.toString();

          for (let i = 1; i <= 5; i++) {
            await sendTelegramMessageToAssistant(
              userTelegramId,
              `Пожалуйста, дайте ответ пользователю, запрос - ${requestId}`
            );
            console.log(`Пользователю ${userTelegramId} отправлено сообщение номер ${i}`);
            // Ждем 1 секунду перед отправкой следующего сообщения
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          // Напоминание уже было отправлено ранее, блокируем ассистента и перенаправляем запрос
          const assistantTelegramId = conversation.assistantId;
          const requestId = conversation.assistantRequest.id.toString();

          // Блокируем ассистента навсегда
          await prisma.assistant.update({
            where: { telegramId: assistantTelegramId },
            data: {
              isBlocked: true,
              unblockDate: null,
            },
          });

          console.log(`Ассистент ${assistantTelegramId.toString()} был заблокирован навсегда.`);

          // *** Отправляем пользователю сообщение о потере связи с ассистентом ***
          const userTelegramId = conversation.userId.toString();
          await sendTelegramMessageToUser(
            userTelegramId,
            'Связь с ассистентом потеряна, переключаем вас на другого ассистента...'
          );

          console.log(`Пользователю ${userTelegramId} отправлено сообщение о переключении ассистента.`);

          // Обновляем статус беседы
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              status: 'ABORTED',
            },
          });

          // Обрабатываем игнорированный запрос и перенаправляем его следующему ассистенту
          await handleIgnoredRequest(requestId, assistantTelegramId);

          console.log(`Запрос ${requestId} перенаправлен следующему ассистенту.`);
        }
      }
    }
    // Обработка ожидающих запросов ассистентов
    const pendingRequests = await prisma.assistantRequest.findMany({
      where: {
        status: 'PENDING',
      },
    });
    console.log(`Найдено ожидающих запросов ассистентов: ${pendingRequests.length}`);

    for (const request of pendingRequests) {
      console.log(`Обработка запроса ID: ${request.id.toString()}`);
      await processPendingRequest(request);
    }

    console.log('--- Завершение выполнения POST ---');
    return new Response(JSON.stringify({ message: 'Диалоги обновлены и запросы обработаны.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка при обработке:', error);
    return new Response(JSON.stringify({ error: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
