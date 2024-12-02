import { PrismaClient } from '@prisma/client';
import { getTranslation, detectLanguage } from './translations';
import {
  sendTelegramMessageToUser,
  sendLogToTelegram
} from './helpers';
import { Bot } from 'grammy';

const prisma = new PrismaClient();

export async function handleAssistantRequest(userIdBigInt: bigint) {
  try {
    const lang = detectLanguage();

    await sendLogToTelegram(`[Start] Checking user with ID: ${userIdBigInt.toString()}`);

    // Проверяем, существует ли пользователь
    const userExists = await prisma.user.findUnique({
      where: { telegramId: userIdBigInt },
    });

    if (!userExists) {
      await sendLogToTelegram(`[Error] User with ID ${userIdBigInt.toString()} not found`);
      return {
        error: getTranslation(lang, 'userNotFound'),
        status: 404,
      };
    }
    await sendLogToTelegram(`[Success] User found: ${JSON.stringify(serializeBigInt(userExists))}`);

    // Проверяем, есть ли активные запросы у пользователя
    const existingActiveRequest = await prisma.assistantRequest.findFirst({
      where: { userId: userIdBigInt, isActive: true },
    });

    if (existingActiveRequest) {
      await sendLogToTelegram(
        `[Info] User ${userIdBigInt.toString()} already has an active request: ${JSON.stringify(
          serializeBigInt(existingActiveRequest)
        )}`
      );
      await sendTelegramMessageToUser(
        userIdBigInt.toString(),
        getTranslation(lang, 'existingActiveRequest')
      );
      return {
        message: getTranslation(lang, 'existingActiveRequest'),
        status: 200,
      };
    }

    const now = new Date();
    await sendLogToTelegram(`[Info] Current date and time: ${now.toISOString()}`);

    // Считаем оставшиеся запросы
    const totalRemainingAssistantRequestsResult = await prisma.userTariff.aggregate({
      _sum: {
        remainingAssistantRequests: true,
      },
      where: {
        userId: userIdBigInt,
        expirationDate: {
          gte: now,
        },
      },
    });

    const totalRemainingAssistantRequests =
      totalRemainingAssistantRequestsResult._sum.remainingAssistantRequests || 0;

    await sendLogToTelegram(
      `[Info] Total remaining assistant requests: ${totalRemainingAssistantRequests}`
    );

    if (totalRemainingAssistantRequests <= 0) {
      await sendLogToTelegram(`[Error] Not enough requests for user ${userIdBigInt.toString()}`);
      return {
        error: getTranslation(lang, 'notEnoughRequests'),
        status: 400,
      };
    }

    // Ищем действующий тариф с оставшимися запросами
    const userTariff = await prisma.userTariff.findFirst({
      where: {
        userId: userIdBigInt,
        remainingAssistantRequests: {
          gt: 0,
        },
        expirationDate: {
          gte: now,
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });

    if (!userTariff) {
      await sendLogToTelegram(
        `[Error] No valid tariffs found for user ${userIdBigInt.toString()}`
      );
      return {
        error: getTranslation(lang, 'notEnoughRequests'),
        status: 400,
      };
    }
    await sendLogToTelegram(
      `[Success] User tariff found: ${JSON.stringify(serializeBigInt(userTariff))}`
    );

    // Уменьшаем количество оставшихся запросов
    await prisma.userTariff.update({
      where: {
        id: userTariff.id,
      },
      data: {
        remainingAssistantRequests: {
          decrement: 1,
        },
      },
    });

    await sendLogToTelegram(
      `[Info] Decremented requests in tariff ID ${userTariff.id.toString()} for user ${userIdBigInt.toString()} by 1`
    );

    // Создаём новый запрос ассистента
    const newRequest = await prisma.assistantRequest.create({
      data: {
        userId: userIdBigInt,
        assistantId: null,
        message: '',
        status: 'PENDING',
        isActive: true,
        ignoredAssistants: [],
        subject: null, // Initially null, updated later when media or text is received
      },
    });

    await sendLogToTelegram(
      `[Success] New assistant request created: ${JSON.stringify(serializeBigInt(newRequest))}`
    );

    // Распределяем запрос на ассистента
    const assignedAssistant = await assignAssistant(newRequest.id);

    if (!assignedAssistant) {
      await sendLogToTelegram(
        `[Warning] No available assistants for request ID ${newRequest.id.toString()}`
      );
      await sendTelegramMessageToUser(
        userIdBigInt.toString(),
        getTranslation(lang, 'noAssistantsAvailable')
      );
      return {
        message: getTranslation(lang, 'noAssistantsAvailable'),
        status: 200,
      };
    }

    await sendLogToTelegram(
      `[Success] Request ID ${newRequest.id.toString()} assigned to assistant ${assignedAssistant.telegramId.toString()}`
    );

    return {
      message: 'Request assigned successfully.',
      status: 200,
    };
  } catch (error) {
    console.error('Error:', error);
    await sendLogToTelegram(
      `[Critical Error]: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return {
      error: getTranslation(detectLanguage(), 'serverError'),
      status: 500,
    };
  }
}

// Распределение запросов с уведомлением ассистента
async function assignAssistant(requestId: bigint) {
  // Получаем список всех ассистентов с их текущей нагрузкой
  const assistants = await prisma.assistant.findMany({
    where: {
      isWorking: true,
      isBlocked: false,
    },
    include: {
      requests: {
        where: {
          isActive: true,
        },
      },
    },
  });

  // Сортируем ассистентов по количеству активных запросов
  const sortedAssistants = assistants.sort(
    (a, b) => a.requests.length - b.requests.length
  );

  // Выбираем ассистента с наименьшей нагрузкой
  const selectedAssistant = sortedAssistants[0];

  if (selectedAssistant) {
    // Обновляем запрос, назначая ассистента
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: {
        assistantId: selectedAssistant.telegramId,
        status: 'PENDING',
      },
    });

    // Уведомляем ассистента о новом запросе
    await sendAssistantNotification(requestId, selectedAssistant.telegramId);

    return selectedAssistant;
  }

  return null;
}

// Отправка уведомления ассистенту с кнопками "Принять" и "Отклонить"
async function sendAssistantNotification(requestId: bigint, assistantTelegramId: bigint) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const request = await prisma.assistantRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!request) {
    console.error(
      `[sendAssistantNotification] Ошибка: запрос с ID ${requestId.toString()} не найден.`
    );
    return;
  }

  const assistantBot = new Bot(botToken);

  try {
    await assistantBot.api.sendMessage(
      assistantTelegramId.toString(),
      `Новый запрос от пользователя ${request.user?.username || 'без имени'}.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Принять', callback_data: `accept_${requestId.toString()}` }],
            [{ text: 'Отклонить', callback_data: `reject_${requestId.toString()}` }],
          ],
        },
      }
    );

    console.log(
      `[sendAssistantNotification] Уведомление отправлено ассистенту ${assistantTelegramId.toString()} для запроса ${requestId.toString()}`
    );
  } catch (error) {
    console.error('[sendAssistantNotification] Ошибка при отправке уведомления ассистенту:', error);
  }
}

