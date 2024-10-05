import { PrismaClient } from '@prisma/client';
import { Context } from 'grammy';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Обработка нажатий на кнопки
export async function handleCallbackQuery(ctx: Context) {
  const callbackQuery = ctx.callbackQuery;
  const data = callbackQuery?.data;
  const assistantId = callbackQuery?.from.id;

  if (!data || !assistantId) {
    console.error('Некорректные данные в callbackQuery');
    return;
  }

  const [action, requestId] = data.split('_');

  if (action === 'accept') {
    await prisma.assistantRequest.update({
      where: { id: Number(requestId) },
      data: { status: 'IN_PROGRESS', isActive: true },
    });

    await sendTelegramMessageToAssistant(assistantId.toString(), 'Вы приняли запрос, ожидайте пока пользователь сформулирует свой вопрос.');

    const request = await prisma.assistantRequest.findUnique({
      where: { id: Number(requestId) },
      include: { user: true },
    });

    if (request) {
      await sendTelegramMessageToUser(request.user.telegramId, 'Ассистент присоединился к чату. Сформулируйте свой вопрос.');
    }
  } else if (action === 'reject') {
    await prisma.assistantRequest.update({
      where: { id: Number(requestId) },
      data: { status: 'REJECTED', isActive: false },
    });

    await sendTelegramMessageToAssistant(assistantId.toString(), 'Вы отклонили запрос.');
  }
}

// Обработка сообщений
export async function handleMessage(ctx: Context) {
  if (!ctx.from) {
    console.error('Отсутствует объект from в контексте.');
    return await ctx.reply('Произошла ошибка при обработке вашего запроса.');
  }

  const userId = ctx.from.id;
  const message = ctx.message?.text || '';

  const activeRequest = await prisma.assistantRequest.findFirst({
    where: { userId: userId, isActive: true },
    include: { assistant: true },
  });

  if (activeRequest) {
    const assistantId = activeRequest.assistant.telegramId;
    await sendTelegramMessageToAssistant(assistantId, message);
  } else {
    await sendTelegramMessageToUser(userId.toString(), 'У вас нет активных запросов.');
  }
}

// Функции для отправки сообщений
async function sendTelegramMessageToAssistant(chatId: string, text: string) {
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
    }),
  });
}

async function sendTelegramMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}
