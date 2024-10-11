import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {

    try {
        const usersData = await prisma.user.findMany({
            select: {
                username: true,
                referralCount: true,
                subscriptionType: true,
                assistantRequests: true,
                hasUpdatedSubscription: true
            }

        })

        const serializedUsers = (await usersData).map(user => ({
            username: user.username,
            referralCount: user.referralCount.toString(),
            subscriptionType: user.subscriptionType,
            assistantRequests: user.assistantRequests.toString(),
            hasUpdatedSubscription: user.hasUpdatedSubscription,
        }))

        return NextResponse.json(serializedUsers);

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Не удалось получить данные' }, { status: 500 });
    }
}