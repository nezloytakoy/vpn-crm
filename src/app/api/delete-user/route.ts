import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  const { telegramId } = await request.json();

  try {
    const userTelegramId = BigInt(telegramId);

    
    await prisma.referral.deleteMany({
      where: {
        OR: [
          { userId: userTelegramId },         
          { referredUserId: userTelegramId }, 
        ],
      },
    });

    
    await prisma.complaint.deleteMany({
      where: { userId: userTelegramId },
    });

    
    await prisma.assistantRequest.deleteMany({
      where: { userId: userTelegramId },
    });

    
    await prisma.conversation.deleteMany({
      where: { userId: userTelegramId },
    });

    
    await prisma.user.delete({
      where: { telegramId: userTelegramId },
    });

    return NextResponse.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ошибка при удалении пользователя' }, { status: 500 });
  }
}
