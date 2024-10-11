import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, amount } = body;

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Неверные данные для запроса' }, { status: 400 });
    }

    // Добавляем новый запрос на вывод в базу данных
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: BigInt(userId),
        amount: parseFloat(amount),
      },
    });

    // Преобразуем BigInt в строку для корректной сериализации
    return NextResponse.json({
      success: true,
      requestId: withdrawalRequest.id.toString(), // Преобразуем BigInt в строку
    }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при создании запроса на вывод:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
