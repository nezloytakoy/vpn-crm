import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Пример объекта translations
const translations = {
    en: {
        userIdRequired: 'UserId is required',
        userNotFound: 'User not found',
        requestReceived: 'Your request has been received. Please wait while an assistant contacts you.',
        noAssistantsAvailable: 'No assistants available',
        requestSent: 'The request has been sent to the assistant.',
        notEnoughRequests: 'You do not have enough requests to contact an assistant.',
        serverError: 'Server Error',
        assistantRequestMessage: 'User request for conversation',
        accept: 'Accept',
        reject: 'Reject',
        logMessage: 'userIdBigInt before creating AssistantRequest',
    },
    ru: {
        userIdRequired: 'Требуется UserId',
        userNotFound: 'Пользователь не найден',
        requestReceived: 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.',
        noAssistantsAvailable: 'Нет доступных ассистентов',
        requestSent: 'Запрос отправлен ассистенту.',
        notEnoughRequests: 'У вас недостаточно запросов для общения с ассистентом.',
        serverError: 'Ошибка сервера',
        assistantRequestMessage: 'Запрос пользователя на разговор',
        accept: 'Принять',
        reject: 'Отклонить',
        logMessage: 'userIdBigInt перед созданием AssistantRequest',
    }
};

// Функция получения перевода
function getTranslation(lang: "en" | "ru", key: keyof typeof translations["en"]) {
    return translations[lang][key] || translations["en"][key];
}

// Функция для определения языка пользователя (например, по запросу или другим критериям)
function detectLanguage(): "en" | "ru" {
    // Здесь можно добавить логику определения языка
    return "en";
}

