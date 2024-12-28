import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');

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

        // Если нет avatarUrl, вернём пустую строку или заглушку
        return NextResponse.json({
            avatarUrl: user.avatarUrl || '',
        });
    } catch (err) {
        console.error('Error fetching avatar:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
