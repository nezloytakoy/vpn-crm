import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Функция для поиска ассистента, который не находится в списке проигнорированных
async function findAvailableAssistant(ignoredAssistants: bigint[]) {
  // Находим ассистента, который работает и не занят
  const availableAssistant = await prisma.assistant.findFirst({
    where: {
      isWorking: true,
      isBusy: false,
      telegramId: {
        notIn: ignoredAssistants, // исключаем ассистентов из списка проигнорированных
      },
    },
    orderBy: {
      lastActiveAt: 'desc', // выбираем самого активного недавно
    },
  });

  return availableAssistant;
}

// Основная функция обработки запросов с status: PENDING
export async function POST() {
  try {
    // Ищем все запросы со статусом PENDING
    const pendingRequests = await prisma.assistantRequest.findMany({
      where: {
        status: 'PENDING',
      },
    });

    if (pendingRequests.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending requests found.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Обрабатываем каждый запрос
    for (const request of pendingRequests) {
      let ignoredAssistants = request.ignoredAssistants || [];

      // Ищем доступного ассистента
      let selectedAssistant = await findAvailableAssistant(ignoredAssistants);

      // Если доступного ассистента не найдено
      if (!selectedAssistant) {
        // Очищаем список проигнорированных ассистентов
        ignoredAssistants = [];

        // Повторный поиск ассистента после очистки
        selectedAssistant = await findAvailableAssistant(ignoredAssistants);

        if (!selectedAssistant) {
          // Если снова не найдено ассистентов
          console.log(`No available assistants for request ID: ${request.id}`);
          continue;
        }
      }

      // Обновляем запрос, назначая нового ассистента и добавляя старого ассистента в ignoredAssistants
      await prisma.assistantRequest.update({
        where: { id: request.id },
        data: {
          assistantId: selectedAssistant.telegramId, // Обновляем ассистента
          ignoredAssistants: {
            push: request.assistantId, // Добавляем текущего ассистента в проигнорированные
          },
        },
      });

      // Уведомляем нового ассистента
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        `Новый запрос от пользователя`,
        [
          { text: 'Принять', callback_data: `accept_${request.id}` },
          { text: 'Отклонить', callback_data: `reject_${request.id}` },
        ]
      );
    }

    return new Response(JSON.stringify({ message: 'Processed all pending requests.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка при обработке запросов:', error);
    return new Response(JSON.stringify({ error: 'Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Функция отправки сообщения с кнопками в Telegram
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
