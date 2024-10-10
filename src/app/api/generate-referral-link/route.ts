import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Не указан userId' }, { status: 400 });
    }

    // Проверяем, существует ли уже реферальная ссылка для данного пользователя
    const existingReferral = await prisma.referral.findUnique({
      where: {
        userId: BigInt(userId),
      },
    });

    if (existingReferral) {
      return NextResponse.json({ referralLink: existingReferral.link }, { status: 200 });
    }

    // Генерируем уникальный код
    const referralCode = nanoid(10);

    // Формируем реферальную ссылку
    const botUsername = 'YourBotUsername'; // Замените на имя вашего бота
    const referralLink = `https://t.me/${botUsername}?start=ref_${referralCode}`;

    // Сохраняем реферальную ссылку в базе данных
    await prisma.referral.create({
      data: {
        userId: BigInt(userId),
        code: referralCode,
        link: referralLink,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ referralLink }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при генерации реферальной ссылки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
