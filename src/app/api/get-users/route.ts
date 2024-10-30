import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Retrieve users and calculate the count of assistant requests for each user
        const usersData = await prisma.user.findMany({
            select: {
                telegramId: true,
                username: true,
                referralCount: true,
                lastPaidSubscription: {
                    select: {
                        name: true,
                        assistantRequestCount: true
                    }
                },
                hasUpdatedSubscription: true,
                // Get the count of assistant requests associated with each user
                _count: {
                    select: {
                        requests: true, // Count the related AssistantRequest records
                    },
                },
            },
        });

        // Serialize users data, including the count of assistant requests for each user
        const serializedUsers = usersData.map(user => ({
            telegramId: user.telegramId.toString(),
            username: user.username,
            referralCount: user.referralCount,
            subscriptionType: user.lastPaidSubscription?.name || "FREE",
            assistantRequests: user._count.requests || 0, // Use the count from AssistantRequest
            hasUpdatedSubscription: user.hasUpdatedSubscription,
        }));

        console.log(serializedUsers)

        return NextResponse.json(serializedUsers);

    } catch (error) {
        console.error('Ошибка получения данных пользователей:', error);
        return NextResponse.json({ error: 'Не удалось получить данные' }, { status: 500 });
    }
}
