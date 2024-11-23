import { PrismaClient, Prisma } from '@prisma/client';
import {
  awardAssistantBonus,
  awardMentorBonus,
  handleRejectRequest,
  sendTelegramMessageWithButtons
} from './helpers'; // Предполагается, что все необходимые функции импортированы из 'helpers'

import {
  sendTelegramMessageToUser,
  sendTelegramMessageToAssistant
} from './telegramHelpers'; // Предполагается, что все необходимые функции импортированы из 'helpers'


const prisma = new PrismaClient();

export async function POST() {
  try {
    // --- ЛОГИКА ИЗ close-conversations ---

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Закрытие диалогов с ИИ, которые длятся более часа
    const usersWithAIChat = await prisma.user.findMany({
      where: {
        isActiveAIChat: true,
        lastAIChatOpenedAt: {
          lt: oneHourAgo,
        },
      },
    });

    for (const user of usersWithAIChat) {
      await prisma.user.update({
        where: { telegramId: user.telegramId },
        data: { isActiveAIChat: false },
      });

      await sendTelegramMessageToUser(
        user.telegramId.toString(),
        'Диалог с ИИ окончен.'
      );
      console.log(`Диалог с ИИ для пользователя ${user.telegramId} завершен.`);
    }

    // Закрытие активных разговоров, которые длятся более часа
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lt: oneHourAgo },
      },
      include: { user: true, assistant: true },
    });

    for (const conversation of conversations) {
      if (conversation.lastMessageFrom === 'ASSISTANT') {
        // Логика завершения диалога, когда последний ответ был от ассистента
        // Включает начисление коинов, бонусов и отправку сообщений
        await handleAssistantConversation(conversation);
      } else {
        // Логика, когда последний ответ был от пользователя
        await handleUserConversation(conversation);
      }
    }

    // --- ЛОГИКА ИЗ check-assistants ---

    const pendingRequests = await prisma.assistantRequest.findMany({
      where: {
        status: 'PENDING',
      },
    });

    for (const request of pendingRequests) {
      await processPendingRequest(request);
    }

    return new Response(
      JSON.stringify({ message: 'Все задачи успешно выполнены.' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Ошибка при выполнении задач:', error);
    return new Response(JSON.stringify({ error: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Функция обработки завершения диалога, когда последний ответ был от ассистента
async function handleAssistantConversation(conversation: Prisma.ConversationGetPayload<{ include: { user: true; assistant: true } }>) {
  const activeRequest = await prisma.assistantRequest.findFirst({
    where: {
      id: conversation.requestId,
      isActive: true,
    },
    include: { assistant: true },
  });

  if (activeRequest) {
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
      await processAssistantRewards(assistantId);
    } else {
      console.error('Ошибка: assistantId is null');
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
  } else {
    console.error('Ошибка: активный запрос не найден');
  }
}

// Функция обработки диалога, когда последний ответ был от пользователя
async function handleUserConversation(
  conversation: Prisma.ConversationGetPayload<{ include: { user: true; assistant: true } }>
) {
  await sendTelegramMessageToUser(
    conversation.userId.toString(),
    'Связь с ассистентом утеряна, вы будете переключены на другого ассистента.'
  );
  await sendTelegramMessageToAssistant(
    conversation.assistantId.toString(),
    'Вы оставили вопрос пользователя без ответа. Койн не будет засчитан.'
  );

  await handleRejectRequest(
    conversation.requestId.toString(),
    conversation.assistantId
  );
}

// Функция обработки бонусов для ассистента и его наставника
async function processAssistantRewards(assistantId: bigint) {
  const totalCompletedConversations = await prisma.conversation.count({
    where: {
      assistantId: assistantId,
      status: 'COMPLETED',
    },
  });

  const rewards = await prisma.rewards.findFirst();

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

  const mentorId = assistantData?.mentorId;

  if (rewards?.isRegularBonusEnabled) {
    if (!isPermanentBonus) {
      if (totalCompletedConversations === periodRequestCount) {
        await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
      }
    } else {
      if (totalCompletedConversations % periodRequestCount === 0) {
        await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
      }
    }
  }

  if (!isPermanentReferral) {
    if (totalCompletedConversations === referralPeriodRequestCount) {
      if (mentorId) {
        await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
      }
    }
  } else {
    if (totalCompletedConversations % referralPeriodRequestCount === 0) {
      if (mentorId) {
        await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
      }
    }
  }
}

// Функция обработки ожидающих запросов ассистентов
async function processPendingRequest(
  request: Prisma.AssistantRequestGetPayload<{}>
) {
  let ignoredAssistants = request.ignoredAssistants || [];

  if (request.assistantId) {
    await addIgnoreAction(BigInt(request.assistantId), request.id);

    const ignoredCount = await countIgnoredActionsInLast24Hours(
      BigInt(request.assistantId)
    );
    const maxIgnores = await prisma.edges.findFirst({ select: { maxIgnores: true } });

    if (ignoredCount >= (maxIgnores?.maxIgnores || 0)) {
      await prisma.assistant.update({
        where: { telegramId: BigInt(request.assistantId) },
        data: {
          isBlocked: true,
          unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      console.log(
        `Assistant ID ${request.assistantId} заблокирован за превышение лимита игнорирований.`
      );
    }
  }

  let selectedAssistant = await findAvailableAssistant(ignoredAssistants);

  if (!selectedAssistant) {
    ignoredAssistants = [];
    selectedAssistant = await findAvailableAssistant(ignoredAssistants);

    if (!selectedAssistant) {
      console.log(`Нет доступных ассистентов для запроса ID: ${request.id}`);
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

  await sendTelegramMessageWithButtons(
    selectedAssistant.telegramId.toString(),
    `Новый запрос от пользователя`,
    [
      { text: 'Принять', callback_data: `accept_${request.id}` },
      { text: 'Отклонить', callback_data: `reject_${request.id}` },
    ]
  );
}
async function findAvailableAssistant(ignoredAssistants: (string | bigint)[]) {
  // Преобразование элементов в `bigint`
  const formattedIgnoredAssistants: bigint[] = ignoredAssistants.map((id) =>
    typeof id === 'string' ? BigInt(id) : id
  );

  const availableAssistant = await prisma.assistant.findFirst({
    where: {
      isWorking: true,
      isBusy: false,
      isBlocked: false,
      telegramId: {
        notIn: formattedIgnoredAssistants, // Теперь это `bigint[]`
      },
    },
    orderBy: {
      lastActiveAt: 'desc',
    },
  });

  return availableAssistant;
}

async function addIgnoreAction(assistantId: bigint, requestId: bigint) {
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

  const ignoredCount = await prisma.requestAction.count({
    where: {
      assistantId: assistantId,
      action: 'IGNORED',
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });

  return ignoredCount;
}
