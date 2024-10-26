import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {
    try {
        const usersData = await prisma.user.findMany({
            select: {
                telegramId: true,
                username: true,
                referralCount: true,
                subscriptionType: true,
                assistantRequests: true,
                hasUpdatedSubscription: true
            }
        });

        
        const serializedUsers = usersData.map(user => ({
            telegramId: user.telegramId.toString(),
            username: user.username,
            referralCount: user.referralCount, 
            subscriptionType: user.subscriptionType,
            assistantRequests: user.assistantRequests, 
            hasUpdatedSubscription: user.hasUpdatedSubscription,
        }));

        return NextResponse.json(serializedUsers);

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Не удалось получить данные' }, { status: 500 });
    }
}
