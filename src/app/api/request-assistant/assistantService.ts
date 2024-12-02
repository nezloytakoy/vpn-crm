import { PrismaClient } from '@prisma/client';
import {
  getTranslation,
  detectLanguage,
} from './translations';
import {
  sendTelegramMessageToUser,
  sendLogToTelegram,
} from './helpers';

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
        `[Info] User ${userIdBigInt.toString()} already has an active request: ${JSON.stringify(serializeBigInt(existingActiveRequest))}`
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
      await sendLogToTelegram(`[Error] No valid tariffs found for user ${userIdBigInt.toString()}`);
      return {
        error: getTranslation(lang, 'notEnoughRequests'),
        status: 400,
      };
    }
    await sendLogToTelegram(`[Success] User tariff found: ${JSON.stringify(serializeBigInt(userTariff))}`);

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

    await sendLogToTelegram(`[Success] New assistant request created: ${JSON.stringify(serializeBigInt(newRequest))}`);

    // Распределяем запрос на ассистента
    const assignedAssistant = await assignAssistant(newRequest.id);

    if (!assignedAssistant) {
      await sendLogToTelegram(`[Warning] No available assistants for request ID ${newRequest.id.toString()}`);
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
    await sendLogToTelegram(`[Critical Error]: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return {
      error: getTranslation(detectLanguage(), 'serverError'),
      status: 500,
    };
  }
}

// Распределение запросов
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
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: {
        assistantId: selectedAssistant.telegramId,
        status: 'IN_PROGRESS',
      },
    });

    return selectedAssistant;
  }

  return null;
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
