import { NextRequest, NextResponse } from 'next/server';   
import { PrismaClient } from '@prisma/client';
import { getAssistantRequests } from './assistantRequestsHelper';
import { getAssistantStatistics } from './assistantStatisticsHelper';

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {  
  const url = new URL(request.url);
  const assistantId = url.searchParams.get('assistantId');

  if (!assistantId) {
    return NextResponse.json({ error: 'Не передан айди ассистента' }, { status: 400 });
  }

  try {
    const assistantBigInt = BigInt(assistantId);

    console.log(`Получаем информацию об ассистенте с ID: ${assistantBigInt.toString()}`);

    // Получение информации об ассистенте
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: assistantBigInt },
      select: {
        orderNumber: true,
        username: true,
        telegramId: true,
        avatarFileId: true,
      },
    });

    console.log('Информация об ассистенте:', assistant);

    if (!assistant) {
      console.error('Ассистент не найден');
      return NextResponse.json({ error: 'Ассистент не найден' }, { status: 404 });
    }

    const serializedAssistant = {
      ...assistant,
      telegramId: assistant.telegramId.toString(),
    };

    // Получение статистики ассистента (вынесено в отдельный файл)
    const {
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
    } = await getAssistantStatistics(assistantBigInt);

    // Получение транзакций
    console.log('Получаем транзакции ассистента');
    const transactions = await prisma.assistantCoinTransaction.findMany({
      where: { assistantId: assistantBigInt },
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
    });
    console.log('Транзакции ассистента:', transactions);

    const serializedTransactions = transactions.map((transaction) => ({
      id: transaction.id.toString(),
      amount: transaction.amount,
      reason: transaction.reason,
      createdAt: transaction.createdAt.toISOString(),
    }));

    // Получение учеников
    console.log('Получаем учеников ассистента');
    const pupils = await prisma.assistant.findMany({
      where: { mentorId: assistantBigInt },
      select: {
        telegramId: true,
        username: true,
        lastActiveAt: true,
        orderNumber: true,
        isWorking: true,
        isBusy: true,
      },
    });
    console.log('Ученики ассистента:', pupils);

    const serializedPupils = pupils.map((pupil) => ({
      ...pupil,
      telegramId: pupil.telegramId.toString(),
    }));

    // Получение и обработка запросов ассистента (уже вынесено в отдельный файл)
    const serializedAssistantRequests = await getAssistantRequests(assistantBigInt);

    // Возвращаем все собранные данные
    return NextResponse.json({
      assistant: serializedAssistant,
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
      transactions: serializedTransactions,
      pupils: serializedPupils,
      assistantRequests: serializedAssistantRequests,
    });

  } catch (error) {
    console.error('Ошибка при получении информации ассистента:', error);
    return NextResponse.json({ error: 'Ошибка при получении ассистента' }, { status: 500 });
  }
}
