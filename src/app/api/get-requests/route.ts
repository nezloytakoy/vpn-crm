import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const revalidate = 1;

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      console.log('Telegram ID не указан.');
      return NextResponse.json(
        { error: 'Telegram ID не указан.' },
        { status: 400 }
      );
    }

    const telegramIdBigInt = BigInt(telegramId);
    console.log(`Searching for user tariffs with Telegram ID: ${telegramId}`);

    // Найти все записи UserTariff для указанного пользователя
    const userTariffs = await prisma.userTariff.findMany({
      where: {
        userId: telegramIdBigInt,
      },
    });

    if (!userTariffs || userTariffs.length === 0) {
      console.log(`No tariffs found for user with Telegram ID ${telegramId}`);
      return NextResponse.json(
        { error: 'Нет активных тарифов для пользователя.' },
        { status: 404 }
      );
    }

    // Фильтрация активных тарифов (с ненаступившей expirationDate)
    const now = new Date();
    const activeTariffs = userTariffs.filter(tariff => new Date(tariff.expirationDate) > now);

    // Если нет активных тарифов
    if (activeTariffs.length === 0) {
      console.log(`No active tariffs found for user with Telegram ID ${telegramId}`);
      return NextResponse.json(
        { error: 'У пользователя нет активных тарифов.' },
        { status: 404 }
      );
    }

    // Суммирование оставшихся запросов
    const totalAssistantRequests = activeTariffs.reduce(
      (sum, tariff) => sum + tariff.remainingAssistantRequests,
      0
    );
    const totalAIRequests = activeTariffs.reduce(
      (sum, tariff) => sum + tariff.remainingAIRequests,
      0
    );

    console.log(`Total assistant requests: ${totalAssistantRequests}, Total AI requests: ${totalAIRequests}`);
    return NextResponse.json({
      assistantRequests: totalAssistantRequests,
      aiRequests: totalAIRequests,
    });
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных.' },
      { status: 500 }
    );
  }
}
