import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, userNickname, amount } = await req.json();

    // Проверка на необходимые поля
    if (!userId || !amount) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    // Создаем новую запись в таблице WithdrawalRequest
    const newWithdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: BigInt(userId),
        userNickname: userNickname || null,
        amount: parseFloat(amount),
        status: 'Требует рассмотрения', // Статус по умолчанию
      },
    });

    // Возвращаем успешный ответ
    return NextResponse.json({ success: true, data: newWithdrawalRequest }, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании запроса на вывод:', error);
    return NextResponse.json({ success: false, message: 'Error creating withdrawal request.' }, { status: 500 });
  }
}
