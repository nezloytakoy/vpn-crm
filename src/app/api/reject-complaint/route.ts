import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Функция для отправки сообщений в Telegram
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
    console.log("Запрос получен, начало обработки (ОТКЛОНЕНИЕ жалобы в пользу ассистента)");

    const { complaintId, explanation, moderatorId } = await req.json();
    console.log("Тело запроса:", { complaintId, explanation, moderatorId });

    if (!complaintId || !explanation || !moderatorId) {
      return NextResponse.json({ error: 'Отсутствуют необходимые данные' }, { status: 400 });
    }

    console.log(`Пользователь с ID ${moderatorId} выполняет запрос (ОТКЛОНЕНИЕ в пользу ассистента)`);

    // Проверяем наличие жалобы
    const complaint = await prisma.complaint.findUnique({
      where: { id: BigInt(complaintId) },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Жалоба не найдена' }, { status: 404 });
    }

    console.log('Жалоба найдена:', complaint);

    // === Начисляем 1 коин АССИСТЕНТУ, а НЕ пользователю ===
    // complaint.assistantId — это TelegramID ассистента
    await prisma.user.update({
      where: { telegramId: complaint.assistantId },
      data: { coins: { increment: 1 } },
    });

    // Меняем тексты сообщений:
    // Пользователю: сообщаем, что жалоба отклонена, ассистент прав
    // Ассистенту: сообщаем, что он в итоге «выиграл» (жалоба признана несостоятельной, и ему начислен 1 койн).
    const userMessage = `Ваша жалоба отклонена. ${explanation}`;
    const assistantMessage = `Жалоба пользователя оказалась несостоятельной. Вам начислен 1 койн. ${explanation}`;

    const supportBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;

    if (!supportBotToken || !userBotToken) {
      return NextResponse.json({ error: 'Не найдены токены Telegram для отправки сообщений' }, { status: 500 });
    }

    // Отправляем сообщения в Telegram
    await sendMessageToTelegram(complaint.userId, userMessage, userBotToken);
    await sendMessageToTelegram(complaint.assistantId, assistantMessage, supportBotToken);
    console.log('Сообщения (об отклонении в пользу ассистента) успешно отправлены');

    // Проверяем, является ли пользователь модератором
    const moderator = await prisma.moderator.findUnique({
      where: { id: BigInt(moderatorId) },
    });

    // Проверяем, является ли пользователь администратором
    const admin = await prisma.admin.findUnique({
      where: { id: BigInt(moderatorId) },
    });

    // Если пользователь не найден ни в модераторах, ни в администраторах, возвращаем ошибку
    if (!moderator && !admin) {
      return NextResponse.json({ error: 'Пользователь не найден в таблицах Moderator и Admin' }, { status: 404 });
    }

    // Обновляем жалобу: статус "REJECTED" или аналогичный
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'REJECTED', // <-- статус, показывающий, что жалоба была отклонена
        decision: explanation,
        moderatorId: moderator ? BigInt(moderatorId) : null, // Привязываем ID модератора только если это модератор
      },
    });

    // Если пользователь модератор, обновляем его данные
    if (moderator) {
      console.log(`Обновление данных модератора с ID ${moderatorId} (ОТКЛОНЕНИЕ в пользу ассистента)`);
      await prisma.moderator.update({
        where: { id: BigInt(moderatorId) },
        data: {
          reviewedComplaintsCount: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });
      console.log('Данные модератора успешно обновлены (отклонил жалобу в пользу ассистента)');
    } else if (admin) {
      console.log(`Пользователь с ID ${moderatorId} является администратором. (ОТКЛОНЕНИЕ в пользу ассистента)`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отклонении жалобы:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Произошла ошибка' }, { status: 500 });
  }
}
