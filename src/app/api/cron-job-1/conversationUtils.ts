import { PrismaClient, Conversation, AssistantRequest } from '@prisma/client';
import { handleRejectRequest } from './assistantHandlers';
import { processAssistantRewards } from './processAssistantRewards';
import {
  sendTelegramMessageToUser,
  sendTelegramMessageToAssistant,
} from './telegramHelpers';

import { handleIgnoredRequest } from './helpers';

const prisma = new PrismaClient();

export async function handleAssistantLastMessage(conversation: Conversation) {
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

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'COMPLETED' },
    });

    const assistantId = activeRequest.assistantId;
    if (assistantId) {
      await processAssistantRewards(assistantId);
    } else {
      console.error('Ошибка: assistantId is null');
      return;
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
}

export async function handleUserLastMessage(conversation: Conversation) {
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

export async function checkActiveConversations() {
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
        await remindAssistant(conversation);
      } else {
        await handleIgnoredConversation(conversation);
      }
    }
  }
}

async function remindAssistant(conversation: Conversation & { assistantRequest: AssistantRequest }) {
  const assistantTelegramId = conversation.assistantId;
  const requestId = conversation.assistantRequest.id.toString();

  await sendTelegramMessageToAssistant(
    assistantTelegramId.toString(),
    `Пожалуйста, дайте ответ пользователю, запрос - ${requestId}`
  );

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { reminderSent: true },
  });

  console.log(
    `Напоминание отправлено ассистенту ${assistantTelegramId.toString()} для диалога ${conversation.id.toString()}`
  );

  const userTelegramId = conversation.userId.toString();
  for (let i = 1; i <= 5; i++) {
    await sendTelegramMessageToAssistant(
      userTelegramId,
      `Пожалуйста, дайте ответ пользователю, запрос - ${requestId}`
    );
    console.log(`Пользователю ${userTelegramId} отправлено сообщение номер ${i}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
async function handleIgnoredConversation(conversation: Conversation & { assistantRequest: AssistantRequest }) {
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

  // Сообщаем пользователю о потере связи
  const userTelegramId = conversation.userId.toString();
  await sendTelegramMessageToUser(
    userTelegramId,
    'Связь с ассистентом потеряна, переключаем вас на другого ассистента...'
  );

  console.log(`Пользователю ${userTelegramId} отправлено сообщение о переключении ассистента.`);

  // Обновляем разговор: помечаем как ABORTED и устанавливаем userId = 0 (режим ожидания)
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status: 'ABORTED',
      userId: BigInt(0), // Устанавливаем специальный "пустой" userId
    },
  });

  // Перенаправляем запрос следующему ассистенту
  await handleIgnoredRequest(requestId, assistantTelegramId);

  console.log(`Запрос ${requestId} перенаправлен следующему ассистенту.`);
}