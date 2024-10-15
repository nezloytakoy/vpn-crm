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
  
      const assistantsData = assistants.map((assistant) => {
        const completedConversations = assistant.conversations.length;
        const deniedRequests = assistant.requestActions.length;
  
        // Фильтруем все разговоры ассистента
        const averageResponseTime = calculateAverageResponseTimeFromConversations(assistant.conversations);
  
        const status = (() => {
          const logMessage = `Assistant: ${assistant.telegramId} - isWorking: ${assistant.isWorking}, isBusy: ${assistant.isBusy}`;
          
          sendDebugLogToTelegram(logMessage); // Отправляем лог в Telegram
        
          if (assistant.isWorking && assistant.isBusy) {
            return 'Работает';
          } else if (assistant.isWorking && !assistant.isBusy) {
            return 'Не работает';
          } else {
            return 'Оффлайн';
          }
        })();
  
        return {
          nick: assistant.username ? `@${assistant.username}` : `@${assistant.telegramId}`, // Если username есть, используем его
          averageResponseTime, // Среднее время ответа
          completed: completedConversations,
          denied: deniedRequests,
          current: 0, // Здесь current жалобы заменены на 0, поскольку жалобы не учитываются
          complaints: 0, // Общие жалобы не учитываются в данном примере
          status,
          message: 'Сообщение ассистента',
        };
      });
  
      // Добавление заголовков для отключения кеширования
      return new NextResponse(JSON.stringify(assistantsData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (error) {
      console.error('Ошибка при получении данных ассистентов:', error);
      return new NextResponse(JSON.stringify({ error: 'Ошибка при получении данных' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
  }
  

// Функция для расчета среднего времени ответа на основе разговоров
function calculateAverageResponseTimeFromConversations(conversations: Conversation[]) {
  // Собираем все времена ответа ассистента из разговоров
  const responseTimes: number[] = conversations.flatMap(conversation => {
    if (Array.isArray(conversation.assistantResponseTimes)) {
      return conversation.assistantResponseTimes as number[]; // Время в миллисекундах
    }
    return [];
  });

  if (responseTimes.length === 0) return 0;

  // Рассчитываем среднее время ответа в миллисекундах
  const totalResponseTime = responseTimes.reduce((acc, time) => acc + time, 0);
  const averageResponseTimeInMs = totalResponseTime / responseTimes.length;

  // Переводим в секунды и округляем до целого числа
  return Math.round(averageResponseTimeInMs / 1000);
}


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
  