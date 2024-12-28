import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const BOT_TOKEN = process.env.BOT_TOKEN || "";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');
        const raw = searchParams.get('raw') === 'true';

        if (!telegramId) {
            return NextResponse.json({ error: 'No telegramId' }, { status: 400 });
        }

        // Ищем пользователя
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
            select: { avatarUrl: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Ссылка, которая хранится в базе
        const storedUrl = user.avatarUrl || "";
        if (!storedUrl) {
            // Нет никакой ссылки
            if (raw) {
                // При raw=true хотим вернуть бинарник, но его нет => 404
                return NextResponse.json({ error: 'No avatar found' }, { status: 404 });
            } else {
                // При raw=false отдадим JSON с пустой строкой
                return NextResponse.json({ avatarUrl: '' });
            }
        }

        // Если raw=false => отдаём JSON
        if (!raw) {
            return NextResponse.json({ avatarUrl: storedUrl });
        }

        // =========== Режим "raw=true", проксируем изображение ===========
        // Логика:
        // 1) Если storedUrl начинается с "http", считаем, что это полная публичная ссылка 
        //    (либо уже включает "api.telegram.org/file/bot<token>", либо вовсе другой CDN).
        // 2) Иначе, если НЕ начинается с "http", 
        //    значит это "file_path" от Telegram, типа "photos/file_123.jpg",
        //    тогда формируем URL: "https://api.telegram.org/file/bot<BOT_TOKEN>/{storedUrl}"

        let fileUrl: string;
        if (storedUrl.startsWith('http')) {
            // Полная ссылка (публичная или уже содержит токен)
            fileUrl = storedUrl;
        } else {
            // Только file_path
            fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${storedUrl}`;
        }

        // Пытаемся получить изображение
        try {
            const resp = await fetch(fileUrl);
            if (!resp.ok) {
                return NextResponse.json({ error: 'Image fetch error' }, { status: 404 });
            }

            // Считываем бинарный контент
            const imageBuffer = await resp.arrayBuffer();

            // Можно определить content-type:
            // const contentType = resp.headers.get('content-type') || 'image/jpeg';
            // Но, если точно знаем, что jpg, можно жестко прописать 'image/jpeg'.

            return new NextResponse(imageBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'image/jpeg',
                },
            });
        } catch (err) {
            console.error('Error proxying image:', err);
            return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
        }

    } catch (err) {
        console.error('Error in get-avatar route:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
