// conversationHandlers.ts

import { PrismaClient } from '@prisma/client';
import {
    sendTelegramMessageToUser
} from './telegramHelpers';
import { processPendingRequest } from './assistantHelpers';
import { handleAssistantLastMessage, handleUserLastMessage } from './conversationUtils'

const prisma = new PrismaClient();

export async function closeOldAIChats(oneHourAgo: Date) {
    // Закрытие диалогов с ИИ, которые длятся более часа
    const usersWithAIChat = await prisma.user.findMany({
        where: {
            isActiveAIChat: true,
            lastAIChatOpenedAt: {
                lt: oneHourAgo,
            },
        },
    });
    console.log(`Найдено пользователей с активным AI-чатом: ${usersWithAIChat.length}`);

    for (const user of usersWithAIChat) {
        console.log(`Завершаем AI-чат для пользователя ${user.telegramId.toString()}`);
        await prisma.user.update({
            where: { telegramId: user.telegramId },
            data: { isActiveAIChat: false },
        });

        await sendTelegramMessageToUser(user.telegramId.toString(), 'Диалог с ИИ окончен.');
        console.log(`Диалог с ИИ для пользователя ${user.telegramId.toString()} завершен.`);
    }
}

export async function closeOldConversations(oneHourAgo: Date) {
    // Закрытие активных разговоров, которые длятся более часа
    const conversations = await prisma.conversation.findMany({
        where: {
            status: 'IN_PROGRESS',
            updatedAt: { lt: oneHourAgo },
        },
        include: { user: true, assistant: true },
    });
    console.log(`Найдено диалогов со статусом 'IN_PROGRESS': ${conversations.length}`);

    console.log(
        'Список диалогов:',
        JSON.stringify(
            conversations,
            (key, value) => (typeof value === 'bigint' ? value.toString() : value),
            2
        )
    );

    for (const conversation of conversations) {
        console.log(`Обработка диалога ID: ${conversation.id.toString()}`);
        if (conversation.lastMessageFrom === 'ASSISTANT') {
            await handleAssistantLastMessage(conversation);
        } else {
            await handleUserLastMessage(conversation);
        }
    }
}


export async function processPendingRequests() {
    // Обработка ожидающих запросов ассистентов
    const pendingRequests = await prisma.assistantRequest.findMany({
        where: {
            status: 'PENDING',
        },
    });
    console.log(`Найдено ожидающих запросов ассистентов: ${pendingRequests.length}`);

    for (const request of pendingRequests) {
        console.log(`Обработка запроса ID: ${request.id.toString()}`);
        await processPendingRequest(request);
    }
}
