import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

function bigIntToString<T>(obj: T): T {
    return JSON.parse(
        JSON.stringify(obj, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    ) as T;
}

export async function GET() {
    try {
        const blockedUsers = await prisma.assistant.findMany({
            where: { isBlocked: true }
        });

        // Преобразуем BigInt поля в строки
        const processedBlockedUsers = bigIntToString(blockedUsers);

        console.log(processedBlockedUsers)

        return NextResponse.json(processedBlockedUsers);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Не удалось получить заблокированных ассистентов" },
            { status: 500 }
        );
    }
}
