import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userNickname, userRole } = body;

    if (!userId || !userNickname || !userRole) {
      return NextResponse.json({ error: 'Неверные данные для запроса' }, { status: 400 });
    }

    
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    
    const amount = user.coins;

    if (amount <= 0) {
      return NextResponse.json({ error: 'Недостаточно коинов на балансе для вывода' }, { status: 400 });
    }

    
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: BigInt(userId),
        userNickname: userNickname,
        userRole: userRole,
        amount: amount, 
      },
    });

    
    return NextResponse.json({
      success: true,
      requestId: withdrawalRequest.id.toString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Ошибка при создании запроса на вывод:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
