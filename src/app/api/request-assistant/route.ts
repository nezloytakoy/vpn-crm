import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: 'userId is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Преобразуем userId из строки в BigInt
        const userIdBigInt = BigInt(userId);

        // Отправляем лог с userIdBigInt в Telegram пользователю с ID 5829159515
        await sendLogToTelegram(`userIdBigInt перед созданием AssistantRequest: ${userIdBigInt}`);

        // Проверяем, существует ли пользователь с данным userId
        const userExists = await prisma.user.findUnique({
            where: { telegramId: userIdBigInt },
        });

        if (!userExists) {
            return new Response(JSON.stringify({ error: 'Пользователь не найден.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Отправляем сообщение пользователю
        await sendTelegramMessageToUser(userIdBigInt.toString(), 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.');

        // Ищем доступных ассистентов
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
            return new Response(JSON.stringify({ message: 'Нет доступных ассистентов' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const selectedAssistant = availableAssistants[0];

        // Обновляем состояние ассистента
        await prisma.assistant.update({
            where: { telegramId: selectedAssistant.telegramId },
            data: { isBusy: true },
        });

        // Создаем запрос ассистента
        const assistantRequest = await prisma.assistantRequest.create({
            data: {
                userId: userIdBigInt,  // Используем BigInt для userId
                assistantId: BigInt(selectedAssistant.telegramId),  // Преобразуем id ассистента в BigInt
                message: 'Запрос пользователя на разговор',
                status: 'PENDING',
                isActive: false,
            },
        });

        // Отправляем сообщение ассистенту с кнопками
        await sendTelegramMessageWithButtons(
            selectedAssistant.telegramId.toString(),  // Преобразуем telegramId в строку для отправки в Telegram API
            'Поступил запрос от пользователя',
            [
                { text: 'Принять', callback_data: `accept_${assistantRequest.id}` },
                { text: 'Отклонить', callback_data: `reject_${assistantRequest.id}` },
            ]
        );

        return new Response(JSON.stringify({ message: 'Запрос отправлен ассистенту.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Ошибка:', error);
        return new Response(JSON.stringify({ error: 'Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Функция отправки сообщения пользователю через Telegram
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

// Функция отправки сообщения ассистенту с кнопками через Telegram
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

// Функция отправки логов в Telegram пользователю с ID 5829159515
async function sendLogToTelegram(message: string) {
    const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    const chatId = '5829159515'; // ID пользователя, которому будут отправлены логи
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
