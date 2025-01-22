import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/test-post
export async function POST(request: Request) {
  console.log("Работаем test-post route...");
  try {
    const body = await request.json().catch(() => null);
    const { userId } = body || {};

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    let telegramIdBigInt: bigint;
    try {
      telegramIdBigInt = BigInt(userId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Telegram ID format.' },
        { status: 400 }
      );
    }

    // Ищем самую "свежую" запись userTariff, не истекшую
    const now = new Date();
    const freshestTariff = await prisma.userTariff.findFirst({
      where: {
        userId: telegramIdBigInt,
        expirationDate: { gt: now },
      },
      orderBy: { expirationDate: 'desc' },
    });

    if (!freshestTariff) {
      console.log("No active tariff found for user", userId);
      return NextResponse.json(
        { error: 'No active tariff found for this user.' },
        { status: 404 }
      );
    }

    // Преобразуем BigInt -> string, чтобы не было ошибки
    return NextResponse.json(
      {
        // Если tariffId не null, переводим в строку,
        // иначе null
        tariffId: freshestTariff.tariffId
          ? freshestTariff.tariffId.toString()
          : null,
        expirationDate: freshestTariff.expirationDate,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in test-post route logic:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
