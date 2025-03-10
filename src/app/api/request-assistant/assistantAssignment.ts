import { PrismaClient } from "@prisma/client";
import { Bot } from 'grammy';
import {
  sendTelegramMessageToUser
} from './helpers';
import { getTranslation } from "./translations";

const prisma = new PrismaClient();


// Распределение запросов с уведомлением ассистента
export async function assignAssistant(requestId: bigint) {
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
    // 1) Получаем язык ассистента (assistantTelegramId) из базы
    const assistantRecord = await prisma.assistant.findUnique({
      where: { telegramId: assistantTelegramId },
      select: { language: true },
    });

    // 2) Определяем assistantLang, fallback "en"
    let assistantLang: "en" | "ru" = "en";
    if (assistantRecord?.language === "ru") {
      assistantLang = "ru";
    }

    // 3) Формируем локализованный текст сообщения
    //    Предположим, есть ключи в переводах: "new_request_from_user", "topic", "no_username" и "no_subject"
    const usernamePart = request.user?.username
      ? request.user.username
      : getTranslation(assistantLang, "no_username");

    const subjectPart = request.subject
      ? request.subject
      : getTranslation(assistantLang, "no_subject");

    // new_request_from_user: "Новый запрос от пользователя " или "New request from user "
    const textMessage = `${getTranslation(assistantLang, "new_request_from_user")} ${usernamePart}.\n${getTranslation(assistantLang, "topic")}: ${subjectPart}`;

    // 4) Отправляем сообщение ассистенту с локализованными кнопками «Принять» / «Отклонить»
    await assistantBot.api.sendMessage(
      assistantTelegramId.toString(),
      textMessage,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: getTranslation(assistantLang, "accept"),
                callback_data: `accept_${requestId.toString()}`
              }
            ],
            [
              {
                text: getTranslation(assistantLang, "reject"),
                callback_data: `reject_${requestId.toString()}`
              }
            ]
          ]
        }
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
        status: 'PENDING',
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