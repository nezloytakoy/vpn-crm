import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log("Received POST request");

        
        const { categories, message } = await request.json();
        console.log("Parsed request JSON:", { categories, message });

        
        if (!categories || categories.length === 0 || !message) {
            console.log("Validation failed: Categories or message missing");
            return NextResponse.json({ error: 'Не указаны категории или сообщение.' }, { status: 400 });
        }

        
        console.log("Querying users with categories:", categories);
        const users = await prisma.user.findMany({
            where: {
                lastPaidSubscription: {
                    name: {
                        in: categories,
                    },
                },
            },
            select: {
                telegramId: true,
            },
        });
        console.log("Users found:", users);

        
        for (const user of users) {
            console.log(`Processing user with Telegram ID: ${user.telegramId}`);
            if (user.telegramId) {
                console.log(`Sending message to Telegram ID: ${user.telegramId}`);
                await sendMessageToUser(user.telegramId.toString(), message);
                console.log(`Message sent to Telegram ID: ${user.telegramId}`);
            } else {
                console.log("User has no Telegram ID, skipping");
            }
        }

        console.log("All messages sent successfully");
        return NextResponse.json({ message: 'Сообщения успешно отправлены' });
    } catch (error) {
        console.error('Ошибка при отправке сообщений пользователям:', error);
        return NextResponse.json(
            { error: 'Не удалось отправить сообщения пользователям.' },
            { status: 500 }
        );
    }
}

// Helper function to send a message to a user
async function sendMessageToUser(telegramId: string, message: string) {
    console.log(`Preparing to send message to Telegram ID: ${telegramId}`);
    const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    if (!botToken) {
        throw new Error('TELEGRAM_USER_BOT_TOKEN not configured');
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
