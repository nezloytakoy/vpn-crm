import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export const revalidate = 1;

export const dynamic = 'force-dynamic'; // Указываем, что рендеринг должен быть динамическим

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');

        if (!telegramId) {
            return NextResponse.json(
                { error: 'Пользователь не передался роуту' },
                { status: 400 }
            );
        }

        const telegramIdBigInt = BigInt(telegramId);

        // Получить из базы количество рефералов пользователя
        const user = await prisma.user.findUnique({
            where: {
                telegramId: telegramIdBigInt,
            },
            select: {
                referralCount: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Пользователь не найден' },
                { status: 404 }
            );
        }

        // Вернуть число рефералов
        return NextResponse.json({
            referralCount: user.referralCount,
        });

    } catch (error) {
        console.log('Ошибка при получении запросов:', error);
        return NextResponse.json(
            { error: 'Ошибка получения данных' },
            { status: 500 }
        );
    }
}
