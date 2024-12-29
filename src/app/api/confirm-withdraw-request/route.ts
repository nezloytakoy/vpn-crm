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

    // --- Ниже мы УБИРАЕМ вычитание коинов (coins: { decrement: ... }) ---
    // Вместо этого — просто логика проверки и/или уведомлений

    // if (userRole === 'user') {
    //   // Раньше тут вычитали коины у user, теперь не делаем этого
    // } else if (userRole === 'assistant') {
    //   // Раньше тут вычитали коины у assistant и создавали AssistantCoinTransaction
    // }

    // Можете оставить проверку, если хотите удостовериться, 
    // что пользователь/ассистент вообще существует, 
    // или отправить какое-то уведомление:
    if (userRole === 'user') {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(userId) },
      });
      if (!user) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
      }
      // Здесь без изменения баланса
    } else if (userRole === 'assistant') {
      const assistant = await prisma.assistant.findUnique({
        where: { telegramId: BigInt(userId) },
      });
      if (!assistant) {
        return NextResponse.json({ error: 'Ассистент не найден' }, { status: 404 });
      }
      // Здесь без изменения баланса и без AssistantCoinTransaction
    } else {
      console.error('Неизвестная роль пользователя:', userRole);
      return NextResponse.json({ error: 'Неизвестная роль пользователя' }, { status: 400 });
    }

    // Продолжение вашего кода (например, отправка сообщения в Telegram о том, 
    // что вывод "одобрен" — но фактически коины НЕ списываются)

    return NextResponse.json({
      message: `Запрос на вывод (amount=${parsedAmount}) одобрен (но коины НЕ списаны).`,
    });
  } catch (error) {
    console.error('Ошибка при одобрении запроса на вывод:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
