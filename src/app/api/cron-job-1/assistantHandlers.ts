import { PrismaClient } from '@prisma/client';
import { sendTelegramMessageWithButtons } from './telegram';
import axios from 'axios';
import { sendLogToTelegram } from './reminderHandlers';
import { getTranslation } from './reminderHandlers';

const prisma = new PrismaClient();

export async function handleRejectRequest(requestId: string, assistantTelegramId: bigint) {
  try {
    const edges = await prisma.edges.findFirst();
    const maxRejects = edges ? edges.maxRejects : 7;

    // Определяем, сколько раз ассистент уже отказывался за последние 24 часа
    const rejectCount = await prisma.requestAction.count({
      where: {
        assistantId: assistantTelegramId,
        action: 'REJECTED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // ========================
    // 1) Если превышен лимит отказов — блокируем ассистента
    // ========================
    if (rejectCount >= maxRejects) {
      // Берём язык «отклоняющего» ассистента, чтобы отправить ему уведомление
      const rejectingAssistantRecord = await prisma.assistant.findUnique({
        where: { telegramId: assistantTelegramId },
        select: { language: true },
      });
      let rejectingAssistantLang: "ru" | "en" = "en";
      if (rejectingAssistantRecord?.language === "ru") {
        rejectingAssistantLang = "ru";
      }

      // Блокируем
      await prisma.assistant.update({
        where: { telegramId: assistantTelegramId },
        data: {
          isBlocked: true,
          unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Предположим, в translations есть ключ "assistant_blocked_due_to_rejects"
      // для «Ассистент заблокирован из-за превышения лимита отказов.»
      const blockedMsg = getTranslation(rejectingAssistantLang, "assistant_blocked_due_to_rejects");
      console.error(blockedMsg);

      // При желании можно отправить ассистенту сообщение о блокировке
      // await sendTelegramMessage(
      //   assistantTelegramId.toString(),
      //   blockedMsg
      // );

      return;
    }

    // ========================
    // 2) Получаем AssistantRequest
    // ========================
    const assistantRequest = await prisma.assistantRequest.findUnique({
      where: { id: BigInt(requestId) },
      include: { conversation: true },
    });

    if (!assistantRequest) {
      console.log(`Запрос с ID ${requestId} не найден`);
      return;
    }

    // Добавляем ассистента, который отказался, в ignoredAssistants
    const ignoredAssistants = assistantRequest.ignoredAssistants || [];
    ignoredAssistants.push(assistantTelegramId);

    // Если у запроса есть conversation, помечаем её ABORTED
    if (assistantRequest.conversation) {
      await prisma.conversation.update({
        where: { id: assistantRequest.conversation.id },
        data: { status: 'ABORTED' },
      });
    }

    // Записываем факт «REJECTED» в requestAction
    await prisma.requestAction.create({
      data: {
        requestId: BigInt(requestId),
        assistantId: assistantTelegramId,
        action: 'REJECTED',
      },
    });

    // Переводим запрос в статус PENDING, убираем assistantId, добавляем в ignoredAssistants
    await prisma.assistantRequest.update({
      where: { id: BigInt(requestId) },
      data: {
        status: 'PENDING',
        isActive: true,
        assistantId: null,
        ignoredAssistants,
      },
    });

    // ========================
    // 3) Ищем нового ассистента
    // ========================
    const newAssistant = await findNewAssistant(BigInt(requestId), ignoredAssistants);

    if (!newAssistant) {
      // Предположим, у вас есть ключ "no_assistants_available"
      // «Нет доступных ассистентов.»
      const noAssistantsMsg = getTranslation("ru", "no_assistants_available"); 
      // Или если хотите лог на английском
      console.error(noAssistantsMsg);
      return;
    }

    // Назначаем запрос новому ассистенту
    await prisma.assistantRequest.update({
      where: { id: BigInt(requestId) },
      data: { assistantId: newAssistant.telegramId },
    });

    // Повторно получаем запрос (чтобы взять subject, если нужно)
    const updatedRequest = await prisma.assistantRequest.findUnique({
      where: { id: BigInt(requestId) }
    });

    console.log(`Назначение запроса ID: ${requestId} ассистенту ID: ${newAssistant.telegramId.toString()}`);

    // ========================
    // 4) Локализация для «нового» ассистента
    // ========================
    // Получаем язык нового ассистента
    const newAssistantRecord = await prisma.assistant.findUnique({
      where: { telegramId: newAssistant.telegramId },
      select: { language: true },
    });

    let assistantLang: "ru" | "en" = "en";
    if (newAssistantRecord?.language === "ru") {
      assistantLang = "ru";
    }

    // Если есть тема, отправляем её отдельно, локализовав «topic_of_request» или что-то подобное
    if (updatedRequest?.subject) {
      try {
        // Предположим, есть ключ "topic_of_request" => "Тема запроса: %subject%" / "Request subject: %subject%"
        let subjectMsg = getTranslation(assistantLang, "topic_of_request");
        subjectMsg = subjectMsg.replace("%subject%", updatedRequest.subject);

        await sendTelegramMessage(
          newAssistant.telegramId.toString(),
          subjectMsg
        );

        console.log(`Тема успешно отправлена ассистенту ID: ${newAssistant.telegramId.toString()}`);
      } catch (error) {
        console.error(`Ошибка при отправке темы ассистенту ID: ${newAssistant.telegramId.toString()}`, error);
      }
    } else {
      // Предположим, есть ключ "no_subject" => "У запроса нет темы" / "No subject"
      const noSubjectMsg = getTranslation(assistantLang, "no_subject");
      console.log(noSubjectMsg);
    }

    // ========================
    // 5) Отправляем сообщение «Новый запрос от пользователя»
    // ========================
    // Предположим, есть ключ "new_request_from_user" => 
    //   "Новый запрос от пользователя" / "New request from user"
    const newRequestMsg = getTranslation(assistantLang, "new_request_from_user");

    // Предположим, есть ключи "accept" / "reject" для кнопок
    const acceptText = getTranslation(assistantLang, "accept");
    const rejectText = getTranslation(assistantLang, "reject");

    await sendTelegramMessageWithButtons(
      newAssistant.telegramId.toString(),
      newRequestMsg,
      [
        { text: acceptText, callback_data: `accept_${requestId}` },
        { text: rejectText, callback_data: `reject_${requestId}` },
      ]
    );

  } catch (error) {
    console.error('Ошибка при отклонении запроса:', error);
    await sendLogToTelegram(`Error in handleRejectRequest: ${String(error)}`);
  }
}

async function findNewAssistant(requestId: bigint, ignoredAssistants: bigint[]) {
  // Находим всех доступных ассистентов
  const availableAssistants = await prisma.assistant.findMany({
    where: {
      isWorking: true,
      isBlocked: false,
      telegramId: {
        notIn: ignoredAssistants,
      },
    },
  });

  if (availableAssistants.length === 0) {
    // Нет вообще ассистентов
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: { ignoredAssistants: [] },
    });
    return null;
  }

  // Считаем штрафные баллы и количество активных запросов для каждого ассистента
  const assistantsData = await Promise.all(
    availableAssistants.map(async (assistant) => {
      const penaltyPoints = await getAssistantPenaltyPoints(assistant.telegramId);

      const activeRequestsCount = await prisma.assistantRequest.count({
        where: {
          assistantId: assistant.telegramId,
          isActive: true,
        },
      });

      return { ...assistant, penaltyPoints, activeRequestsCount };
    })
  );

  // Сортируем сначала по penaltyPoints (по возрастанию),
  // Если penaltyPoints равны — сортируем по activeRequestsCount (по возрастанию)
  assistantsData.sort((a, b) => {
    if (a.penaltyPoints === b.penaltyPoints) {
      return a.activeRequestsCount - b.activeRequestsCount;
    }
    return a.penaltyPoints - b.penaltyPoints;
  });

  const selectedAssistant = assistantsData[0];

  if (!selectedAssistant) {
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: { ignoredAssistants: [] },
    });
    return null;
  }

  return selectedAssistant;
}

async function getAssistantPenaltyPoints(assistantId: bigint) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const actions = await prisma.requestAction.findMany({
    where: {
      assistantId: assistantId,
      createdAt: {
        gte: yesterday,
      },
    },
  });

  let penaltyPoints = 0;
  for (const action of actions) {
    if (action.action === 'REJECTED') {
      penaltyPoints += 1;
    } else if (action.action === 'IGNORED') {
      penaltyPoints += 3;
    }
  }

  return penaltyPoints;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const telegramBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
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
      console.error(`Failed to send message: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`Error sending message to chat ID: ${chatId}`, error);
    throw error;
  }
}
