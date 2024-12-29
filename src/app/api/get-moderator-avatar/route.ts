import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Для Node.js < 18, если нужно:
// import fetch from 'node-fetch';

const prisma = new PrismaClient();

export const revalidate = 1;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const moderatorIdParam = searchParams.get('moderatorId');

    console.log('Proxying image for moderator with ID:', moderatorIdParam);

    // 1) Проверяем, что есть moderatorId
    if (!moderatorIdParam) {
        return NextResponse.json({ error: 'No moderatorId provided' }, { status: 400 });
    }

    try {
        // 2) Ищем запись в таблице Moderator
        const moderator = await prisma.moderator.findUnique({
            where: { id: BigInt(moderatorIdParam) }, // Если у вас тип поля - BigInt
            select: { avatarUrl: true },
        });

        if (!moderator) {
            // Если не нашли модератора
            return NextResponse.json({ error: 'Moderator not found' }, { status: 404 });
        }

        // 3) Если avatarUrl отсутствует или пустая строка
        const avatarLink = moderator.avatarUrl || '';
        if (!avatarLink) {
            console.log('Moderator has no avatar => returning no avatar (200 OK)');
            return NextResponse.json({ error: 'no avatar' }, { status: 200 });
        }

        console.log('Fetching avatar from:', avatarLink);

        // 4) Делаем запрос к avatarLink
        const response = await fetch(avatarLink);
        if (!response.ok) {
            // Ошибка при загрузке изображения — вернём JSON с error (200)
            console.error('Ошибка загрузки изображения:', response.status, response.statusText);
            return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 200 });
        }

        // 5) Считываем бинарные данные
        const imageBuffer = await response.arrayBuffer();

        // Определяем content-type (или по умолчанию image/jpeg)
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        console.log(`Got content-type from server: ${contentType}`);

        // 6) Возвращаем «сырое» изображение, ставим корректный Content-Type
        return new Response(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                // Укажите кэширование по желанию:
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        console.error('Ошибка при проксировании изображения (moderator):', error);
        // Аналогично, возвращаем JSON при ошибке
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 200 });
    }
}
