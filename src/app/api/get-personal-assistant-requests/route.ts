import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        console.log('Starting GET request for user requests...');
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            console.log('Validation failed: userId not provided');
            return NextResponse.json({ error: 'userId not provided' }, { status: 400 });
        }

        const userIdBigInt = BigInt(userId);
        console.log(`Fetching userTariffs for userId: ${userId}`);

        // Получаем все тарифы пользователя
        const userTariffs = await prisma.userTariff.findMany({
            where: {
                userId: userIdBigInt,
            },
        });

        if (userTariffs.length === 0) {
            console.log('No tariffs found for user');
            return NextResponse.json({ error: 'No tariffs found for user' }, { status: 404 });
        }

        const now = new Date();
        // Фильтруем только активные тарифы
        const activeTariffs = userTariffs.filter(tariff => new Date(tariff.expirationDate) > now);

        if (activeTariffs.length === 0) {
            console.log('No active tariffs found for user');
            return NextResponse.json({ error: 'No active tariffs found for user' }, { status: 404 });
        }

        // Суммируем оставшиеся запросы ассистента и ИИ
        const totalAssistantRequests = activeTariffs.reduce((sum, t) => sum + t.remainingAssistantRequests, 0);
        const totalAIRequests = activeTariffs.reduce((sum, t) => sum + t.remainingAIRequests, 0);

        console.log(`Assistant requests: ${totalAssistantRequests}, AI requests: ${totalAIRequests}`);

        return NextResponse.json({
            assistantRequests: totalAssistantRequests,
            aiRequests: totalAIRequests,
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}
