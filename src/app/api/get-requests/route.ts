import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');

        if (!telegramId) {
            console.log('Telegram ID не указан.');
            return NextResponse.json(
                { error: 'Telegram ID не указан.' },
                { status: 400 }
            );
        }

        const telegramIdBigInt = BigInt(telegramId);
        console.log(`Searching for user with Telegram ID: ${telegramId}`);

        const user = await prisma.user.findUnique({
            where: {
                telegramId: telegramIdBigInt,
            },
            select: {
                assistantRequests: true,
                aiRequests: true,
            },
        });

        if (!user) {
            console.log(`User with Telegram ID ${telegramId} not found.`);
            return NextResponse.json(
                { error: 'Пользователь не найден.' },
                { status: 404 }
            );
        }

        console.log(`User data found: ${JSON.stringify(user)}`);
        return NextResponse.json({
            assistantRequests: user.assistantRequests,
            aiRequests: user.aiRequests,
        });
    } catch (error) {
        console.error('Ошибка при получении запросов:', error);
        return NextResponse.json(
            { error: 'Ошибка при получении данных.' },
            { status: 500 }
        );
    }
}