async function getPenaltyPointsForLast24Hours(assistantId: bigint): Promise<number> {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // Преобразуем assistantId в число для совместимости
    const assistantIdNumber = Number(assistantId);

    const actions = await prisma.requestAction.findMany({
        where: {
            assistantId: assistantIdNumber,
            createdAt: {
                gte: yesterday,
            },
        },
    });

    let penaltyPoints = 0;
    for (const action of actions) {
        if (action.action === 'REJECTED') {
            penaltyPoints += 1;
        } else if (action.action === 'IGNORED') {
            penaltyPoints += 3;
        }
    }

    return penaltyPoints;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        const lang = detectLanguage();

        if (!userId) {
            return new Response(JSON.stringify({ error: getTranslation(lang, 'userIdRequired') }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const userIdBigInt = BigInt(userId);
        await sendLogToTelegram(`Проверка пользователя с ID: ${userIdBigInt.toString()}`);

        const userExists = await prisma.user.findUnique({
            where: { telegramId: userIdBigInt },
        });

        if (!userExists) {
            await sendLogToTelegram(`Пользователь с ID ${userIdBigInt.toString()} не найден`);
            return new Response(JSON.stringify({ error: getTranslation(lang, 'userNotFound') }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const existingActiveRequest = await prisma.assistantRequest.findFirst({
            where: { userId: userIdBigInt, isActive: true },
        });

        if (existingActiveRequest) {
            await sendLogToTelegram(`У пользователя ${userIdBigInt.toString()} уже есть активный запрос`);
            await sendTelegramMessageToUser(userIdBigInt.toString(), 'У вас уже есть открытый запрос к ассистенту.');
            return new Response(JSON.stringify({ message: 'У вас уже есть открытый запрос к ассистенту.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (userExists.assistantRequests <= 0) {
            await sendLogToTelegram(`Недостаточно запросов у пользователя ${userIdBigInt.toString()}`);
            return new Response(JSON.stringify({ error: getTranslation(lang, 'notEnoughRequests') }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await prisma.user.update({
            where: { telegramId: userIdBigInt },
            data: { assistantRequests: { decrement: 1 } },
        });

        await sendLogToTelegram(`Запросов у пользователя ${userIdBigInt.toString()} уменьшено на 1`);

        await sendTelegramMessageToUser(userIdBigInt.toString(), getTranslation(lang, 'requestReceived'));

        const assistantRequest = await prisma.assistantRequest.create({
            data: {
                userId: userIdBigInt,
                assistantId: null,
                message: getTranslation(lang, 'assistantRequestMessage'),
                status: 'PENDING',
                isActive: true,
                ignoredAssistants: [],
            },
        });

        await sendLogToTelegram(`Создан запрос к ассистенту для пользователя ${userIdBigInt.toString()}`);

        // Получаем список доступных ассистентов
        const availableAssistants = await prisma.assistant.findMany({
            where: {
                isWorking: true,
                isBusy: false,
                telegramId: { notIn: assistantRequest.ignoredAssistants || [] },
            },
        });

        // Логируем найденных ассистентов
        if (availableAssistants.length === 0) {
            await sendLogToTelegram('Нет доступных ассистентов.');
        } else {
            await sendLogToTelegram(`Найдено ${availableAssistants.length} доступных ассистентов:\n` +
                availableAssistants.map(assistant => `ID: ${assistant.telegramId.toString()}, lastActiveAt: ${assistant.lastActiveAt}`).join('\n'));
        }

        // Подсчитываем штрафные очки для ассистентов
        const assistantsWithPenalties = await Promise.all(
            availableAssistants.map(async (assistant) => {
                const penaltyPoints = await getPenaltyPointsForLast24Hours(assistant.telegramId);
                return { ...assistant, penaltyPoints };
            })
        );

        // Логируем ассистентов с штрафными очками
        await sendLogToTelegram('Ассистенты с подсчитанными штрафными очками:\n' +
            assistantsWithPenalties.map(a => `ID: ${a.telegramId.toString()}, Штрафные очки: ${a.penaltyPoints}, lastActiveAt: ${a.lastActiveAt}`).join('\n'));

        // Сортируем ассистентов по штрафным очкам и времени последней активности
        assistantsWithPenalties.sort((a, b) => {
            if (a.penaltyPoints !== b.penaltyPoints) {
                return a.penaltyPoints - b.penaltyPoints;
            }
            return (b.lastActiveAt ? b.lastActiveAt.getTime() : 0) - (a.lastActiveAt ? a.lastActiveAt.getTime() : 0);
        });

        // Логируем отсортированных ассистентов
        await sendLogToTelegram('Ассистенты после сортировки:\n' +
            assistantsWithPenalties.map(a => `ID: ${a.telegramId.toString()}, Штрафные очки: ${a.penaltyPoints}, lastActiveAt: ${a.lastActiveAt}`).join('\n'));

        if (assistantsWithPenalties.length === 0) {
            await sendLogToTelegram('Нет доступных ассистентов после сортировки.');
            return new Response(JSON.stringify({ message: getTranslation(lang, 'noAssistantsAvailable') }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const selectedAssistant = assistantsWithPenalties[0];

        // Логируем выбранного ассистента
        await sendLogToTelegram(`Выбран ассистент ID: ${selectedAssistant.telegramId.toString()} для пользователя ${userIdBigInt.toString()}`);

        await prisma.assistant.update({
            where: { telegramId: selectedAssistant.telegramId },
            data: { isBusy: true, lastActiveAt: new Date() },
        });

        await prisma.assistantRequest.update({
            where: { id: assistantRequest.id },
            data: { assistantId: selectedAssistant.telegramId },
        });

        await sendLogToTelegram(`Назначен ассистент ${selectedAssistant.telegramId.toString()} для пользователя ${userIdBigInt.toString()}`);

        await sendTelegramMessageWithButtons(
            selectedAssistant.telegramId.toString(),
            getTranslation(lang, 'assistantRequestMessage'),
            [
                { text: getTranslation(lang, 'accept'), callback_data: `accept_${assistantRequest.id.toString()}` },
                { text: getTranslation(lang, 'reject'), callback_data: `reject_${assistantRequest.id.toString()}` },
            ]
        );

        await sendLogToTelegram(`Отправлено сообщение ассистенту ID: ${selectedAssistant.telegramId.toString()} с запросом от пользователя ${userIdBigInt.toString()}`);

        return new Response(JSON.stringify({ message: getTranslation(lang, 'requestSent') }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Ошибка:', error);
        await sendLogToTelegram(`Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);

        return new Response(JSON.stringify({ error: getTranslation(detectLanguage(), 'serverError') }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Обновим и другие вспомогательные функции, чтобы использовать локализацию
async function sendTelegramMessageToUser(chatId: string, text: string) {
    const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text,
        }),
    });
}

async function sendTelegramMessageWithButtons(chatId: string, text: string, buttons: TelegramButton[]) {
    const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_markup: {
                inline_keyboard: buttons.map((button) => [{ text: button.text, callback_data: button.callback_data }]),
            },
        }),
    });
}

async function sendLogToTelegram(message: string) {
    const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    const chatId = '5829159515';
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    });
}

type TelegramButton = {
    text: string;
    callback_data: string;
};
