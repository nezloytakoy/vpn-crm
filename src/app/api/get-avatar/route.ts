import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Допустим, если у нас "Telegram file path", то
// нужно подтянуть токен для запросов к Telegram
const BOT_TOKEN = process.env.BOT_TOKEN || "";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');
        // Параметр raw говорит: "Вернуть raw-байты изображения"
        const raw = searchParams.get('raw') === 'true';

        if (!telegramId) {
            return NextResponse.json({ error: 'No telegramId' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
            select: { avatarUrl: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Если avatarUrl пустое, вернём заглушку или пустую строку
        const storedUrl = user.avatarUrl || "";
        if (!storedUrl) {
            if (raw) {
                // Возвращаем, к примеру, заглушку (или 404)
                // Можете вернуть NextResponse.redirect(...) на какую-то картинку
                // или вернуть "none"
                return NextResponse.json({ error: 'No avatar found' }, { status: 404 });
            } else {
                // В "JSON-режиме" просто возвращаем пустую строку
                return NextResponse.json({ avatarUrl: '' });
            }
        }

        // --- Если raw=false (или не указан), отдаем JSON с avatarUrl ---
        if (!raw) {
            return NextResponse.json({
                avatarUrl: storedUrl,
            });
        }

        // --- Ниже логика ПРОКСИРОВАНИЯ ИЗОБРАЖЕНИЯ ---
        // Сценарий 1: avatarUrl — это ссылка на Telegram file_path (например, 'photos/file_9.jpg')
        // Сценарий 2: avatarUrl — это ссылка на локальный файл
        // Сценарий 3: avatarUrl — публичный http/https (тогда можно просто fetch(...) и вернуть)

        // Для примера считаем, что если storedUrl НЕ начинается с http, это "Telegram file_path"
        // Иначе, если это "http(s)://", то это уже публичный URL.

        if (!storedUrl.startsWith('http')) {
            // Предположим, это telegram file_path вида 'photos/file_9.jpg'
            // Формируем URL
            const tgUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${storedUrl}`;
            try {
                const tgResponse = await fetch(tgUrl);
                if (!tgResponse.ok) {
                    return NextResponse.json({ error: 'Telegram fetch error' }, { status: 404 });
                }
                const imageBuffer = await tgResponse.arrayBuffer();

                return new NextResponse(imageBuffer, {
                    status: 200,
                    headers: {
                        // Укажите правильный Content-Type, если знаете формат (image/png, image/jpeg и т.п.)
                        'Content-Type': 'image/jpeg',
                    },
                });
            } catch (err) {
                console.error('Error proxying telegram file:', err);
                return NextResponse.json({ error: 'Error proxying TG file' }, { status: 500 });
            }

        } else {
            // Иначе считаем, что storedUrl — это публичный http(s)
            // Просто fetch'им и пробрасываем контент
            try {
                const externalResp = await fetch(storedUrl);
                if (!externalResp.ok) {
                    return NextResponse.json({ error: 'External image fetch error' }, { status: 404 });
                }
                const imageBuffer = await externalResp.arrayBuffer();

                // Опять же, укажите правильный Content-Type. 
                // Можно выяснить из externalResp.headers.get('content-type')
                return new NextResponse(imageBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': 'image/jpeg',
                    },
                });
            } catch (err) {
                console.error('Error fetching external file:', err);
                return NextResponse.json({ error: 'Error fetching external file' }, { status: 500 });
            }
        }

    } catch (err) {
        console.error('Error in get-avatar route:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
