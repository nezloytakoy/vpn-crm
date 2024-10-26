import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Получаем всех пользователей с необходимыми полями
        const usersData = await prisma.user.findMany({
            select: {
                telegramId: true,
                username: true,
                referralCount: true,
                subscriptionType: true,
                hasUpdatedSubscription: true,
                usedAIRequests: true, // Получаем количество использованных AI запросов
            }
        });

        // Для каждого пользователя считаем количество связанных запросов в AssistantRequest и добавляем к ним usedAIRequests
        const serializedUsers = await Promise.all(usersData.map(async user => {
            // Считаем количество связанных AssistantRequest запросов
            const assistantRequestCount = await prisma.assistantRequest.count({
                where: { userId: user.telegramId }
            });

            // Общее количество запросов = количество запросов к ассистенту + использованные AI запросы
            const totalRequestsCount = assistantRequestCount + user.usedAIRequests;

            return {
                telegramId: user.telegramId.toString(),
                username: user.username,
                referralCount: user.referralCount,
                subscriptionType: user.subscriptionType,
                assistantRequests: totalRequestsCount, // Общее количество запросов
                hasUpdatedSubscription: user.hasUpdatedSubscription,
            };
        }));

        return NextResponse.json(serializedUsers);

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Не удалось получить данные' }, { status: 500 });
    }
}
