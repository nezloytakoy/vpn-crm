import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 1;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const telegramId = searchParams.get('telegramId');

  console.log('Fetching avatar for user with telegramId:', telegramId);

  if (!telegramId) {
    return NextResponse.json({ error: 'No telegramId provided' }, { status: 400 });
  }

  try {
    // 1. Ищем пользователя по telegramId, достаём avatarData
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { avatarData: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Проверяем, есть ли данные аватарки
    if (!user.avatarData) {
      // Если нет аватарки, можно вернуть некий ответ или, например, отдать "пустую" картинку
      return NextResponse.json({ error: 'No avatar' }, { status: 200 });
    }

    // 3. Отправляем «сырые» байты, предполагая что это, например, JPEG
    //    (Если вы храните MIME-тип где-то, используйте его вместо 'image/jpeg')
    return new Response(user.avatarData, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Ошибка при получении аватарки из базы:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
