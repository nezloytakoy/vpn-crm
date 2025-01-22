import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Считываем JSON-данные из тела запроса
    const body = await request.json();
    const telegramId = body.userId; // <-- userId приходит из JSON, не из query-параметра

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Telegram ID is required.' },
        { status: 400 }
      );
    }

    let telegramIdBigInt: bigint;
    try {
      telegramIdBigInt = BigInt(telegramId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Telegram ID format.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        telegramId: telegramIdBigInt,
      },
      include: {
        lastPaidSubscription: {
          select: {
            name: true,
            description: true,
            price: true,
            aiRequestCount: true,
            assistantRequestCount: true,
            allowVoiceToAI: true,
            allowVoiceToAssistant: true,
            allowVideoToAssistant: true,
            allowFilesToAssistant: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    if (!user.lastPaidSubscription) {
      return NextResponse.json(
        { error: 'No subscription found for this user.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { subscription: user.lastPaidSubscription },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
