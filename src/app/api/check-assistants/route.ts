import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();


async function findAvailableAssistant(ignoredAssistants: bigint[]) {
    console.log(`=== Начало поиска доступного ассистента ===`);
    console.log(`Игнорируемые ассистенты: ${ignoredAssistants.map((id) => id.toString())}`);

    try {
        const availableAssistant = await prisma.assistant.findFirst({
            where: {
                isWorking: true,
                isBlocked: false,
                telegramId: {
                    notIn: ignoredAssistants,
                },
            },
            orderBy: {
                lastActiveAt: 'desc',
            },
        });

        if (availableAssistant) {
            console.log(`✅ Найден доступный ассистент: ${JSON.stringify(availableAssistant, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )}`);
        } else {
            console.log(`❌ Нет доступных ассистентов, подходящих под критерии.`);
        }

        return availableAssistant;
    } catch (error) {
        console.error(`❌ Ошибка при поиске доступного ассистента:`, error);
        throw error;
    }
}

async function addIgnoreAction(assistantId: bigint, requestId: bigint) {
    await prisma.requestAction.create({
        data: {
            assistantId: assistantId,
            requestId: requestId,
            action: 'IGNORED',
        },
    });
}


async function countIgnoredActionsInLast24Hours(assistantId: bigint) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const ignoredCount = await prisma.requestAction.count({
        where: {
            assistantId: assistantId,
            action: 'IGNORED',
            createdAt: {
                gte: oneDayAgo,
            },
        },
    });

    return ignoredCount;
}


export async function POST() {
    try {
        const pendingRequests = await prisma.assistantRequest.findMany({
            where: {
                status: 'PENDING',
            },
        });

        if (pendingRequests.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending requests found.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        for (const request of pendingRequests) {
            let ignoredAssistants = request.ignoredAssistants || [];

            if (request.assistantId) {
                await addIgnoreAction(BigInt(request.assistantId), request.id);

                
                const ignoredCount = await countIgnoredActionsInLast24Hours(BigInt(request.assistantId));
                const maxIgnores = await prisma.edges.findFirst({ select: { maxIgnores: true } });

                if (ignoredCount >= (maxIgnores?.maxIgnores || 0)) {
                    await prisma.assistant.update({
                        where: { telegramId: BigInt(request.assistantId) },
                        data: {
                            isBlocked: true,
                            unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000), 
                        },
                    });
                    console.log(`Assistant ID ${request.assistantId} заблокирован за превышение лимита игнорирований.`);
                }
            }

            let selectedAssistant = await findAvailableAssistant(ignoredAssistants);

            if (!selectedAssistant) {
                ignoredAssistants = [];
                selectedAssistant = await findAvailableAssistant(ignoredAssistants);

                if (!selectedAssistant) {
                    console.log(`No available assistants for request ID: ${request.id}`);
                    continue;
                }
            }

            await prisma.assistantRequest.update({
                where: { id: request.id },
                data: {
                    assistantId: selectedAssistant.telegramId,
                    ignoredAssistants: request.assistantId ? {
                        push: request.assistantId,
                    } : undefined,
                },
            });

            await sendTelegramMessageWithButtons(
                selectedAssistant.telegramId.toString(),
                `Новый запрос от пользователя`,
                [
                    { text: 'Принять', callback_data: `accept_${request.id}` },
                    { text: 'Отклонить', callback_data: `reject_${request.id}` },
                ]
            );
        }

        return new Response(JSON.stringify({ message: 'Processed all pending requests.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Ошибка при обработке запросов:', error);
        return new Response(JSON.stringify({ error: 'Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
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

type TelegramButton = {
    text: string;
    callback_data: string;
};
