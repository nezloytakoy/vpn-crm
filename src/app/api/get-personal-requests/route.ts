import { PrismaClient } from "@prisma/client"; 
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 1;
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "Айди не получено" }, { status: 400 });
        }

        const telegramIdBigInt = BigInt(userId);

        // Находим все UserTariff для данного пользователя
        const userTariffs = await prisma.userTariff.findMany({
          where: { userId: telegramIdBigInt },
        });

        if (!userTariffs || userTariffs.length === 0) {
          return NextResponse.json({ error: 'Нет тарифов для пользователя.' }, { status: 404 });
        }

        const now = new Date();
        // Фильтруем активные тарифы по дате истечения
        const activeTariffs = userTariffs.filter(tariff => new Date(tariff.expirationDate) > now);

        if (activeTariffs.length === 0) {
          return NextResponse.json({ error: 'У пользователя нет активных тарифов.' }, { status: 404 });
        }

        // Суммируем оставшиеся запросы ассистента и ИИ
        const totalAssistantRequests = activeTariffs.reduce(
          (sum, tariff) => sum + tariff.remainingAssistantRequests,
          0
        );
        const totalAIRequests = activeTariffs.reduce(
          (sum, tariff) => sum + tariff.remainingAIRequests,
          0
        );

        return NextResponse.json({
          assistantRequests: totalAssistantRequests,
          aiRequests: totalAIRequests
        });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Не удалось получить запросы" }, { status: 500 });
    }
}
