import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Извлекаем telegramId из запроса
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Telegram ID не указан.' },
        { status: 400 }
      );
    }

    // Преобразуем telegramId в BigInt
    const telegramIdBigInt = BigInt(telegramId);

    // Ищем пользователя в базе данных
    const user = await prisma.user.findUnique({
      where: {
        telegramId: telegramIdBigInt,
      },
      select: {
        assistantRequests: true, // Получаем количество запросов к ассистенту
        aiRequests: true, // Получаем количество запросов к ИИ
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден.' },
        { status: 404 }
      );
    }

    // Возвращаем данные по запросам
    return NextResponse.json({
      assistantRequests: user.assistantRequests,
      aiRequests: user.aiRequests,
    });
  } catch (error) {
    console.error('Ошибка при получении запросов:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных.' },
      { status: 500 }
    );
  }
}
