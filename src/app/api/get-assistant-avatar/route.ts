import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Если у вас Node.js < 18 и нужен node-fetch, раскомментируйте:
// import fetch from 'node-fetch';

const prisma = new PrismaClient();

export const revalidate = 1;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Для ассистента используем "telegramId", 
    // либо вы можете назвать параметр по-другому — например "assistantId"
    const telegramIdParam = searchParams.get('assistantId');

    console.log('Proxying image for assistant with telegramId:', telegramIdParam);

    if (!telegramIdParam) {
        return NextResponse.json({ error: 'No assistantId provided' }, { status: 400 });
    }

    try {
        // Ищем ассистента по telegramId
        const assistant = await prisma.assistant.findUnique({
            where: { telegramId: BigInt(telegramIdParam) },
            select: { avatarFileId: true }, // предполагаем, что здесь хранится URL
        });

        if (!assistant) {
            // Если ассистент не найден
            return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
        }

        // Если avatarFileId отсутствует или пустая строка => "no avatar"
        const avatarLink = assistant.avatarFileId || '';
        if (!avatarLink) {
            console.log(`Assistant has no avatar => returning "no avatar" but 200 OK`);
            return NextResponse.json({ error: 'no avatar' }, { status: 200 });
        }

        console.log('Fetching avatar from:', avatarLink);

        // Делаем запрос к avatarLink
        const response = await fetch(avatarLink);
        if (!response.ok) {
            console.error('Ошибка загрузки изображения:', response.status, response.statusText);
            // Превращаем любую ошибку загрузки в JSON-ответ (код 200),
            return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 200 });
        }

        // Считываем бинарные данные
        const imageBuffer = await response.arrayBuffer();

        // Берём Content-Type из исходного ответа
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        console.log(`Got content-type from server: ${contentType}`);

        // Возвращаем "сырое" изображение, ставим корректный Content-Type
        return new Response(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        console.error('Ошибка при проксировании изображения (assistant):', error);
        // Аналогично, если хотите статус 200, но "error" поле:
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 200 });
    }
}
