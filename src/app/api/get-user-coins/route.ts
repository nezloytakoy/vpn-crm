import { PrismaClient } from "@prisma/client";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const telegramId = url.searchParams.get('telegramId')

        if (!telegramId) {
            return NextResponse.json(
                { error: "Не удалось получить телеграм айди пользователя" },
                { status: 400 }
            );
        }


        const telegramIdBigInt = BigInt(telegramId)

        const user = await prisma.user.findUnique({
            where: { telegramId: telegramIdBigInt },
            select: { coins: true },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Не удалось найти пользователя" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            coins: user.coins
        });
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { error: "Произошла ошибка" },
            { status: 500 }
        )
    }
}