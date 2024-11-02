import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: "Не указан id"}, { status: 400});
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(userId) },
            select: { referralPercentage: true}
        });

        if (!user) {
            return NextResponse.json({ error: "Пользователь не найден"}, {status: 404})
        }

        console.log("Процент")

        console.log(user.referralPercentage)

        return NextResponse.json({referralPercentage: user.referralPercentage})

      
    } catch(error) {
        console.log(error)
        return NextResponse.json({error: "Не удалось получить информацию о бонусах"}, {status: 500})
    }
}