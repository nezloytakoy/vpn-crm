import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

async function sendMessageToTelegram(telegramId: bigint, message: string, token: string) {
  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  console.log(`Отправка сообщения в Telegram ID: ${telegramId}, Текст: ${message}`);

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
    console.error('Ошибка при отправке сообщения в Telegram:', errorDetails);
    throw new Error(`Ошибка при отправке сообщения в Telegram: ${errorDetails.description}`);
  }

  console.log('Сообщение успешно отправлено в Telegram');
}

export async function POST(req: NextRequest) {
  try {
    console.log("Запрос получен, начало обработки");

    const { complaintId, explanation } = await req.json();
    console.log("Тело запроса:", { complaintId, explanation });

    if (!complaintId || !explanation) {
      console.error("Отсутствуют необходимые данные");
      return NextResponse.json({ error: 'Отсутствуют необходимые данные' }, { status: 400 });
    }

    
    console.log(`Поиск жалобы с ID: ${complaintId}`);
    const complaint = await prisma.complaint.findUnique({
      where: { id: BigInt(complaintId) },
    });

    if (!complaint) {
      console.error(`Жалоба с ID ${complaintId} не найдена`);
      return NextResponse.json({ error: 'Жалоба не найдена' }, { status: 404 });
    }

    console.log('Жалоба найдена:', complaint);

    
    console.log(`Начисление коина пользователю с ID: ${complaint.userId}`);
    await prisma.user.update({
      where: { telegramId: complaint.userId },
      data: { coins: { increment: 1 } },
    });

    console.log(`Коин успешно начислен пользователю с ID: ${complaint.userId}`);

    
    const userMessage = `Ваша жалоба одобрена. Вам начислен 1 койн. ${explanation}`;
    const assistantMessage = `Жалоба пользователя показалась модератору убедительной. ${explanation}`;

    const supportBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;

    if (!supportBotToken || !userBotToken) {
      console.error('Не найдены токены Telegram для отправки сообщений');
      throw new Error('Не найдены токены Telegram для отправки сообщений');
    }

    console.log('Отправка сообщения пользователю');
    await sendMessageToTelegram(complaint.userId, userMessage, userBotToken);

    console.log('Отправка сообщения ассистенту');
    await sendMessageToTelegram(complaint.assistantId, assistantMessage, supportBotToken);

    console.log('Сообщения успешно отправлены');

    
    console.log(`Обновление статуса жалобы с ID ${complaint.id} на REVIEWED`);
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'REVIEWED',
        decision: explanation,
      },
    });

    console.log(`Статус жалобы с ID ${complaint.id} успешно обновлен`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при обработке жалобы:', error);
    return NextResponse.json({ error: 'Произошла ошибка' }, { status: 500 });
  }
}
