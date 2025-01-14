import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Vercel может кэшировать, если нужно:
export const revalidate = 1;

const prisma = new PrismaClient();


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userIdStr = searchParams.get("userId");
        if (!userIdStr) {
            return NextResponse.json(
                { error: "Missing 'userId' query parameter" },
                {
                    status: 400,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        // Преобразуем userId в BigInt или Number (зависит от того, как вы храните)
        const userId = BigInt(userIdStr);

        // Находим последнюю запись (ORDER BY createdAt DESC)
        // где expirationDate > now() => тариф ещё не истёк
        const now = new Date();
        const activeTariff = await prisma.userTariff.findFirst({
            where: {
                userId: userId,
                expirationDate: {
                    gt: now, // время не вышло => тариф ещё активен
                },
            },
            orderBy: {
                createdAt: "desc", // «самая свежая» запись
            },
        });

        if (!activeTariff) {
            // Нет активных тарифов
            return NextResponse.json(
                {
                    error: "No active tariff found for this user",
                    remainingHours: 0,
                },
                {
                    status: 404,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                    }
                }
            );
        }

        // Вычисляем, сколько осталось до конца тарифа (в часах)
        const msLeft = activeTariff.expirationDate.getTime() - now.getTime();
        const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));

        return NextResponse.json(
            {
                userId: userIdStr,
                tariffId: activeTariff.tariffId,
                remainingHours: hoursLeft,
                expirationDate: activeTariff.expirationDate,
            },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error) {
        console.error("[user-tariff] Error getting user tariff:", error);
        return NextResponse.json(
            { error: String(error) },
            {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
}
