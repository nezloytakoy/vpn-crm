import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const translations = {
    en: {
        userIdRequired: 'UserId is required',
        userNotFound: 'User not found',
        activeRequestExists: 'You already have an active request with an assistant.',
        requestReceived: 'Your request has been received. Please wait while an assistant contacts you.',
        noAssistantsAvailable: 'No assistants available',
        requestSent: 'The request has been sent to the assistant.',
        serverError: 'Server Error',
        assistantRequestMessage: 'User request for conversation',
        accept: 'Accept',
        reject: 'Reject',
        logMessage: 'userIdBigInt before creating AssistantRequest',
    },
    ru: {
        userIdRequired: 'Требуется UserId',
        userNotFound: 'Пользователь не найден',
        activeRequestExists: 'У вас уже есть активный запрос с ассистентом.',
        requestReceived: 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.',
        noAssistantsAvailable: 'Нет доступных ассистентов',
        requestSent: 'Запрос отправлен ассистенту.',
        serverError: 'Ошибка сервера',
        assistantRequestMessage: 'Запрос пользователя на разговор',
        accept: 'Принять',
        reject: 'Отклонить',
        logMessage: 'userIdBigInt перед созданием AssistantRequest',
    }
};

function getTranslation(lang: "en" | "ru", key: keyof typeof translations["en"]) {
    return translations[lang][key] || translations["en"][key];
}

function detectLanguage(): "en" | "ru" {
    return "en"; // Определение языка пользователя
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

        await sendLogToTelegram(getTranslation(lang, 'logMessage'));

        const userExists = await prisma.user.findUnique({
            where: { telegramId: userIdBigInt },
        });

        if (!userExists) {
            return new Response(JSON.stringify({ error: getTranslation(lang, 'userNotFound') }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Проверка на наличие активного запроса
        const activeRequest = await prisma.assistantRequest.findFirst({
            where: {
                userId: userIdBigInt,
                isActive: true, // Проверяем активный статус запроса
            },
        });

        if (activeRequest) {
            return new Response(JSON.stringify({ message: getTranslation(lang, 'activeRequestExists') }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await sendTelegramMessageToUser(userIdBigInt.toString(), getTranslation(lang, 'requestReceived'));

        const availableAssistants = await prisma.assistant.findMany({
            where: {
                isWorking: true,
                isBusy: false,
            },
            orderBy: {
                startedAt: 'asc',
            },
        });

        if (availableAssistants.length === 0) {
            return new Response(JSON.stringify({ message: getTranslation(lang, 'noAssistantsAvailable') }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const selectedAssistant = availableAssistants[0];

        await prisma.assistant.update({
            where: { telegramId: selectedAssistant.telegramId },
            data: { isBusy: true },
        });

        const assistantRequest = await prisma.assistantRequest.create({
            data: {
                userId: userIdBigInt,
                assistantId: selectedAssistant.telegramId,
                message: getTranslation(lang, 'assistantRequestMessage'),
                status: 'PENDING',
                isActive: true,
            },
        });

        await sendTelegramMessageWithButtons(
            selectedAssistant.telegramId.toString(),
            getTranslation(lang, 'assistantRequestMessage'),
            [
                { text: getTranslation(lang, 'accept'), callback_data: `accept_${assistantRequest.id}` },
                { text: getTranslation(lang, 'reject'), callback_data: `reject_${assistantRequest.id}` },
            ]
        );

        return new Response(JSON.stringify({ message: getTranslation(lang, 'requestSent') }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Ошибка:', error);
        return new Response(JSON.stringify({ error: getTranslation(detectLanguage(), 'serverError') }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Вспомогательные функции остались без изменений
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
