import { PrismaClient } from '@prisma/client';
import { sendTelegramMessageToUser, sendTelegramMessageToAssistant } from './telegramHelpers';  // Вспомогательные функции для отправки сообщений

const prisma = new PrismaClient();

export async function POST() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // Время час назад
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lt: oneHourAgo },
      },
      include: { user: true, assistant: true },
    });

    if (conversations.length === 0) {
      return new Response(JSON.stringify({ message: 'Нет активных диалогов, превышающих 1 час.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    for (const conversation of conversations) {
      if (conversation.lastMessageFrom === 'ASSISTANT') {
        // Логика завершения диалога ассистентом
        const activeRequest = await prisma.assistantRequest.findFirst({
          where: {
            id: conversation.requestId,
            isActive: true,
          },
          include: { assistant: true },
        });

        if (activeRequest) {
          // Обновление статуса запроса
          await prisma.assistantRequest.update({
            where: { id: activeRequest.id },
            data: { status: 'COMPLETED', isActive: false },
          });

          // Обновление статуса ассистента, снимаем занятость
          if (activeRequest.assistant) {
            await prisma.assistant.update({
              where: { telegramId: activeRequest.assistant.telegramId },
              data: { isBusy: false },
            });
          } else {
            console.error('Ошибка: ассистент не найден для запроса');
          }

          // Обновление статуса разговора
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: 'COMPLETED' },
          });

          // Начисление 1 коина ассистенту
          if (activeRequest.assistant) {
            const updatedAssistant = await prisma.assistant.update({
              where: { telegramId: activeRequest.assistant.telegramId },
              data: { coins: { increment: 1 } },
            });

            // Уведомление ассистента о начислении коина
            await sendTelegramMessageToAssistant(
              updatedAssistant.telegramId.toString(),
              'Вам начислен 1 коин за завершение диалога.'
            );
          }

          // Уведомление пользователя о завершении диалога
          await sendTelegramMessageToUser(
            conversation.userId.toString(),
            'Диалог завершен.'
          );
        } else {
          console.error('Ошибка: активный запрос не найден');
        }
      } else {
        // Логика для случая, когда последнее сообщение отправил пользователь
        await handleRejectRequest(conversation.requestId.toString(), conversation.assistantId);

      }
    }

    return new Response(JSON.stringify({ message: 'Диалоги обновлены.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка при закрытии диалогов:', error);
    return new Response(JSON.stringify({ error: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleRejectRequest(requestId: string, assistantTelegramId: bigint) {
  try {
    // Найдем запрос с проигнорированными ассистентами
    const assistantRequest = await prisma.assistantRequest.findUnique({
      where: { id: BigInt(requestId) },
      include: { conversation: true },
    });

    const ignoredAssistants = assistantRequest?.ignoredAssistants || [];

    // Добавляем текущего ассистента в список проигнорированных
    ignoredAssistants.push(assistantTelegramId);

    // Если есть активный разговор, обновляем его статус на "ABORTED"
    if (assistantRequest?.conversation) {
      await prisma.conversation.update({
        where: { id: assistantRequest.conversation.id },
        data: { status: 'ABORTED' }, // Завершаем разговор
      });
    }

    // Записываем событие отказа в таблицу RequestAction
    await prisma.requestAction.create({
      data: {
        requestId: BigInt(requestId),
        assistantId: assistantTelegramId,
        action: 'REJECTED',
      },
    });

    // Обновляем статус запроса, освобождая его от ассистента
    await prisma.assistantRequest.update({
      where: { id: BigInt(requestId) },
      data: {
        status: 'PENDING',  // Возвращаем запрос в статус ожидания
        isActive: true,      // Оставляем запрос активным
        assistantId: null,   // Убираем текущего ассистента
        ignoredAssistants,   // Обновляем список проигнорированных ассистентов
      },
    });

    // Ищем нового ассистента
    const newAssistant = await findNewAssistant(BigInt(requestId), ignoredAssistants);

    // Если найден новый ассистент, отправляем запрос ему
    if (newAssistant) {
      await prisma.assistantRequest.update({
        where: { id: BigInt(requestId) },
        data: {
          assistantId: newAssistant.telegramId, // Назначаем нового ассистента
        },
      });

      // Уведомляем нового ассистента
      await sendTelegramMessageToAssistant(
        newAssistant.telegramId.toString(),
        'Новый запрос от пользователя.'
      );
    } else {
      console.error('Нет доступных ассистентов.');
    }

    // Обновляем статус ассистента, что он не занят
    await prisma.assistant.update({
      where: { telegramId: assistantTelegramId },
      data: { isBusy: false },
    });
  } catch (error) {
    console.error('Ошибка при отклонении запроса:', error);
  }
}


// Обновленная функция для поиска нового ассистента
async function findNewAssistant(requestId: bigint, ignoredAssistants: bigint[]) {
  // Ищем всех доступных ассистентов
  const availableAssistants = await prisma.assistant.findMany({
    where: {
      isWorking: true,
      isBusy: false,
      telegramId: {
        notIn: ignoredAssistants, // исключаем ассистентов из списка проигнорированных
      },
    },
  });

  // Добавляем штрафные очки каждому ассистенту
  const assistantsWithPenalty = await Promise.all(
    availableAssistants.map(async (assistant) => {
      const penaltyPoints = await getAssistantPenaltyPoints(assistant.telegramId);
      return { ...assistant, penaltyPoints };
    })
  );

  // Сортируем ассистентов по штрафным очкам и времени активности
  assistantsWithPenalty.sort((a, b) => {
    if (a.penaltyPoints === b.penaltyPoints) {
      // Если штрафные очки равны, сортируем по активности
      return (b.lastActiveAt?.getTime() || 0) - (a.lastActiveAt?.getTime() || 0);
    }
    return a.penaltyPoints - b.penaltyPoints; // Сортируем по штрафным очкам (от меньшего к большему)
  });

  // Выбираем ассистента с наименьшими штрафными очками
  const selectedAssistant = assistantsWithPenalty[0];

  // Если ассистент не найден, очищаем список проигнорированных и начинаем заново
  if (!selectedAssistant) {
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: { ignoredAssistants: [] }, // Очищаем список проигнорированных ассистентов
    });
    return findNewAssistant(requestId, []);
  }

  return selectedAssistant;
}

// Функция подсчета штрафных очков за последние 24 часа
async function getAssistantPenaltyPoints(assistantId: bigint) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const actions = await prisma.requestAction.findMany({
    where: {
      assistantId: assistantId,
      createdAt: {
        gte: yesterday, // Действия за последние 24 часа
      },
    },
  });

  let penaltyPoints = 0;
  for (const action of actions) {
    if (action.action === 'REJECTED') {
      penaltyPoints += 1; // 1 очко за отказ
    } else if (action.action === 'IGNORED') {
      penaltyPoints += 3; // 3 очка за игнорирование
    }
  }

  return penaltyPoints;
}