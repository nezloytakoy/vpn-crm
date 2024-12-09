import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request for AI requests update...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, aiRequests } = body;

        // Проверяем входные данные
        if (!userId || typeof aiRequests !== 'number' || aiRequests < 0) {
            console.log('Validation failed: Invalid input data');
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        const userIdBigInt = BigInt(userId);

        // Получаем все тарифы пользователя
        const userTariffs = await prisma.userTariff.findMany({
            where: {
                userId: userIdBigInt,
            },
            orderBy: {
                createdAt: 'asc' // самые старые записи первыми
            }
        });

        const now = new Date();
        const activeTariffs = userTariffs.filter(t => new Date(t.expirationDate) > now);

        // Считаем текущее количество ИИ-запросов
        const currentAIRequests = activeTariffs.reduce((sum, t) => sum + t.remainingAIRequests, 0);

        console.log(`Current AI requests: ${currentAIRequests}`);
        console.log(`Desired AI requests: ${aiRequests}`);

        if (aiRequests === currentAIRequests) {
            // Ничего делать не нужно
            console.log('No changes required');
            return NextResponse.json({
                message: 'No changes required',
                aiRequests: currentAIRequests
            });
        } else if (aiRequests > currentAIRequests) {
            // Нужно добавить запросы
            const diff = aiRequests - currentAIRequests;
            console.log(`Need to add ${diff} AI requests`);

            const neverDate = new Date('9999-12-31T23:59:59.999Z');

            // Создаем новый тариф для добавления разницы
            const newTariff = await prisma.userTariff.create({
                data: {
                    userId: userIdBigInt,
                    tariffId: null,
                    totalAssistantRequests: 0,
                    totalAIRequests: diff,
                    remainingAssistantRequests: 0,
                    remainingAIRequests: diff,
                    expirationDate: neverDate,
                }
            });

            console.log('Added new AI requests via new UserTariff:', newTariff);

            return NextResponse.json({
                message: 'AI requests increased successfully',
                aiRequests: aiRequests
            });
        } else {
            // aiRequests < currentAIRequests
            // Нужно уменьшить количество запросов
            let diff = currentAIRequests - aiRequests;
            console.log(`Need to remove ${diff} AI requests`);

            for (const tariff of activeTariffs) {
                if (diff <= 0) break;

                const removeAmount = Math.min(diff, tariff.remainingAIRequests);

                if (removeAmount > 0) {
                    await prisma.userTariff.update({
                        where: { id: tariff.id },
                        data: {
                            remainingAIRequests: tariff.remainingAIRequests - removeAmount
                        }
                    });

                    diff -= removeAmount;
                }
            }

            if (diff > 0) {
                console.error('Not enough AI requests to remove. This should not happen if logic is correct.');
                return NextResponse.json({
                    error: 'Not enough AI requests to remove',
                }, { status: 500 });
            }

            console.log('AI requests decreased successfully');

            return NextResponse.json({
                message: 'AI requests decreased successfully',
                aiRequests: aiRequests
            });
        }
    } catch (error) {
        console.error('Error updating AI requests:', error);
        return NextResponse.json({ error: 'Failed to update AI requests' }, { status: 500 });
    }
}
