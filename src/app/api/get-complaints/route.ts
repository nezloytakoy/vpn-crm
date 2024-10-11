import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем все жалобы (арбитражи) из базы данных
    const complaints = await prisma.arbitration.findMany({
      select: {
        id: true,
        reason: true,  // Жалоба (причина арбитража)
        userId: true,
        userNickname: true, // Поле userNickname
        assistantId: true,
        assistantNickname: true, // Поле assistantNickname
      },
    });

    // Возвращаем данные в формате JSON
    return NextResponse.json(complaints);
  } catch (error) {
    console.error('Ошибка при получении жалоб:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
