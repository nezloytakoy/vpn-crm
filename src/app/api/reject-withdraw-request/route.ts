import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const withdrawId = url.searchParams.get('id');

    if (!withdrawId) {
      return NextResponse.json({ error: 'ID запроса не передан' }, { status: 400 });
    }

    // 1. Обновляем статус запроса на вывод (допустим, "REVIEWED" или "REJECTED")
    //    и получаем данные о сумме, роли и т.д.
    const updatedWithdraw = await prisma.withdrawalRequest.update({
      where: { id: BigInt(withdrawId) },
      data: {
        status: 'REVIEWED', // или "REJECTED", если хотите явно обозначить "отклонён"
      },
    });

    const { userId, userNickname, userRole, amount } = updatedWithdraw;

    // 2. Находим корректный токен бота
    let botToken: string | undefined;
    if (userRole === 'user') {
      botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    } else if (userRole === 'assistant') {
      botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    } else {
      console.error('Неизвестная роль пользователя:', userRole);
      return NextResponse.json({ error: 'Неизвестная роль пользователя' }, { status: 400 });
    }

    if (!botToken) {
      console.error('Токен Telegram бота не задан для роли:', userRole);
      return NextResponse.json({ error: 'Токен бота не задан' }, { status: 500 });
    }

    // 3. Возвращаем ранее списанные коины обратно на баланс
    //    - Если userRole === 'user', обновляем таблицу User.
    //    - Если userRole === 'assistant', обновляем таблицу Assistant.
    const userIdBigInt = BigInt(userId);

    if (userRole === 'user') {
      await prisma.user.update({
        where: { telegramId: userIdBigInt },
        data: {
          coins: { increment: amount },
        },
      });
    } else if (userRole === 'assistant') {
      await prisma.assistant.update({
        where: { telegramId: userIdBigInt },
        data: {
          coins: { increment: amount },
        },
      });
    }

    // 4. Отправляем сообщение в Telegram о том, что запрос отклонён
    const chatId = userId.toString();
    const message = `Здравствуйте, ${userNickname || 'пользователь'}! Ваш запрос на вывод отклонен. Коинов возвращено: ${amount}.`;

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    const telegramResult = await telegramResponse.json();
    if (!telegramResult.ok) {
      console.error('Ошибка при отправке сообщения в Telegram:', telegramResult);
    } else {
      console.log('Сообщение успешно отправлено пользователю');
    }

    return NextResponse.json({
      message: 'Запрос на вывод отклонен, коины возвращены, сообщение отправлено пользователю',
    });
  } catch (error) {
    console.error('Ошибка при отклонении запроса на вывод:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
