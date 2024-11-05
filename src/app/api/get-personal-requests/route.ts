import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: "Айди не получено" }, { status: 400 })
        }

        const requests = await prisma.user.findUnique({
            where: { telegramId: BigInt(userId) },
            select: {
                aiRequests: true,
                assistantRequests: true

            }
        })

        return NextResponse.json({ requests });
        
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Не удалось получить запросы" }, { status: 500 })
    }
}