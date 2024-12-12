import {
    getTranslation,
    detectLanguage,
} from './translations';

import {
    sendTelegramMessageToUser,
    sendLogToTelegram,
} from './helpers';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function handleAssistantRequest(userIdBigInt: bigint) {
    try {
        const lang = detectLanguage();
        await sendLogToTelegram(`[Start] Checking user with ID: ${userIdBigInt.toString()}`);

        // EXTRA LOG: Начало проверки пользователя
        await sendLogToTelegram(`[Debug] Starting user existence check...`);

        // Проверяем, существует ли пользователь
        const userExists = await prisma.user.findUnique({
            where: { telegramId: userIdBigInt },
        });

        // EXTRA LOG: Результат поиска пользователя (применяем serializeBigInt)
        await sendLogToTelegram(`[Debug] userExists result: ${JSON.stringify(serializeBigInt(userExists))}`);

        if (!userExists) {
            await sendLogToTelegram(`[Error] User with ID ${userIdBigInt.toString()} not found`);
            return {
                error: getTranslation(lang, 'userNotFound'),
                status: 404,
            };
        }
        await sendLogToTelegram(`[Success] User found: ${JSON.stringify(serializeBigInt(userExists))}`);

        // EXTRA LOG: Проверка на активные запросы
        await sendLogToTelegram(`[Debug] Checking for existing active requests...`);

        // Проверяем, есть ли активные запросы у пользователя
        const existingActiveRequest = await prisma.assistantRequest.findFirst({
            where: { userId: userIdBigInt, isActive: true },
        });

        // EXTRA LOG: Результат поиска активного запроса
        await sendLogToTelegram(`[Debug] existingActiveRequest result: ${JSON.stringify(serializeBigInt(existingActiveRequest))}`);

        if (existingActiveRequest) {
            await sendLogToTelegram(
                `[Info] User ${userIdBigInt.toString()} already has an active request: ${JSON.stringify(serializeBigInt(existingActiveRequest))}`
            );
            await sendTelegramMessageToUser(
                userIdBigInt.toString(),
                getTranslation(lang, 'existingActiveRequest')
            );
            return {
                message: getTranslation(lang, 'existingActiveRequest'),
                status: 200,
            };
        }

        const now = new Date();
        await sendLogToTelegram(`[Info] Current date and time: ${now.toISOString()}`);

        // EXTRA LOG: Подсчет оставшихся запросов
        await sendLogToTelegram(`[Debug] Counting remaining assistant requests...`);

        // Считаем оставшиеся запросы
        const totalRemainingAssistantRequestsResult = await prisma.userTariff.aggregate({
            _sum: {
                remainingAssistantRequests: true,
            },
            where: {
                userId: userIdBigInt,
                expirationDate: {
                    gte: now,
                },
            },
        });

        // EXTRA LOG: Результат агрегации
        await sendLogToTelegram(`[Debug] totalRemainingAssistantRequestsResult: ${JSON.stringify(serializeBigInt(totalRemainingAssistantRequestsResult))}`);

        const totalRemainingAssistantRequests =
            totalRemainingAssistantRequestsResult._sum.remainingAssistantRequests || 0;

        await sendLogToTelegram(
            `[Info] Total remaining assistant requests: ${totalRemainingAssistantRequests}`
        );

        if (totalRemainingAssistantRequests <= 0) {
            await sendLogToTelegram(`[Error] Not enough requests for user ${userIdBigInt.toString()}`);
            return {
                error: getTranslation(lang, 'notEnoughRequests'),
                status: 400,
            };
        }

        // EXTRA LOG: Поиск действующего тарифа
        await sendLogToTelegram(`[Debug] Searching for a valid userTariff with available requests...`);

        // Ищем действующий тариф с оставшимися запросами
        const userTariff = await prisma.userTariff.findFirst({
            where: {
                userId: userIdBigInt,
                remainingAssistantRequests: {
                    gt: 0,
                },
                expirationDate: {
                    gte: now,
                },
            },
            orderBy: {
                expirationDate: 'asc',
            },
        });

        // EXTRA LOG: Результат поиска тарифа
        await sendLogToTelegram(`[Debug] userTariff result: ${JSON.stringify(serializeBigInt(userTariff))}`);

        if (!userTariff) {
            await sendLogToTelegram(
                `[Error] No valid tariffs found for user ${userIdBigInt.toString()}`
            );
            return {
                error: getTranslation(lang, 'notEnoughRequests'),
                status: 400,
            };
        }
        await sendLogToTelegram(
            `[Success] User tariff found: ${JSON.stringify(serializeBigInt(userTariff))}`
        );

        // Уменьшаем количество оставшихся запросов
        await prisma.userTariff.update({
            where: {
                id: userTariff.id,
            },
            data: {
                remainingAssistantRequests: {
                    decrement: 1,
                },
            },
        });

        await sendLogToTelegram(
            `[Info] Decremented requests in tariff ID ${userTariff.id.toString()} for user ${userIdBigInt.toString()} by 1`
        );

        // EXTRA LOG: Создание нового запроса
        await sendLogToTelegram(`[Debug] Creating new assistant request...`);

        // Создаём новый запрос ассистента с пустой темой
        const newRequest = await prisma.assistantRequest.create({
            data: {
                userId: userIdBigInt,
                assistantId: null,
                message: '',
                status: 'PENDING',
                isActive: true,
                ignoredAssistants: [],
                subject: null,
            },
        });

        // EXTRA LOG: Результат создания запроса
        await sendLogToTelegram(`[Debug] newRequest created: ${JSON.stringify(serializeBigInt(newRequest))}`);

        await sendLogToTelegram(
            `[Success] New assistant request created: ${JSON.stringify(serializeBigInt(newRequest))}`
        );

        // EXTRA LOG: Обновление статуса пользователя (ожидание темы)
        await sendLogToTelegram(`[Debug] Updating user status to waiting for subject...`);

        // Обновляем статус пользователя, чтобы ждать ввода темы
        await prisma.user.update({
            where: { telegramId: userIdBigInt },
            data: { isWaitingForSubject: true },
        });

        // EXTRA LOG: Отправка сообщения пользователю
        await sendLogToTelegram(`[Debug] Asking user to provide subject...`);

        // Запрашиваем у пользователя тему
        await sendTelegramMessageToUser(
            userIdBigInt.toString(),
            'Пожалуйста, введите тему вашего запроса:'
        );

        await sendLogToTelegram(
            `[Info] Prompted user ${userIdBigInt.toString()} to enter the subject of the request`
        );

        // EXTRA LOG: Возврат результата
        await sendLogToTelegram(`[End] Successfully initiated request flow for user ${userIdBigInt.toString()}`);

        return {
            message: 'Waiting for user to enter the subject.',
            status: 200,
        };
    } catch (error) {
        console.error('Error:', error);
        await sendLogToTelegram(
            `[Critical Error]: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        return {
            error: getTranslation(detectLanguage(), 'serverError'),
            status: 500,
        };
    }
}


function serializeBigInt(obj: unknown): unknown {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
        );
    }
    return obj;
}
