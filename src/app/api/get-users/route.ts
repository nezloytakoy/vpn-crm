import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
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
            }
        });

        
        const serializedUsers = usersData.map(user => ({
            telegramId: user.telegramId.toString(),
            username: user.username,
            referralCount: user.referralCount,
            subscriptionType: user.lastPaidSubscription?.name || "FREE",
            assistantRequests: user.lastPaidSubscription?.assistantRequestCount || 0,
            hasUpdatedSubscription: user.hasUpdatedSubscription,
        }));

        return NextResponse.json(serializedUsers);

    } catch (error) {
        console.error('Ошибка получения данных пользователей:', error);
        return NextResponse.json({ error: 'Не удалось получить данные' }, { status: 500 });
    }
}
