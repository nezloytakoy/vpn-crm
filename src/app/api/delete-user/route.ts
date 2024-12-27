import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  const { telegramId } = await request.json();

  try {
    const userTelegramId = BigInt(telegramId);

    // 1. Удаляем все записи в userTariff
    await prisma.userTariff.deleteMany({
      where: {
        userId: userTelegramId,
      },
    });

    // 2. Удаляем записи в referral
    await prisma.referral.deleteMany({
      where: {
        OR: [
          { userId: userTelegramId },
          { referredUserId: userTelegramId },
        ],
      },
    });

    // 3. Удаляем записи в complaint
    await prisma.complaint.deleteMany({
      where: { userId: userTelegramId },
    });

    // 4. Удаляем записи в assistantRequest
    await prisma.assistantRequest.deleteMany({
      where: { userId: userTelegramId },
    });

    // 5. Удаляем записи в conversation
    await prisma.conversation.deleteMany({
      where: { userId: userTelegramId },
    });

    // 6. Удаляем саму запись пользователя
    await prisma.user.delete({
      where: { telegramId: userTelegramId },
    });

    return NextResponse.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ошибка при удалении пользователя' }, { status: 500 });
  }
}
