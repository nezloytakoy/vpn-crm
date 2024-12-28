import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Если у вас Node.js < 18 и нужен node-fetch, импортируйте:
// import fetch from 'node-fetch';

const prisma = new PrismaClient();

export const revalidate = 1;

export async function GET(request: Request) {
    // Парсим query-параметры
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

        if (!user.avatarUrl) {
            return NextResponse.json({ error: 'User has no avatarUrl' }, { status: 404 });
        }

        // Теперь user.avatarUrl содержит ссылку, по которой надо проксировать изображение.
        // Например: "https://api.telegram.org/file/bot<Токен>/photos/file_141.jpg"
        // Или любая другая публичная ссылка.

        const avatarLink = user.avatarUrl;
        console.log('Fetching avatar from:', avatarLink);

        // Делаем запрос к avatarLink
        const response = await fetch(avatarLink);
        if (!response.ok) {
            return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 500 });
        }

        // Считываем бинарные данные
        const imageBuffer = await response.arrayBuffer();

        // Возвращаем "сырое" изображение
        // При желании возьмите MIME-тип из `response.headers.get('content-type')`
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
