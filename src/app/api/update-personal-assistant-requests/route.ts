import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request for assistant requests update...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, assistantRequests } = body;

        // Проверяем корректность входных данных
        if (!userId || typeof assistantRequests !== 'number' || assistantRequests < 0) {
            console.log('Validation failed: Invalid input data');
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        console.log('Validation passed, creating UserTariff entry...');

        // Дата "никогда" - очень дальний срок
        const neverDate = new Date('9999-12-31T23:59:59.999Z');

        // Создаём запись в UserTariff
        const userTariff = await prisma.userTariff.create({
            data: {
                userId: BigInt(userId),
                tariffId: null, // без тарифа, просто добавочные запросы
                totalAssistantRequests: assistantRequests,
                totalAIRequests: 0,
                remainingAssistantRequests: assistantRequests,
                remainingAIRequests: 0,
                expirationDate: neverDate,
            },
        });

        console.log('UserTariff created successfully:', userTariff);

        // Конвертируем BigInt поля в строки для ответа
        const responseUserTariff = {
            ...userTariff,
            id: userTariff.id.toString(),
            userId: userTariff.userId.toString(),
            tariffId: userTariff.tariffId ? userTariff.tariffId.toString() : null,
            expirationDate: userTariff.expirationDate.toISOString(),
        };

        console.log('Prepared response userTariff object:', responseUserTariff);

        return NextResponse.json({
            message: 'Assistant requests updated successfully',
            userTariff: responseUserTariff,
        });
    } catch (error) {
        console.error('Error updating assistant requests:', error);
        return NextResponse.json({ error: 'Failed to update assistant requests' }, { status: 500 });
    }
}
