import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Получен запрос на получение деталей вывода');

    const url = new URL(request.url);
    const withdrawId = url.searchParams.get('id');

    console.log('ID запроса на вывод:', withdrawId);

    if (!withdrawId) {
      console.log('Ошибка: ID запроса не передан');
      return NextResponse.json({ error: 'ID запроса не передан' }, { status: 400 });
    }

    const withdraw = await prisma.withdrawalRequest.findUnique({
      where: { id: BigInt(withdrawId) }, 
    });

    console.log('Данные запроса на вывод:', withdraw);

    if (!withdraw) {
      console.log('Ошибка: Запрос на вывод не найден');
      return NextResponse.json({ error: 'Запрос не найден' }, { status: 404 });
    }

    
    let orderNumber = null;

    if (withdraw.userRole === 'user') {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(withdraw.userId) },
        select: { orderNumber: true },
      });
      if (user && user.orderNumber !== null) {
        orderNumber = user.orderNumber;
      }
    } else if (withdraw.userRole === 'assistant') {
      const assistant = await prisma.assistant.findUnique({
        where: { telegramId: BigInt(withdraw.userId) },
        select: { orderNumber: true },
      });
      if (assistant && assistant.orderNumber !== null) {
        orderNumber = assistant.orderNumber;
      }
    }

    console.log('Запрос на вывод найден, отправляем ответ');

    return NextResponse.json({
      id: withdraw.id.toString(),
      userId: withdraw.userId.toString(),
      userNickname: withdraw.userNickname,
      userRole: withdraw.userRole === 'user' ? 'Пользователь' : 'Ассистент',
      amount: withdraw.amount,
      orderNumber: orderNumber, 
    });
  } catch (error) {
    console.error('Ошибка при обработке запроса на вывод:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
