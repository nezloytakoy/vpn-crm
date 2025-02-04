import { NextResponse } from 'next/server';
import { PrismaClient, Conversation } from '@prisma/client';

const prisma = new PrismaClient();

export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const assistants = await prisma.assistant.findMany({
      include: {
        conversations: {
          where: { status: 'COMPLETED' },
        },
        requestActions: {
          where: { action: 'REJECTED' },
        },
      },
    });

    // Используем Promise.all для асинхронного выполнения операций внутри map
    const assistantsData = await Promise.all(
      assistants.map(async (assistant) => {
        const completedConversations = assistant.conversations.length;
        const deniedRequests = assistant.requestActions.length;

        // Рассчитываем среднее время ответа
        const averageResponseTime = calculateAverageResponseTimeFromConversations(
          assistant.conversations
        );

        // Получаем количество жалоб и количество активных жалоб (со статусом 'PENDING')
        const totalComplaints = await prisma.complaint.count({
          where: { assistantId: assistant.telegramId },
        });

        const pendingComplaints = await prisma.complaint.count({
          where: {
            assistantId: assistant.telegramId,
            status: 'PENDING',
          },
        });

        // Новая система статусов
        const status = (() => {
          // const logMessage = `Assistant: ${assistant.telegramId} - isBlocked: ${assistant.isBlocked}, isWorking: ${assistant.isWorking}`;
          // sendDebugLogToTelegram(logMessage); // Отправляем лог в Telegram

          if (assistant.isBlocked) {
            return 'Выкинуло с линии';
          }
          if (assistant.isWorking) {
            return 'Работает';
          }
          return 'Не работает';
        })();

        return {
          telegramId: assistant.telegramId.toString(), // Преобразуем BigInt в строку
          nick: assistant.username
            ? `@${assistant.username}`
            : `@${assistant.telegramId.toString()}`, // Преобразуем BigInt в строку
          averageResponseTime, // Среднее время ответа
          completed: completedConversations,
          denied: deniedRequests,
          current: pendingComplaints, // Активные жалобы
          complaints: totalComplaints, // Всего жалоб
          status,
          message: 'Сообщение ассистента',
        };
      })
    );

    return new NextResponse(JSON.stringify(assistantsData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Ошибка при получении данных ассистентов:', error);
    return new NextResponse(JSON.stringify({ error: 'Ошибка при получении данных' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}

// Функция для расчета среднего времени ответа на основе разговоров
function calculateAverageResponseTimeFromConversations(conversations: Conversation[]) {
  const responseTimes: number[] = conversations.flatMap((conversation) => {
    if (Array.isArray(conversation.assistantResponseTimes)) {
      return conversation.assistantResponseTimes as number[]; // Время в миллисекундах
    }
    return [];
  });

  if (responseTimes.length === 0) return 0;

  const totalResponseTime = responseTimes.reduce((acc, time) => acc + time, 0);
  const averageResponseTimeInMs = totalResponseTime / responseTimes.length;

  return Math.round(averageResponseTimeInMs / 1000);
}

// Функция отправки отладочных логов в Telegram
async function sendDebugLogToTelegram(message: string) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const chatId = '5829159515'; // ID пользователя для отладки
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
  } catch (error) {
    console.error('Ошибка при отправке отладочного сообщения:', error);
  }
}
