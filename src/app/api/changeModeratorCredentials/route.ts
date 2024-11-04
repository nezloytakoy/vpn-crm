import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { moderatorId, login, password } = body;

    
    if (!moderatorId || !login || !password) {
      return NextResponse.json({ error: 'Необходимо указать moderatorId, login и password' }, { status: 400 });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const existingModerator = await prisma.moderator.findUnique({
      where: { login },
    });

    if (existingModerator && existingModerator.id !== BigInt(moderatorId)) {
      return NextResponse.json({ error: 'Этот логин уже занят другим модератором' }, { status: 400 });
    }

    
    await prisma.moderator.update({
      where: { id: BigInt(moderatorId) },
      data: {
        login,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'Данные модератора успешно обновлены' }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при обновлении данных модератора:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
