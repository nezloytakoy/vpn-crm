import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Преобразуем userId в строку, если это числовой идентификатор
    await sendTelegramMessageToUser(userId.toString(), 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.');

    const availableAssistants = await prisma.assistant.findMany({
      where: {
        isWorking: true,
        isBusy: false,
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    if (availableAssistants.length === 0) {
      return new Response(JSON.stringify({ message: 'Нет доступных ассистентов' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const selectedAssistant = availableAssistants[0];

    // Обновляем состояние ассистента
    await prisma.assistant.update({
      where: { id: selectedAssistant.id },
      data: { isBusy: true },
    });

    // Преобразуем идентификаторы в строку, если это необходимо
    const assistantRequest = await prisma.assistantRequest.create({
      data: {
        userId: Number(userId),  // Если userId передан как строка, можно убрать преобразование
        assistantId: selectedAssistant.id,
        message: 'Запрос пользователя на разговор',
        status: 'PENDING',
        isActive: false,
      },
    });

    await sendTelegramMessageWithButtons(
      selectedAssistant.telegramId.toString(),
      'Поступил запрос от пользователя',
      [
        { text: 'Принять', callback_data: `accept_${assistantRequest.id}` },
        { text: 'Отклонить', callback_data: `reject_${assistantRequest.id}` },
      ]
    );

    return new Response(JSON.stringify({ message: 'Запрос отправлен ассистенту.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка:', error);
    return new Response(JSON.stringify({ error: 'Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Функция отправки сообщения пользователю через Telegram
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

// Функция отправки сообщения ассистенту с кнопками
async function sendTelegramMessageWithButtons(chatId: string, text: string, buttons: TelegramButton[]) {
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
        inline_keyboard: buttons.map((button) => [{ text: button.text, callback_data: button.callback_data }]),
      },
    }),
  });
}

type TelegramButton = {
  text: string;
  callback_data: string;
};
