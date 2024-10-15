import { NextResponse } from 'next/server';
import { PrismaClient, Conversation } from '@prisma/client';

const prisma = new PrismaClient();

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

      const status =
        assistant.isWorking && assistant.isBusy
          ? 'Работает'
          : assistant.isWorking && !assistant.isBusy
          ? 'Не работает'
          : 'Оффлайн';

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

    return NextResponse.json(assistantsData, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении данных ассистентов:', error);
    return NextResponse.json({ error: 'Ошибка при получении данных' }, { status: 500 });
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

  // Переводим в секунды
  return averageResponseTimeInMs / 1000;
}
