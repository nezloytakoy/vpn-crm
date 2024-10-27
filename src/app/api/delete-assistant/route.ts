import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  const { telegramId } = await request.json();

  try {
    
    await prisma.assistantSession.deleteMany({
      where: { assistantId: BigInt(telegramId) },
    });

    
    await prisma.conversation.deleteMany({
      where: { assistantId: BigInt(telegramId) },
    });

    
    await prisma.assistantCoinTransaction.deleteMany({
      where: { assistantId: BigInt(telegramId) },
    });

    
    await prisma.assistant.delete({
      where: { telegramId: BigInt(telegramId) },
    });

    return NextResponse.json({ message: 'Ассистент успешно удален' });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Ассистент не найден' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ошибка при удалении ассистента' }, { status: 500 });
  }
}
