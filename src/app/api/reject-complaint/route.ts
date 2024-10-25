import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Function to send messages via Telegram
async function sendMessageToTelegram(telegramId: bigint, message: string, token: string) {
  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId.toString(),
      text: message,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(`Ошибка при отправке сообщения в Telegram: ${errorDetails.description}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Запрос получен, начало обработки");

    
    const { complaintId, explanation, moderatorId } = await req.json();
    console.log("Тело запроса:", { complaintId, explanation, moderatorId });

    if (!complaintId || !explanation || !moderatorId) {
      return NextResponse.json({ error: 'Отсутствуют необходимые данные' }, { status: 400 });
    }

    console.log(`Пользователь с ID ${moderatorId} выполняет запрос`);

    
    const complaint = await prisma.complaint.findUnique({
      where: { id: BigInt(complaintId) },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Жалоба не найдена' }, { status: 404 });
    }

    console.log('Жалоба найдена:', complaint);

    
    await prisma.user.update({
      where: { telegramId: complaint.userId },
      data: { coins: { increment: 1 } },
    });

    
    const userMessage = `Ваша жалоба одобрена. Вам начислен 1 койн. ${explanation}`;
    const assistantMessage = `Жалоба пользователя показалась модератору убедительной. ${explanation}`;
    const supportBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;

    if (!supportBotToken || !userBotToken) {
      return NextResponse.json({ error: 'Не найдены токены Telegram для отправки сообщений' }, { status: 500 });
    }

    await sendMessageToTelegram(complaint.userId, userMessage, userBotToken);
    await sendMessageToTelegram(complaint.assistantId, assistantMessage, supportBotToken);
    console.log('Сообщения успешно отправлены');

    
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'REVIEWED',
        decision: explanation,
        moderatorId: BigInt(moderatorId),  
      },
    });

    
    const moderator = await prisma.moderator.findUnique({
      where: { id: BigInt(moderatorId) },
    });

    if (moderator) {
      console.log(`Увеличение счетчика рассмотренных жалоб для модератора с ID ${moderatorId}`);
      await prisma.moderator.update({
        where: { id: BigInt(moderatorId) },
        data: {
          reviewedComplaintsCount: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });
      console.log('Счетчик рассмотренных жалоб успешно увеличен и время активности обновлено');
    } else {
      console.log(`Пользователь с ID ${moderatorId} не является модератором. Логика, связанная с модератором, пропущена.`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Ошибка при обработке жалобы:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Произошла ошибка' }, { status: 500 });
  }
}
