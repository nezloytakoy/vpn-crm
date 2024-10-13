import { NextResponse } from 'next/server';
import { PrismaClient, ArbitrationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Ищем все арбитражи со статусом PENDING
    const pendingArbitrations = await prisma.arbitration.findMany({
      where: {
        status: 'PENDING' as ArbitrationStatus,
      },
      include: {
        moderator: true,
      },
    });

    if (pendingArbitrations.length === 0) {
      return NextResponse.json({ message: 'Нет арбитражей со статусом PENDING' }, { status: 200 });
    }

    // Обрабатываем каждый арбитраж
    for (const arbitration of pendingArbitrations) {
      const ignoredModerators = arbitration.ignoredModerators || [];

      // Ищем модератора, который не был проигнорирован
      const newModerator = await prisma.moderator.findFirst({
        where: {
          id: {
            notIn: ignoredModerators, // Исключаем проигнорированных модераторов
          },
        },
        orderBy: {
          lastActiveAt: 'desc', // Находим самого активного недавно
        },
      });

      if (newModerator) {
        // Уведомляем модератора
        await notifyModerator(newModerator.id, arbitration.id);

        // Обновляем арбитраж, добавляем нового модератора и список проигнорированных
        await prisma.arbitration.update({
          where: { id: arbitration.id },
          data: {
            moderatorId: newModerator.id,
            ignoredModerators: {
              push: newModerator.id, // Добавляем текущего модератора в список проигнорированных
            },
          },
        });

        console.log(`Модератор ${newModerator.id} уведомлен для арбитража ${arbitration.id}`);
      } else {
        console.log(`Не удалось найти доступного модератора для арбитража ${arbitration.id}`);
      }
    }

    return NextResponse.json({ message: 'Проверка завершена' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Неизвестная ошибка' }, { status: 500 });
  }
}

// Функция уведомления модератора
async function notifyModerator(moderatorId: bigint, arbitrationId: bigint) {
  try {
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
