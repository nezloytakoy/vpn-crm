import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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
                    headers: { "Access-Control-Allow-Origin": "*" },
                }
            );
        }

        // Если userId в базе 100% умещается в 53-битный диапазон, можно parseInt:
        const userIdNum = parseInt(userIdStr, 10);
        if (Number.isNaN(userIdNum)) {
            return NextResponse.json(
                { error: "Invalid userId (not a number)" },
                { status: 400 }
            );
        }

        const now = new Date();

        // Ищем ВСЕ активные тарифы, у которых expirationDate > now
        const allActiveTariffs = await prisma.userTariff.findMany({
            where: {
                userId: BigInt(userIdNum), // или userId: userIdNum, если в модели userId = Int
                expirationDate: {
                    gt: now,
                },
            },
            // Можно сразу отсортировать, чтобы первый был с наибольшим expirationDate
            orderBy: {
                expirationDate: "desc",
            },
        });

        if (allActiveTariffs.length === 0) {
            return NextResponse.json(
                {
                    error: "No active tariff found for this user",
                    remainingHours: 0,
                },
                {
                    status: 404,
                    headers: { "Access-Control-Allow-Origin": "*" },
                }
            );
        }

        // Первый элемент массива — тот, у которого expirationDate самая поздняя,
        // значит осталось больше всего часов.
        const bestTariff = allActiveTariffs[0];

        // Считаем, сколько осталось
        const msLeft = bestTariff.expirationDate.getTime() - now.getTime();
        const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));

        // Преобразуем поля BigInt в строку (или число), чтобы избежать ошибки сериализации
        const userIdString = typeof bestTariff.userId === "bigint"
            ? bestTariff.userId.toString()
            : String(bestTariff.userId);

        const tariffIdString = bestTariff.tariffId
            ? (typeof bestTariff.tariffId === "bigint"
                ? bestTariff.tariffId.toString()
                : String(bestTariff.tariffId))
            : null;

        return NextResponse.json(
            {
                userId: userIdString,
                tariffId: tariffIdString,
                remainingHours: hoursLeft,
                expirationDate: bestTariff.expirationDate, // Date можно сериализовать (ISO)
            },
            {
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
            }
        );
    } catch (error) {
        console.error("[user-tariff] Error getting user tariff:", error);
        return NextResponse.json(
            { error: String(error) },
            {
                status: 500,
                headers: { "Access-Control-Allow-Origin": "*" },
            }
        );
    }
}
