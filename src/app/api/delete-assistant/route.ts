import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  const { telegramId } = await request.json();

  try {
    const assistantId = BigInt(telegramId);

    // 1. Удаляем записи в RequestAction (или как у вас называется модель)
    await prisma.requestAction.deleteMany({
      where: { assistantId: assistantId },
    });

    // 2. Удаляем записи в assistantSession
    await prisma.assistantSession.deleteMany({
      where: { assistantId: assistantId },
    });

    // 3. Удаляем записи в conversation
    await prisma.conversation.deleteMany({
      where: { assistantId: assistantId },
    });

    // 4. Удаляем записи в assistantCoinTransaction
    await prisma.assistantCoinTransaction.deleteMany({
      where: { assistantId: assistantId },
    });

    // 5. Теперь удаляем ассистента
    await prisma.assistant.delete({
      where: { telegramId: assistantId },
    });

    return NextResponse.json({ message: 'Ассистент успешно удален' });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Ассистент не найден' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ошибка при удалении ассистента' }, { status: 500 });
  }
}
