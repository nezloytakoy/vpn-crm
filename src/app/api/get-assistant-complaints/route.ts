import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const assistantId = url.searchParams.get('assistantId');

    if (!assistantId) {
        return NextResponse.json({ error: "Не было получено айди ассистента" }, { status: 400 });
    }

    try {
        const assistantBigInt = BigInt(assistantId);

        // Получаем жалобы на ассистента ТОЛЬКО со статусом PENDING
        const complaints = await prisma.complaint.findMany({
            where: {
                assistantId: assistantBigInt,
                status: "PENDING",
            },
            select: {
                id: true,
                userId: true,
                status: true,
                decision: true,
                moderatorId: true,
            },
        });

        // Извлекаем уникальные userId из жалоб
        const userIds = Array.from(new Set(complaints.map((complaint) => complaint.userId.toString())));

        // Получаем пользователей с соответствующими userId
        const users = await prisma.user.findMany({
            where: { telegramId: { in: userIds.map((id) => BigInt(id)) } },
            select: {
                telegramId: true,
                username: true,
            },
        });

        // Создаём мапу для быстрого поиска username по userId
        const userMap = new Map(users.map((user) => [user.telegramId.toString(), user.username]));

        // Сопоставляем username с каждой жалобой и преобразуем BigInt поля в строки
        const complaintsWithUsernames = complaints.map((complaint) => ({
            ...complaint,
            id: complaint.id.toString(),
            userId: complaint.userId.toString(),
            moderatorId: complaint.moderatorId ? complaint.moderatorId.toString() : null,
            username: userMap.get(complaint.userId.toString()) || null, // Добавляем username
        }));

        // Возвращаем объединённый результат
        return NextResponse.json(complaintsWithUsernames);
    } catch (error) {
        console.error("Ошибка при получении жалоб:", error);
        return NextResponse.json({ error: "Не удалось получить жалобы на ассистента" }, { status: 500 });
    }
}
