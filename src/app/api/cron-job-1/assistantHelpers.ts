import { sendTelegramMessageWithButtons } from './telegram'

import { findAvailableAssistant } from './assistant'

import { addIgnoreAction, countIgnoredActionsInLast24Hours } from './request'

import { PrismaClient } from '@prisma/client';

import { getTranslation } from './reminderHandlers';

import axios from 'axios';

const prisma = new PrismaClient();

export async function processPendingRequest(request: {
    id: bigint;
    userId: bigint;
    assistantId: bigint | null;
    message: string;
    status: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    ignoredAssistants: bigint[];
}) {
    console.log(`processPendingRequest: Начало обработки запроса ID: ${request.id.toString()}`);

    // Проверка, назначена ли тема для запроса
    const currentRequest = await prisma.assistantRequest.findUnique({
        where: { id: request.id },
        select: { subject: true },
    });

    if (!currentRequest?.subject) {
        console.log(`Тема для запроса ID: ${request.id.toString()} не назначена. Завершение процесса.`);
        return;
    }

    let ignoredAssistants = request.ignoredAssistants || [];
    console.log(`Игнорируемые ассистенты на старте: ${ignoredAssistants.map((id) => id.toString())}`);

    if (request.assistantId) {
        console.log(`Обработка ассистента ID: ${request.assistantId.toString()} из запроса`);

        try {
            console.log(`Добавление ассистента ID: ${request.assistantId.toString()} в список игнорированных`);
            await addIgnoreAction(request.assistantId, request.id);

            const ignoredCount = await countIgnoredActionsInLast24Hours(request.assistantId);
            console.log(`Ассистент ID: ${request.assistantId.toString()} игнорировал ${ignoredCount} запросов за последние 24 часа`);

            const maxIgnores = await prisma.edges.findFirst({ select: { maxIgnores: true } });
            if (ignoredCount >= (maxIgnores?.maxIgnores || 0)) {
                console.log(`Блокировка ассистента ID: ${request.assistantId.toString()} за превышение лимита`);
                await prisma.assistant.update({
                    where: { telegramId: request.assistantId },
                    data: {
                        isBlocked: true,
                        unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });
                console.log(`Ассистент ID: ${request.assistantId.toString()} успешно заблокирован`);
            }
        } catch (error) {
            console.error(`Ошибка при обработке ассистента ID: ${request.assistantId.toString()}`, error);
        }
    }

    console.log(`Поиск доступного ассистента, игнорируя: ${ignoredAssistants.map((id) => id.toString())}`);
    let selectedAssistant;
    try {
        selectedAssistant = await findAvailableAssistant(ignoredAssistants);
    } catch (error) {
        console.error(`Ошибка при поиске доступного ассистента`, error);
    }

    if (!selectedAssistant) {
        console.log('Нет доступных ассистентов, очистка списка игнорированных');
        ignoredAssistants = [];
        try {
            selectedAssistant = await findAvailableAssistant(ignoredAssistants);
        } catch (error) {
            console.error(`Ошибка при повторном поиске доступного ассистента`, error);
        }

        if (!selectedAssistant) {
            console.log(`Нет доступных ассистентов для запроса ID: ${request.id.toString()}`);
            return;
        }
    }

    console.log(`Отправка темы запроса ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    try {
        await sendTelegramMessage(
            selectedAssistant.telegramId.toString(),
            `Тема запроса: ${currentRequest.subject}`
        );
        console.log(`Тема успешно отправлена ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    } catch (error) {
        console.error(`Ошибка при отправке темы ассистенту ID: ${selectedAssistant.telegramId.toString()}`, error);
    }

    console.log(`Назначение запроса ID: ${request.id.toString()} ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    try {
        await prisma.assistantRequest.update({
            where: { id: request.id },
            data: {
                assistantId: selectedAssistant.telegramId,
                ignoredAssistants: request.assistantId
                    ? {
                        push: request.assistantId,
                    }
                    : undefined,
            },
        });
        console.log(`Запрос ID: ${request.id.toString()} успешно назначен ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    } catch (error) {
        console.error(`Ошибка при назначении запроса ассистенту ID: ${selectedAssistant.telegramId.toString()}`, error);
    }

    console.log(`Отправка уведомления ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    try {
        // 1) Найти ассистента по telegramId
        const assistantRecord = await prisma.assistant.findUnique({
            where: { telegramId: selectedAssistant.telegramId },
            select: { language: true },
        });

        if (!assistantRecord) {
            console.log(`Не найден ассистент с telegramId = ${selectedAssistant.telegramId}`);
            return;
        }

        // 2) Определить язык ассистента с fallback
        let assistantLang: "en" | "ru" = "en";
        if (assistantRecord.language === "ru") {
            assistantLang = "ru";
        }

        // 3) Берём перевод из translations
        //    Предположим, у вас есть ключи:
        //      "new_request_from_user" => "Новый запрос от пользователя" / "New request from user"
        //      "accept" => "Принять" / "Accept"
        //      "reject" => "Отклонить" / "Reject"

        const messageText = getTranslation(assistantLang, "new_request_from_user");

        const acceptText = getTranslation(assistantLang, "accept");
        const rejectText = getTranslation(assistantLang, "reject");

        // 4) Отправляем сообщение ассистенту с двумя кнопками
        await sendTelegramMessageWithButtons(
            selectedAssistant.telegramId.toString(),
            messageText,
            [
                { text: acceptText, callback_data: `accept_${request.id.toString()}` },
                { text: rejectText, callback_data: `reject_${request.id.toString()}` },
            ]
        );

        console.log(`Уведомление успешно отправлено ассистенту ID: ${selectedAssistant.telegramId.toString()}`);
    } catch (error) {
        console.error(`Ошибка при отправке уведомления ассистенту ID: ${selectedAssistant.telegramId.toString()}`, error);
    }

    console.log(`processPendingRequest: Завершение обработки запроса ID: ${request.id.toString()}`);
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const telegramBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN; // Убедитесь, что токен сохранен в переменной окружения
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    try {
        console.log(`Sending message to chat ID: ${chatId}`);
        const response = await axios.post(telegramApiUrl, {
            chat_id: chatId,
            text: text,
        });

        if (response.data.ok) {
            console.log(`Message successfully sent to chat ID: ${chatId}`);
        } else {
            console.error(`Failed to send message: ${response.data}`);
        }
    } catch (error) {
        console.error(`Error sending message to chat ID: ${chatId}`, error);
        throw error;
    }
}