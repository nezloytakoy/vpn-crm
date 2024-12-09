import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request for AI requests update...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, aiRequests } = body;

        // Validate only the required fields
        if (!userId || typeof aiRequests !== 'number' || aiRequests < 0) {
            console.log('Validation failed: Invalid input data');
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        console.log('Validation passed, creating UserTariff entry for AI requests...');

        // Дата "никогда" - очень дальний срок
        const neverDate = new Date('9999-12-31T23:59:59.999Z');

        // Создаем новую запись в UserTariff для дополнительных ИИ-запросов
        const userTariff = await prisma.userTariff.create({
            data: {
                userId: BigInt(userId),
                tariffId: null, // без тарифа (дополнительные запросы)
                totalAssistantRequests: 0,
                totalAIRequests: aiRequests,
                remainingAssistantRequests: 0,
                remainingAIRequests: aiRequests,
                expirationDate: neverDate,
            },
        });

        console.log('UserTariff created successfully:', userTariff);

        const responseUserTariff = {
            ...userTariff,
            id: userTariff.id.toString(),
            userId: userTariff.userId.toString(),
            tariffId: userTariff.tariffId ? userTariff.tariffId.toString() : null,
            expirationDate: userTariff.expirationDate.toISOString(),
        };

        console.log('Prepared response userTariff object:', responseUserTariff);

        return NextResponse.json({
            message: 'AI requests updated successfully',
            userTariff: responseUserTariff,
        });
    } catch (error) {
        console.error('Error updating AI requests:', error);
        return NextResponse.json({ error: 'Failed to update AI requests' }, { status: 500 });
    }
}
