import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { telegramId } = await request.json();

    if (!telegramId) {
      return NextResponse.json({ error: "telegramId не передан" }, { status: 400 });
    }

    // Преобразуем telegramId в число (BigInt), если он приходит строкой
    const parsedTelegramId = BigInt(telegramId);

    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: parsedTelegramId },
    });

    if (!assistant) {
      return NextResponse.json({ error: "Ассистент не найден" }, { status: 404 });
    }

    // Обновляем данные ассистента: снятие блокировки и очистка поля unblockDate
    await prisma.assistant.update({
      where: { telegramId: parsedTelegramId },
      data: {
        isBlocked: false,
        unblockDate: null, // Ставим null для поля unblockDate
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ошибка при разблокировке ассистента:", error);
    return NextResponse.json(
      { error: "Не удалось разблокировать ассистента" },
      { status: 500 }
    );
  }
}
