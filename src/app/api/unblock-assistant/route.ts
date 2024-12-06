import { NextResponse } from "next/server"; 
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { telegramId } = await request.json();

    if (!telegramId) {
      return NextResponse.json({ error: "telegramId не передан" }, { status: 400 });
    }

    const parsedTelegramId = BigInt(telegramId);

    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: parsedTelegramId },
    });

    if (!assistant) {
      return NextResponse.json({ error: "Ассистент не найден" }, { status: 404 });
    }

    await prisma.assistant.update({
      where: { telegramId: parsedTelegramId },
      data: {
        isBlocked: false,
        unblockDate: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // Так как error теперь unknown, перед выводом можно проверить является ли она экземпляром Error
    if (error instanceof Error) {
      console.error("Ошибка при разблокировке ассистента:", error.message);
    } else {
      console.error("Неизвестная ошибка при разблокировке ассистента:", error);
    }

    return NextResponse.json(
      { error: "Не удалось разблокировать ассистента" },
      { status: 500 }
    );
  }
}
