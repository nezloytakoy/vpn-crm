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
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Некорректное значение для суммы вывода' }, { status: 400 });
    }

    // Обновляем статус запроса на вывод на 'APPROVED'
    const updatedWithdraw = await prisma.withdrawalRequest.update({
      where: { id: BigInt(withdrawId) },
      data: {
        status: 'APPROVED',
      },
    });

    const { userId, userRole } = updatedWithdraw;

    let updatedBalance;

    if (userRole === 'user') {
      const user = await prisma.user.update({
        where: { telegramId: BigInt(userId) },
        data: {
          coins: {
            decrement: parsedAmount, 
          },
        },
      });

      updatedBalance = user.coins;

    } else if (userRole === 'assistant') {
      const assistant = await prisma.assistant.update({
        where: { telegramId: BigInt(userId) },
        data: {
          coins: {
            decrement: parsedAmount, 
          },
        },
      });

      updatedBalance = assistant.coins;

      // Добавляем запись в AssistantCoinTransaction
      await prisma.assistantCoinTransaction.create({
        data: {
          assistantId: BigInt(userId),
          amount: -parsedAmount, // Отрицательное значение, так как это вывод коинов
          reason: 'Вывод коинов',
        },
      });

    } else {
      console.error('Неизвестная роль пользователя:', userRole);
      return NextResponse.json({ error: 'Неизвестная роль пользователя' }, { status: 400 });
    }

    if (updatedBalance < 0) {
      return NextResponse.json({ error: 'Недостаточно средств на счете' }, { status: 400 });
    }

    // Продолжение вашего кода (отправка сообщения в Telegram и т.д.)

    return NextResponse.json({
      message: `Запрос на вывод ${parsedAmount} коинов одобрен, сообщение отправлено пользователю`,
    });
  } catch (error) {
    console.error('Ошибка при одобрении запроса на вывод:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
