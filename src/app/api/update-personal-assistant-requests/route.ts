import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request for adjusting assistant requests...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, assistantRequests } = body;

        if (!userId || typeof assistantRequests !== 'number' || assistantRequests < 0) {
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
                createdAt: 'asc' // Сортируем по дате создания, чтобы "старые" записи были первыми
            }
        });

        const now = new Date();
        // Фильтруем только активные тарифы (если ваша логика такова)
        const activeTariffs = userTariffs.filter(t => new Date(t.expirationDate) > now);

        // Считаем текущее количество доступных запросов
        const currentAssistantRequests = activeTariffs.reduce(
            (sum, t) => sum + t.remainingAssistantRequests,
            0
        );

        console.log(`Current assistant requests: ${currentAssistantRequests}`);
        console.log(`Desired assistant requests: ${assistantRequests}`);

        if (assistantRequests === currentAssistantRequests) {
            // Ничего менять не нужно
            console.log('No changes required');
            return NextResponse.json({
                message: 'No changes required',
                assistantRequests: currentAssistantRequests
            });
        } else if (assistantRequests > currentAssistantRequests) {
            // Нужно добавить запросы
            const diff = assistantRequests - currentAssistantRequests;
            console.log(`Need to add ${diff} requests`);

            const neverDate = new Date('9999-12-31T23:59:59.999Z');

            // Создаём новый тариф без срока действия с нужным количеством запросов
            const newTariff = await prisma.userTariff.create({
                data: {
                    userId: userIdBigInt,
                    tariffId: null,
                    totalAssistantRequests: diff,
                    totalAIRequests: 0,
                    remainingAssistantRequests: diff,
                    remainingAIRequests: 0,
                    expirationDate: neverDate,
                }
            });

            console.log('Added new requests via new UserTariff:', newTariff);

            return NextResponse.json({
                message: 'Requests increased successfully',
                assistantRequests: assistantRequests
            });
        } else {
            // assistantRequests < currentAssistantRequests
            // Нужно убрать часть запросов со старых тарифов
            let diff = currentAssistantRequests - assistantRequests;
            console.log(`Need to remove ${diff} requests`);

            // Проходим по активным тарифам с начала (самые старые) и вычитаем запросы
            for (const tariff of activeTariffs) {
                if (diff <= 0) break;
                
                const removeAmount = Math.min(diff, tariff.remainingAssistantRequests);

                if (removeAmount > 0) {
                    // Обновляем тариф, уменьшив remainingAssistantRequests
                    await prisma.userTariff.update({
                        where: { id: tariff.id },
                        data: {
                            remainingAssistantRequests: tariff.remainingAssistantRequests - removeAmount
                        }
                    });

                    diff -= removeAmount;
                }
            }

            // Если по каким-то причинам diff > 0 остался, значит не хватило запросов для списания
            // Но теоретически этого не должно случиться, если логика верна
            if (diff > 0) {
                console.error('Not enough requests to remove. This should not happen if logic is correct.');
                return NextResponse.json({
                    error: 'Not enough requests to remove',
                }, { status: 500 });
            }

            console.log('Requests decreased successfully');

            return NextResponse.json({
                message: 'Requests decreased successfully',
                assistantRequests: assistantRequests
            });
        }
    } catch (error) {
        console.error('Error adjusting assistant requests:', error);
        return NextResponse.json({ error: 'Failed to adjust assistant requests' }, { status: 500 });
    }
}
