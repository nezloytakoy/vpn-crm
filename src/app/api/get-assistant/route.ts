import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { subDays, subMonths } from 'date-fns'; 

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const assistantId = url.searchParams.get('assistantId');

  if (!assistantId) {
    return NextResponse.json({ error: 'Не передан айди ассистента' }, { status: 400 });
  }

  try {
    const assistantBigInt = BigInt(assistantId);

    
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: assistantBigInt },
      select: {
        orderNumber: true,
        username: true,
        telegramId: true,
        avatarFileId: true,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Ассистент не найден' }, { status: 404 });
    }

    
    const serializedAssistant = {
      ...assistant,
      telegramId: assistant.telegramId.toString(),
    };

    
    const allRequests = await prisma.assistantRequest.count({
      where: { assistantId: assistantBigInt },
    });

    const requestsThisMonth = await prisma.assistantRequest.count({
      where: {
        assistantId: assistantBigInt,
        createdAt: { gte: subMonths(new Date(), 1) },
      },
    });

    const requestsThisWeek = await prisma.assistantRequest.count({
      where: {
        assistantId: assistantBigInt,
        createdAt: { gte: subDays(new Date(), 7) },
      },
    });

    const requestsToday = await prisma.assistantRequest.count({
      where: {
        assistantId: assistantBigInt,
        createdAt: { gte: subDays(new Date(), 1) },
      },
    });

    
    const ignoredRequests = await prisma.requestAction.count({
      where: { assistantId: assistantBigInt, action: 'IGNORED' },
    });

    const rejectedRequests = await prisma.requestAction.count({
      where: { assistantId: assistantBigInt, action: 'REJECTED' },
    });

    
    const complaints = await prisma.complaint.count({
      where: { assistantId: assistantBigInt },
    });

    
    const sessions = await prisma.assistantSession.findMany({
      where: { assistantId: assistantBigInt },
    });

    const sessionCount = sessions.length;
    const totalSessionTime = sessions.reduce((total, session) => {
      if (session.endedAt) {
        return total + (session.endedAt.getTime() - session.startedAt.getTime());
      }
      return total;
    }, 0);
    const averageSessionTime = totalSessionTime / sessionCount;

    
    const transactions = await prisma.assistantCoinTransaction.findMany({
      where: { assistantId: assistantBigInt },
      select: {
        amount: true,
        reason: true,
        createdAt: true,
      },
    });

    
    const serializedTransactions = transactions.map((transaction) => ({
      ...transaction,
      amount: transaction.amount.toString(),
    }));

    
    const pupils = await prisma.assistant.findMany({
      where: { mentorId: assistantBigInt },
      select: {
        telegramId: true,
        username: true,
        lastActiveAt: true,  
        orderNumber: true,   
      },
    });

    const serializedPupils = pupils.map((pupil) => ({
      ...pupil,
      telegramId: pupil.telegramId.toString(),
      lastActiveAt: pupil.lastActiveAt,  
    }));

    
    const conversations = await prisma.conversation.findMany({
      where: { assistantId: assistantBigInt },
      select: { assistantResponseTimes: true },
    });

    
    const totalResponseTimes = conversations.reduce((total, conversation) => {
      const responseTimes = conversation.assistantResponseTimes as number[]; 
      return total + responseTimes.reduce((sum, time) => sum + time, 0); 
    }, 0);

    
    const totalResponseCount = conversations.reduce((count, conversation) => {
      return count + (conversation.assistantResponseTimes as number[]).length;
    }, 0);

    const averageResponseTime =
      totalResponseCount > 0 ? totalResponseTimes / totalResponseCount : 0;

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
    });

  } catch (error) {
    console.error('Ошибка при получении информации ассистента:', error);
    return NextResponse.json({ error: 'Ошибка при получении ассистента' }, { status: 500 });
  }
}
