import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log("Received POST request");

        const { message } = await request.json();
        console.log("Parsed request JSON:", { message });

        if (!message) {
            console.log("Validation failed: Message missing");
            return NextResponse.json({ error: 'Не указано сообщение.' }, { status: 400 });
        }

        console.log("Querying assistants who are not blocked");
        const assistants = await prisma.assistant.findMany({
            where: {
                isBlocked: false,
            },
            select: {
                telegramId: true,
            },
        });
        console.log("Assistants found:", assistants);

        for (const assistant of assistants) {
            console.log(`Processing assistant with Telegram ID: ${assistant.telegramId}`);
            if (assistant.telegramId) {
                console.log(`Sending message to Telegram ID: ${assistant.telegramId}`);
                await sendMessageToAssistant(assistant.telegramId.toString(), message);
                console.log(`Message sent to Telegram ID: ${assistant.telegramId}`);
            } else {
                console.log("Assistant has no Telegram ID, skipping");
            }
        }

        console.log("All messages sent successfully");
        return NextResponse.json({ message: 'Сообщения успешно отправлены' });
    } catch (error) {
        console.error('Ошибка при отправке сообщений ассистентам:', error);
        return NextResponse.json(
            { error: 'Не удалось отправить сообщения ассистентам.' },
            { status: 500 }
        );
    }
}

// Helper function to send a message to an assistant
async function sendMessageToAssistant(telegramId: string, message: string) {
    console.log(`Preparing to send message to Telegram ID: ${telegramId}`);
    const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    if (!botToken) {
        throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN not configured');
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    console.log(`Telegram API URL: ${url}`);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramId, text: message }),
    });

    console.log(`Telegram API response for ID ${telegramId}:`, response.status);
    if (!response.ok) {
        console.error(`Failed to send message to ${telegramId}:`, await response.text());
    } else {
        console.log(`Message successfully sent to ${telegramId}`);
    }
}