// Обработка принятия или отклонения запроса ассистентом
export async function handleAssistantResponse(
  requestId: bigint,
  action: 'ACCEPT' | 'REJECT'
) {
  const request = await prisma.assistantRequest.findUnique({
    where: { id: requestId },
    include: { user: true, assistant: true },
  });

  if (!request) {
    console.error(
      `[handleAssistantResponse] Ошибка: запрос с ID ${requestId.toString()} не найден.`
    );
    return;
  }

  if (action === 'ACCEPT') {
    // Обновляем статус запроса
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: { status: 'IN_PROGRESS', isActive: true },
    });

    // Создаем запись в таблице Conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: request.userId,
        assistantId: request.assistantId!,
        requestId: request.id,
        messages: [],
        status: 'IN_PROGRESS',
        lastMessageFrom: 'USER',
        lastUserMessageAt: new Date(),
      },
    });

    console.log(
      `[handleAssistantResponse] Ассистент принял запрос. Создана беседа с ID ${conversation.id.toString()}`
    );

    // Уведомляем пользователя
    await sendTelegramMessageToUser(
      request.userId.toString(),
      'Ваш запрос принят! Ассистент готов помочь.'
    );
  } else if (action === 'REJECT') {
    console.log(
      `[handleAssistantResponse] Ассистент отклонил запрос с ID ${requestId.toString()}`
    );

    // Обновляем запрос и переназначаем его другому ассистенту
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: {
        assistantId: null,
        status: 'PENDING',
        ignoredAssistants: [...request.ignoredAssistants, request.assistantId!],
      },
    });

    // Повторное назначение
    await assignAssistant(requestId);
  }
}

function serializeBigInt(obj: unknown): unknown {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
}
