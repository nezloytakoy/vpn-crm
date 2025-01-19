import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Для Node.js < 18, если нужно, подключите 'node-fetch'
// import fetch from 'node-fetch';

const prisma = new PrismaClient();

export const revalidate = 1;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const moderatorIdParam = searchParams.get('moderatorId');

    console.log('Fetching binary avatar for moderator with ID:', moderatorIdParam);

    // 1) Проверяем, что есть moderatorId
    if (!moderatorIdParam) {
        return NextResponse.json({ error: 'No moderatorId provided' }, { status: 400 });
    }

    try {
        // 2) Ищем запись в таблице Moderator, достаём avatarData
        const moderator = await prisma.moderator.findUnique({
            where: { id: BigInt(moderatorIdParam) }, // Если у вас тип поля - BigInt
            select: { avatarData: true },
        });

        if (!moderator) {
            // Если не нашли модератора
            return NextResponse.json({ error: 'Moderator not found' }, { status: 404 });
        }

        // 3) Если avatarData нет, возвращаем "no avatar"
        if (!moderator.avatarData) {
            console.log('Moderator has no avatar => returning no avatar (200 OK)');
            return NextResponse.json({ error: 'no avatar' }, { status: 200 });
        }

        console.log('Returning avatar from DB for moderator...');

        // 4) Возвращаем «сырое» изображение из базы
        //    Предполагаем, что это JPEG. Если вы храните MIME-тип, используйте его вместо 'image/jpeg'
        return new Response(moderator.avatarData, {
            headers: {
                'Content-Type': 'image/jpeg',
                // Укажите кэширование по желанию:
                'Cache-Control': 'public, max-age=86400',
            },
        });

    } catch (error) {
        console.error('Ошибка при получении аватарки (moderator):', error);
        // Аналогично, возвращаем JSON при ошибке
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 200 });
    }
}
