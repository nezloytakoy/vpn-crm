import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { arbitrationId } = await req.json();

    // Логика обработки модератора
    const arbitration = await prisma.arbitration.findUnique({
      where: { id: BigInt(arbitrationId) },
    });

    if (!arbitration) {
      return NextResponse.json({ error: 'Арбитраж не найден' }, { status: 404 });
    }

    // Ищем модератора, который не является текущим и не был проигнорирован (если это указано)
    const newModerator = await prisma.moderator.findFirst({
      where: {
        ...(arbitration.moderatorId ? {
          id: {
            not: arbitration.moderatorId, // Исключаем текущего модератора, если он назначен
          },
        } : {}),
        id: {
          notIn: arbitration.ignoredModerators || [], // Исключаем модераторов, которые уже проигнорировали арбитраж
        },
      },
      orderBy: {
        lastActiveAt: 'desc', // Последний активный модератор
      },
    });

    if (!newModerator) {
      return NextResponse.json({ error: 'Нет доступных модераторов' }, { status: 404 });
    }

    // Обновляем арбитраж, добавляем нового модератора и отмечаем игнорировавших
    await prisma.arbitration.update({
      where: { id: arbitration.id },
      data: {
        moderatorId: newModerator.id,
        ignoredModerators: {
          push: arbitration.moderatorId || BigInt(0), // Добавляем текущего модератора в список проигнорировавших
        },
      },
    });

    // Уведомляем нового модератора
    await notifyModerator(newModerator.id, arbitration.id);

    return NextResponse.json({ success: true, moderatorId: newModerator.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Неизвестная ошибка' }, { status: 500 });
  }
}

async function notifyModerator(moderatorId: bigint, arbitrationId: bigint) {
  try {
    // Отправляем уведомление модератору
    await sendTelegramMessageToModerator(
      moderatorId.toString(),
      `Вы назначены на арбитраж с ID: ${arbitrationId}. Пожалуйста, рассмотрите его.`
    );
    
    console.log(`Модератор ${moderatorId} уведомлен о арбитраже ${arbitrationId}.`);
  } catch (error) {
    console.error(`Ошибка при уведомлении модератора ${moderatorId} для арбитража ${arbitrationId}:`, error instanceof Error ? error.message : String(error));
  }
}

// Пример функции для отправки сообщения в Telegram
async function sendTelegramMessageToModerator(moderatorId: string, message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не установлен');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: moderatorId,
        text: message,
      }),
    });
  } catch (error) {
    console.error(`Ошибка при отправке сообщения модератору ${moderatorId}:`, error instanceof Error ? error.message : String(error));
  }
}
