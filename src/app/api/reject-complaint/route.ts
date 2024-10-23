import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

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
    console.error("Ошибка при отправке сообщения в Telegram:", errorDetails);
    throw new Error(`Ошибка при отправке сообщения в Telegram: ${errorDetails.description}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Запрос получен, начало обработки");
    
    const { complaintId, explanation, moderatorId } = await req.json();
    console.log("Тело запроса:", { complaintId, explanation, moderatorId });

    if (!complaintId || !explanation || !moderatorId) {
      console.error("Отсутствуют необходимые данные");
      return NextResponse.json({ error: 'Отсутствуют необходимые данные' }, { status: 400 });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: BigInt(complaintId) },
    });

    if (!complaint) {
      console.error("Жалоба не найдена");
      return NextResponse.json({ error: 'Жалоба не найдена' }, { status: 404 });
    }

    console.log("Жалоба найдена:", complaint);

    
    await prisma.assistant.update({
      where: { telegramId: complaint.assistantId },
      data: { coins: { increment: 1 } },
    });

    console.log(`Коин успешно начислен ассистенту с ID: ${complaint.assistantId}`);

    
    await prisma.assistantCoinTransaction.create({
      data: {
        assistantId: complaint.assistantId,
        amount: 1,
        reason: 'Жалоба отклонена, начислен коин',
      },
    });

    const assistantMessage = `Жалоба пользователя на вас отклонена модератором. Вы получаете 1 коин: ${explanation}`;
    const userMessage = `Ваша жалоба на ассистента отклонена. ${explanation}`;

    const supportBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;

    if (!supportBotToken || !userBotToken) {
      throw new Error("Не найдены токены Telegram для отправки сообщений");
    }

    await sendMessageToTelegram(complaint.assistantId, assistantMessage, supportBotToken);
    await sendMessageToTelegram(complaint.userId, userMessage, userBotToken);

    console.log("Сообщения успешно отправлены");

    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'REVIEWED',
        decision: explanation,
      },
    });

    console.log("Жалоба обновлена, статус REVIEWED");

    
    console.log(`Увеличение счетчика рассмотренных жалоб для модератора с ID: ${moderatorId}`);
    await prisma.moderator.update({
      where: { id: BigInt(moderatorId) },
      data: { reviewedComplaintsCount: { increment: 1 } },
    });

    console.log('Счетчик рассмотренных жалоб успешно увеличен');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при обработке жалобы:', error);
    return NextResponse.json({ error: 'Произошла ошибка' }, { status: 500 });
  }
}
