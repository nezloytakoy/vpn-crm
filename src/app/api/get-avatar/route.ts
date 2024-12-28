import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Если у вас Node.js < 18 и нужен node-fetch, импортируйте:
// import fetch from 'node-fetch';

const prisma = new PrismaClient();

const DEFAULT_IMAGE_URL = 'https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg';

export const revalidate = 1;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const telegramId = searchParams.get('telegramId');

  console.log('Proxying image for user with telegramId:', telegramId);

  // Проверяем, что нам передали "telegramId"
  if (!telegramId) {
    return NextResponse.json({ error: 'No telegramId provided' }, { status: 400 });
  }

  try {
    // Ищем в базе пользователя, достаём avatarUrl
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Если avatarUrl отсутствует или пустая строка — подставляем заглушку
    let avatarLink = user.avatarUrl || '';
    if (!avatarLink) {
      console.log(`User has no avatarUrl; using default image: ${DEFAULT_IMAGE_URL}`);
      avatarLink = DEFAULT_IMAGE_URL;
    }

    console.log('Fetching avatar from:', avatarLink);

    // Делаем запрос к avatarLink (это может быть либо Telegram-ссылка, либо CDN, либо ваша заглушка)
    const response = await fetch(avatarLink);
    if (!response.ok) {
      console.error('Ошибка загрузки изображения:', response.status, response.statusText);
      return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 500 });
    }

    // Считываем бинарные данные
    const imageBuffer = await response.arrayBuffer();

    // Возвращаем "сырое" изображение
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Ошибка при проксировании изображения:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
