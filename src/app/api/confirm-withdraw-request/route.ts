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

    const { amount } = await request.json(); 

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Некорректное значение для суммы вывода' }, { status: 400 });
    }

    
    const updatedWithdraw = await prisma.withdrawalRequest.update({
      where: { id: BigInt(withdrawId) },
      data: {
        status: 'APPROVED',
      },
    });

    
    const { userId, userNickname, userRole } = updatedWithdraw;

    let updatedBalance;
    
    if (userRole === 'user') {
      
      const user = await prisma.user.update({
        where: { telegramId: BigInt(userId) },
        data: {
          coins: {
            decrement: amount, 
          },
        },
      });

      updatedBalance = user.coins;

    } else if (userRole === 'assistant') {
      
      const assistant = await prisma.assistant.update({
        where: { telegramId: BigInt(userId) },
        data: {
          coins: {
            decrement: amount, 
          },
        },
      });

      updatedBalance = assistant.coins;

    } else {
      console.error('Неизвестная роль пользователя:', userRole);
      return NextResponse.json({ error: 'Неизвестная роль пользователя' }, { status: 400 });
    }

    
    if (updatedBalance < 0) {
      return NextResponse.json({ error: 'Недостаточно средств на счете' }, { status: 400 });
    }

    
    let botToken: string | undefined;

    if (userRole === 'user') {
      botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    } else if (userRole === 'assistant') {
      botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    }

    if (!botToken) {
      console.error('Токен Telegram бота не задан для роли:', userRole);
      return NextResponse.json({ error: 'Токен бота не задан' }, { status: 500 });
    }

    const chatId = userId.toString(); 
    const message = `Здравствуйте, ${userNickname || 'пользователь'}! Ваш запрос на вывод ${amount} коинов одобрен.`; 

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
      message: `Запрос на вывод ${amount} коинов одобрен, сообщение отправлено пользователю`,
    });
  } catch (error) {
    console.error('Ошибка при одобрении запроса на вывод:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
