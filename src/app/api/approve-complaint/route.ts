import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const prisma = new PrismaClient();

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

    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Токен авторизации не предоставлен' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const moderatorId = payload.sub ? BigInt(payload.sub) : null;

    if (!moderatorId) {
      return NextResponse.json({ error: 'Invalid token: moderator ID is missing' }, { status: 400 });
    }


    console.log(`Модератор с ID ${moderatorId} выполняет запрос`);

    const { complaintId, explanation } = await req.json();
    console.log("Тело запроса:", { complaintId, explanation });

    if (!complaintId || !explanation) {
      return NextResponse.json({ error: 'Отсутствуют необходимые данные' }, { status: 400 });
    }

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
      },
    });

    
    await prisma.moderator.update({
      where: { id: moderatorId },
      data: { reviewedComplaintsCount: { increment: 1 } },
    });

    console.log('Счетчик рассмотренных жалоб успешно увеличен');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при обработке жалобы:', error);
    return NextResponse.json({ error: 'Произошла ошибка' }, { status: 500 });
  }
}
