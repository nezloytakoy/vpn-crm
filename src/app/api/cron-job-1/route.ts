import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import {
  sendTelegramMessageToUser,
  sendTelegramMessageToAssistant,
} from './telegramHelpers';
import {
  awardAssistantBonus,
  awardMentorBonus,
  handleRejectRequest,
} from './helpers';

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET() {
  console.log('GET-запрос получен, перенаправляем в POST...');
  return await POST();
}

export async function POST() {
  try {
    console.log('--- Начало выполнения POST ---');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 10);
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
      console.log(`Завершаем AI-чат для пользователя ${user.telegramId.toString()}`); // Добавлено .toString()
      await prisma.user.update({
        where: { telegramId: user.telegramId },
        data: { isActiveAIChat: false },
      });

      await sendTelegramMessageToUser(user.telegramId.toString(), 'Диалог с ИИ окончен.');
      console.log(`Диалог с ИИ для пользователя ${user.telegramId.toString()} завершен.`); // Добавлено .toString()
    }

    // Закрытие активных разговоров, которые длятся более часа
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
        updatedAt: { lt: oneHourAgo }, // Используем updatedAt вместо createdAt
      },
      include: { user: true, assistant: true },
    });
    console.log(`Найдено диалогов со статусом 'IN_PROGRESS': ${conversations.length}`);

    // Используем функцию для корректной сериализации BigInt
    console.log(
      'Список диалогов:',
      JSON.stringify(
        conversations,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      )
    );

    for (const conversation of conversations) {
      console.log(`Обработка диалога ID: ${conversation.id.toString()}`); // Добавлено .toString()
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
          ); // Добавлено .toString()

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

          // Отправляем сообщение пользователю с кнопками
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
          ); // Добавлено .toString()
        } else {
          console.error('Ошибка: активный запрос не найден');
        }
      } else {
        console.log(`Последнее сообщение от пользователя в диалоге ID: ${conversation.id.toString()}`); // Добавлено .toString()

        await sendTelegramMessageToUser(
          conversation.userId.toString(),
          'Связь с ассистентом утеряна, вы будете переключены на другого ассистента.'
        );
        await sendTelegramMessageToAssistant(
          conversation.assistantId.toString(),
          'Вы оставили вопрос пользователя без ответа. Койн не будет засчитан.'
        );

        await handleRejectRequest(conversation.requestId.toString(), conversation.assistantId);
        console.log(`Запрос ID: ${conversation.requestId.toString()} обработан как отклоненный`); // Добавлено .toString()
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
      console.log(`Обработка запроса ID: ${request.id.toString()}`); // Добавлено .toString()
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

// Функция обработки бонусов для ассистента и его наставника
async function processAssistantRewards(assistantId: bigint) {
  console.log(`processAssistantRewards: Обработка бонусов для ассистента ID: ${assistantId.toString()}`); // Добавлено .toString()
  const totalCompletedConversations = await prisma.conversation.count({
    where: {
      assistantId: assistantId,
      status: 'COMPLETED',
    },
  });
  console.log(`Ассистент ID: ${assistantId.toString()} завершил всего диалогов: ${totalCompletedConversations}`);

  const rewards = await prisma.rewards.findFirst();
  console.log(`Параметры наград: ${JSON.stringify(rewards)}`);

  const periodRequestCount = rewards?.rewardRequestCount ?? 10;
  const assistantReward = rewards?.assistantReward ?? 5;
  const isPermanentBonus = rewards?.isPermanentBonus ?? false;
  const referralPeriodRequestCount = rewards?.referralRequestCount ?? 20;
  const isPermanentReferral = rewards?.isPermanentReferral ?? false;
  const mentorReward = rewards?.mentorReward ?? 10;

  const assistantData = await prisma.assistant.findUnique({
    where: { telegramId: assistantId },
    select: { mentorId: true },
  });
  console.log(`Наставник ассистента ID: ${assistantId.toString()} - ${assistantData?.mentorId?.toString()}`); // Добавлено .toString()

  const mentorId = assistantData?.mentorId;

  if (rewards?.isRegularBonusEnabled) {
    if (!isPermanentBonus) {
      if (totalCompletedConversations === periodRequestCount) {
        await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
        console.log(`Начислен бонус ассистенту ID: ${assistantId.toString()}`); // Добавлено .toString()
      }
    } else {
      if (totalCompletedConversations % periodRequestCount === 0) {
        await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
        console.log(`Начислен постоянный бонус ассистенту ID: ${assistantId.toString()}`); // Добавлено .toString()
      }
    }
  }

  if (!isPermanentReferral) {
    if (totalCompletedConversations === referralPeriodRequestCount) {
      if (mentorId) {
        await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
        console.log(`Начислен бонус наставнику ID: ${mentorId.toString()}`); // Добавлено .toString()
      }
    }
  } else {
    if (totalCompletedConversations % referralPeriodRequestCount === 0) {
      if (mentorId) {
        await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
        console.log(`Начислен постоянный бонус наставнику ID: ${mentorId.toString()}`); // Добавлено .toString()
      }
    }
  }
}

// Функция обработки ожидающих запросов ассистентов
async function processPendingRequest(request: {
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
  console.log(`processPendingRequest: Обработка запроса ID: ${request.id.toString()}`); // Добавлено .toString()
  console.log(
    `Данные запроса: ${JSON.stringify(
      request,
      (key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    )}`
  );
  let ignoredAssistants = request.ignoredAssistants || [];

  if (request.assistantId) {
    console.log(`Добавление ассистента ID: ${request.assistantId.toString()} в игнорированные`); // Добавлено .toString()
    await addIgnoreAction(request.assistantId, request.id);

    const ignoredCount = await countIgnoredActionsInLast24Hours(request.assistantId);
    console.log(`Ассистент ID: ${request.assistantId.toString()} игнорировал ${ignoredCount} раз за последние 24 часа`);

    const maxIgnores = await prisma.edges.findFirst({ select: { maxIgnores: true } });
    console.log(`Максимальное количество игнорирований: ${maxIgnores?.maxIgnores}`);

    if (ignoredCount >= (maxIgnores?.maxIgnores || 0)) {
      await prisma.assistant.update({
        where: { telegramId: request.assistantId },
        data: {
          isBlocked: true,
          unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      console.log(
        `Ассистент ID: ${request.assistantId.toString()} заблокирован за превышение лимита игнорирований.`
      );
    }
  }

  let selectedAssistant = await findAvailableAssistant(ignoredAssistants);
  console.log(`Найден доступный ассистент: ${selectedAssistant?.telegramId?.toString()}`); // Добавлено .toString()

  if (!selectedAssistant) {
    console.log('Нет доступных ассистентов, очищаем список игнорированных и пробуем снова');
    ignoredAssistants = [];
    selectedAssistant = await findAvailableAssistant(ignoredAssistants);

    if (!selectedAssistant) {
      console.log(`Нет доступных ассистентов для запроса ID: ${request.id.toString()}`); // Добавлено .toString()
      return;
    }
  }

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
  console.log(
    `Запрос ID: ${request.id.toString()} назначен ассистенту ID: ${selectedAssistant.telegramId.toString()}`
  ); // Добавлено .toString()

  await sendTelegramMessageWithButtons(
    selectedAssistant.telegramId.toString(),
    `Новый запрос от пользователя`,
    [
      { text: 'Принять', callback_data: `accept_${request.id.toString()}` }, // Добавлено .toString()
      { text: 'Отклонить', callback_data: `reject_${request.id.toString()}` }, // Добавлено .toString()
    ]
  );
  console.log(
    `Ассистенту ID: ${selectedAssistant.telegramId.toString()} отправлено уведомление о новом запросе`
  ); // Добавлено .toString()
}

// Вспомогательные функции
async function findAvailableAssistant(ignoredAssistants: bigint[]) {
  console.log(
    `Поиск доступного ассистента, игнорируя: ${ignoredAssistants.map((id) => id.toString())}`
  ); // Преобразование массива BigInt в строки
  const availableAssistant = await prisma.assistant.findFirst({
    where: {
      isWorking: true,
      isBusy: false,
      isBlocked: false,
      telegramId: {
        notIn: ignoredAssistants,
      },
    },
    orderBy: {
      lastActiveAt: 'desc',
    },
  });
  console.log(`Найден ассистент: ${availableAssistant?.telegramId?.toString()}`); // Добавлено .toString()
  return availableAssistant;
}

async function addIgnoreAction(assistantId: bigint, requestId: bigint) {
  console.log(
    `addIgnoreAction: Ассистент ID: ${assistantId.toString()} игнорировал запрос ID: ${requestId.toString()}`
  ); // Добавлено .toString()
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
  ); // Добавлено .toString()
  return ignoredCount;
}

async function sendTelegramMessageWithButtons(
  chatId: string,
  text: string,
  buttons: TelegramButton[]
) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: buttons.map((button) => [
          { text: button.text, callback_data: button.callback_data },
        ]),
      },
    }),
  });
}

type TelegramButton = {
  text: string;
  callback_data: string;
};
