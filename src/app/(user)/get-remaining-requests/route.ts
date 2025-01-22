import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { userId } = body || {};

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    let userIdBigInt: bigint;
    try {
      userIdBigInt = BigInt(userId);
    } catch {
      return NextResponse.json(
        { error: "Invalid userId format (not a BigInt)" },
        { status: 400 }
      );
    }

    // 1) Ищем «последний» тариф, где tariffId != null,
    //    сортируем по createdAt убыванию (берем первую запись).
    const lastSubscription = await prisma.userTariff.findFirst({
      where: {
        userId: userIdBigInt,
        tariffId: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc", // или { id: "desc" }
      },
      include: {
        tariff: true, // если нужно видеть данные из Subscription
      },
    });

    // 2) Ищем все записи, где tariffId == null — это «дополнительные запросы»
    const extraList = await prisma.userTariff.findMany({
      where: {
        userId: userIdBigInt,
        tariffId: null,
      },
    });

    // 3) Суммируем remainingAssistantRequests (и, при необходимости, remainingAIRequests)
    let sumExtraAssistantRequests = 0;
    let sumExtraAIRequests = 0;

    extraList.forEach((r) => {
      sumExtraAssistantRequests += r.remainingAssistantRequests;
      sumExtraAIRequests += r.remainingAIRequests;
    });

    // Формируем ответ
    return NextResponse.json(
      {
        lastSubscriptionTariff: lastSubscription, // может быть null, если не нашли
        sumExtraAssistantRequests,
        sumExtraAIRequests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in user-tariff-last route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
