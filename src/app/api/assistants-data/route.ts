import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Получаем жалобы для всех ассистентов, где статус PENDING
    const complaints = await prisma.complaint.findMany({
      where: { status: 'PENDING' },
    });

    const assistantsData = assistants.map((assistant) => {
      const completedConversations = assistant.conversations.length;
      const deniedRequests = assistant.requestActions.length;

      // Фильтруем жалобы для текущего ассистента
      const currentComplaints = complaints.filter((complaint) => complaint.assistantId === assistant.telegramId).length;
      const allComplaints = complaints.filter((complaint) => complaint.assistantId === assistant.telegramId && complaint.status !== 'PENDING').length;

      const status =
        assistant.isWorking && assistant.isBusy
          ? 'Работает'
          : assistant.isWorking && !assistant.isBusy
          ? 'Не работает'
          : 'Оффлайн';

      return {
        nick: assistant.username ? `@${assistant.username}` : `@${assistant.telegramId}`, // Если username есть, используем его
        averageResponseTime: calculateAverageResponseTime(assistant),
        completed: completedConversations,
        denied: deniedRequests,
        current: currentComplaints,
        complaints: allComplaints,
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

// Пример функции для расчета среднего времени ответа
function calculateAverageResponseTime(assistant: any) {
  if (assistant.conversations.length === 0) return 0;

  const totalResponseTime = assistant.conversations.reduce((acc: number, conversation: any) => {
    const responseTime = new Date(conversation.createdAt).getTime() - new Date(assistant.startedAt).getTime();
    return acc + responseTime;
  }, 0);

  return totalResponseTime / assistant.conversations.length;
}
