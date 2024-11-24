import { PrismaClient } from '@prisma/client';
import { subDays, subMonths } from 'date-fns';

const prisma = new PrismaClient();

export async function getAssistantStatistics(assistantBigInt: bigint) {
  console.log('Получаем статистику для ассистента');

  // Получение количества запросов
  console.log('Получаем количество запросов ассистента');
  const allRequests = await prisma.assistantRequest.count({
    where: { assistantId: assistantBigInt },
  });
  console.log('Всего запросов:', allRequests);

  const requestsThisMonth = await prisma.assistantRequest.count({
    where: {
      assistantId: assistantBigInt,
      createdAt: { gte: subMonths(new Date(), 1) },
    },
  });
  console.log('Запросов за месяц:', requestsThisMonth);

  const requestsThisWeek = await prisma.assistantRequest.count({
    where: {
      assistantId: assistantBigInt,
      createdAt: { gte: subDays(new Date(), 7) },
    },
  });
  console.log('Запросов за неделю:', requestsThisWeek);

  const requestsToday = await prisma.assistantRequest.count({
    where: {
      assistantId: assistantBigInt,
      createdAt: { gte: subDays(new Date(), 1) },
    },
  });
  console.log('Запросов за день:', requestsToday);

  // Получение количества игнорированных и отклоненных запросов
  console.log('Получаем количество игнорированных и отклоненных запросов');
  const ignoredRequests = await prisma.requestAction.count({
    where: { assistantId: assistantBigInt, action: 'IGNORED' },
  });
  console.log('Игнорированных запросов:', ignoredRequests);

  const rejectedRequests = await prisma.requestAction.count({
    where: { assistantId: assistantBigInt, action: 'REJECTED' },
  });
  console.log('Отклоненных запросов:', rejectedRequests);

  // Получение количества жалоб
  console.log('Получаем количество жалоб');
  const complaints = await prisma.complaint.count({
    where: { assistantId: assistantBigInt },
  });
  console.log('Количество жалоб:', complaints);

  // Получение сессий
  console.log('Получаем сессии ассистента');
  const sessions = await prisma.assistantSession.findMany({
    where: { assistantId: assistantBigInt },
  });
  console.log('Сессии ассистента:', sessions);

  const sessionCount = sessions.length;
  const totalSessionTime = sessions.reduce((total, session) => {
    if (session.endedAt) {
      return total + (session.endedAt.getTime() - session.startedAt.getTime());
    }
    return total;
  }, 0);
  const averageSessionTime = sessionCount > 0 ? totalSessionTime / sessionCount : 0;
  console.log('Общее время сессий (мс):', totalSessionTime);
  console.log('Среднее время сессии (мс):', averageSessionTime);

  // Получение разговоров для расчета среднего времени ответа
  console.log('Получаем разговоры для расчета среднего времени ответа');
  const conversations = await prisma.conversation.findMany({
    where: { assistantId: assistantBigInt },
    select: { assistantResponseTimes: true },
  });
  console.log('Разговоры ассистента:', conversations);

  const totalResponseTimes = conversations.reduce((total, conversation) => {
    const responseTimes = conversation.assistantResponseTimes as number[];
    return total + responseTimes.reduce((sum, time) => sum + time, 0);
  }, 0);

  const totalResponseCount = conversations.reduce((count, conversation) => {
    const responseTimes = conversation.assistantResponseTimes as number[];
    return count + responseTimes.length;
  }, 0);

  const averageResponseTime =
    totalResponseCount > 0 ? totalResponseTimes / totalResponseCount / 1000 : 0;
  console.log('Общее время ответов (мс):', totalResponseTimes);
  console.log('Количество ответов:', totalResponseCount);
  console.log('Среднее время ответа (с):', averageResponseTime);

  return {
    allRequests,
    requestsThisMonth,
    requestsThisWeek,
    requestsToday,
    ignoredRequests,
    rejectedRequests,
    complaints,
    sessionCount,
    averageSessionTime,
    averageResponseTime,
  };
}
