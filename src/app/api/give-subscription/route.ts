import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTranslation } from '../admin-bot/localization';
import { TranslationKey } from '../admin-bot/localization';


// Функция для отправки Telegram сообщений (user bot)
async function sendMessageToUser(telegramId: bigint, text: string) {
    const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    if (!userBotToken) {
        throw new Error('No TELEGRAM_USER_BOT_TOKEN found');
    }

    const apiUrl = `https://api.telegram.org/bot${userBotToken}/sendMessage`;
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: telegramId.toString(),
            text,
        }),
    });
    if (!response.ok) {
        const errDetails = await response.json().catch(() => ({}));
        throw new Error(`Ошибка при отправке сообщения пользователю: ${errDetails.description || 'Unknown'}`);
    }
}

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request for updating user requests based on subscription...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, subscriptionId } = body;

        if (!userId || !subscriptionId) {
            console.log('Validation failed: Missing userId or subscriptionId');
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        console.log('Validation passed, fetching subscription details...');

        const subscription = await prisma.subscription.findUnique({
            where: { id: BigInt(subscriptionId) },
            select: {
                aiRequestCount: true,
                assistantRequestCount: true,
            },
        });

        if (!subscription) {
            console.log('Subscription not found');
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        console.log('Subscription found:', subscription);

        // 1) Ищем пользователя, чтобы узнать его язык
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(userId) },
            select: { language: true },
        });
        if (!user) {
            console.log('User not found');
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Определяем язык пользователя, fallback "en"
        let userLang: 'ru' | 'en' = 'en';
        if (user.language === 'ru') {
            userLang = 'ru';
        }

        const subIdNum = Number(subscriptionId);

        let subKey: TranslationKey; // вместо string

        if (subIdNum === 1) subKey = "subscription_basic";
        else if (subIdNum === 2) subKey = "subscription_advanced";
        else subKey = "subscription_expert";

        // Получаем перевод названия подписки
        const subName = getTranslation(userLang, subKey);

        // Обновляем данные пользователя (увеличиваем количество запросов)
        const updatedUser = await prisma.user.update({
            where: { telegramId: BigInt(userId) },
            data: {
                aiRequests: {
                    increment: subscription.aiRequestCount,
                },
                assistantRequests: {
                    increment: subscription.assistantRequestCount ?? 0,
                },
                lastPaidSubscriptionId: BigInt(subscriptionId),
            },
        });

        console.log('User updated successfully:', updatedUser);

        // Дата окончания тарифа - через 30 дней
        const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Создаём запись в UserTariff
        const userTariff = await prisma.userTariff.create({
            data: {
                userId: BigInt(userId),
                tariffId: BigInt(subscriptionId),
                totalAssistantRequests: subscription.assistantRequestCount ?? 0,
                totalAIRequests: subscription.aiRequestCount ?? 0,
                remainingAssistantRequests: subscription.assistantRequestCount ?? 0,
                remainingAIRequests: subscription.aiRequestCount ?? 0,
                expirationDate: expirationDate,
            },
        });

        console.log('UserTariff created successfully:', userTariff);

        // 3) Отправляем локализованное сообщение пользователю
        //    Используем ключ "subscription_granted" = "Вам выдана подписка: %subName%"
        let msgTemplate = getTranslation(userLang, "subscription_granted");
        msgTemplate = msgTemplate.replace("%subName%", subName);

        await sendMessageToUser(BigInt(userId), msgTemplate);

        const responseUser = {
            ...updatedUser,
            telegramId: updatedUser.telegramId.toString(),
            lastPaidSubscriptionId: updatedUser.lastPaidSubscriptionId?.toString() || null,
        };

        return NextResponse.json({
            message: 'User requests updated based on subscription successfully',
            updatedUser: responseUser,
            userTariff: {
                ...userTariff,
                id: userTariff.id.toString(),
                userId: userTariff.userId.toString(),
                tariffId: userTariff.tariffId?.toString() || null,
            },
        });

    } catch (error) {
        console.error('Error updating user requests based on subscription:', error);
        return NextResponse.json({ error: 'Failed to update user requests' }, { status: 500 });
    }
}
