import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Если используете Node.js версии 18 или выше, fetch уже встроен
// import fetch from 'node-fetch'; 

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const withdrawId = url.searchParams.get('id');

    if (!withdrawId) {
      return NextResponse.json({ error: 'ID запроса не передан' }, { status: 400 });
    }

    
    const updatedWithdraw = await prisma.withdrawalRequest.update({
      where: { id: BigInt(withdrawId) },
      data: {
        status: 'REVIEWED',
      },
    });

    
    const { userId, userNickname, userRole } = updatedWithdraw;

    
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

    const chatId = userId.toString(); 
    const message = `Здравствуйте, ${userNickname || 'пользователь'}! Ваш запрос на вывод отклонен.`;

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
      message: 'Запрос на вывод отклонен, сообщение отправлено пользователю',
    });
  } catch (error) {
    console.error('Ошибка при отклонении запроса на вывод:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
