import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTranslation } from '../admin-bot/localization';
const prisma = new PrismaClient();

// Функция для отправки сообщения пользователю
async function sendMessageToUser(telegramId: bigint, text: string) {
  const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!userBotToken) {
    throw new Error("No TELEGRAM_USER_BOT_TOKEN found");
  }

  const apiUrl = `https://api.telegram.org/bot${userBotToken}/sendMessage`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId.toString(),
      text,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    console.error("Ошибка при отправке сообщения в Telegram:", errorDetails);
    throw new Error(`Ошибка при отправке сообщения: ${errorDetails.description || 'Unknown'}`);
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting POST request for adjusting assistant requests...');
    const body = await request.json();
    console.log('Received body:', body);
    const { userId, assistantRequests } = body;

    if (!userId || typeof assistantRequests !== 'number' || assistantRequests < 0) {
      console.log('Validation failed: Invalid input data');
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const userIdBigInt = BigInt(userId);

    // 1) Находим пользователя (получаем язык)
    const userRecord = await prisma.user.findUnique({
      where: { telegramId: userIdBigInt },
      select: { language: true },
    });
    if (!userRecord) {
      console.log("User not found in DB");
      // Если хотите можно возвращать ошибку или просто игнорировать
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Определяем язык пользователя (fallback = "en")
    let userLang: "en" | "ru" = "en";
    if (userRecord.language === "ru") {
      userLang = "ru";
    }

    // 2) Получаем все тарифы пользователя
    const userTariffs = await prisma.userTariff.findMany({
      where: {
        userId: userIdBigInt,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const now = new Date();
    // Фильтруем только активные тарифы
    const activeTariffs = userTariffs.filter(t => new Date(t.expirationDate) > now);

    // Считаем текущее количество доступных запросов
    const currentAssistantRequests = activeTariffs.reduce(
      (sum, t) => sum + t.remainingAssistantRequests,
      0
    );

    console.log(`Current assistant requests: ${currentAssistantRequests}`);
    console.log(`Desired assistant requests: ${assistantRequests}`);

    if (assistantRequests === currentAssistantRequests) {
      // Ничего не меняем
      console.log('No changes required');
      return NextResponse.json({
        message: 'No changes required',
        assistantRequests: currentAssistantRequests
      });
    } else if (assistantRequests > currentAssistantRequests) {
      // Нужно добавить запросы
      const diff = assistantRequests - currentAssistantRequests;
      console.log(`Need to add ${diff} requests`);

      const neverDate = new Date('9999-12-31T23:59:59.999Z');

      // Создаём новый "тариф" без срока действия с нужным количеством запросов
      const newTariff = await prisma.userTariff.create({
        data: {
          userId: userIdBigInt,
          tariffId: null,
          totalAssistantRequests: diff,
          totalAIRequests: 0,
          remainingAssistantRequests: diff,
          remainingAIRequests: 0,
          expirationDate: neverDate,
        }
      });

      console.log('Added new requests via new UserTariff:', newTariff);

      // Отправляем локализованное сообщение о том, что запросы увеличены
      // Предположим, в translations есть ключ: "requests_increased" => "Вам выданы запросы" / "Requests increased"
      const increasedMessage = getTranslation(userLang, "requests_increased");
      await sendMessageToUser(userIdBigInt, increasedMessage);

      return NextResponse.json({
        message: 'Requests increased successfully',
        assistantRequests: assistantRequests
      });
    } else {
      // assistantRequests < currentAssistantRequests
      // Нужно убрать часть запросов со старых тарифов
      let diff = currentAssistantRequests - assistantRequests;
      console.log(`Need to remove ${diff} requests`);

      for (const tariff of activeTariffs) {
        if (diff <= 0) break;
        const removeAmount = Math.min(diff, tariff.remainingAssistantRequests);

        if (removeAmount > 0) {
          await prisma.userTariff.update({
            where: { id: tariff.id },
            data: {
              remainingAssistantRequests: tariff.remainingAssistantRequests - removeAmount
            }
          });
          diff -= removeAmount;
        }
      }

      if (diff > 0) {
        console.error('Not enough requests to remove. This should not happen if logic is correct.');
        return NextResponse.json({
          error: 'Not enough requests to remove',
        }, { status: 500 });
      }

      console.log('Requests decreased successfully');

      // Отправляем локализованное сообщение о том, что запросы уменьшены
      // Предположим, в translations есть ключ: "requests_decreased" => "У вас уменьшились запросы" / "Requests decreased"
      const decreasedMessage = getTranslation(userLang, "requests_decreased");
      await sendMessageToUser(userIdBigInt, decreasedMessage);

      return NextResponse.json({
        message: 'Requests decreased successfully',
        assistantRequests: assistantRequests
      });
    }
  } catch (error) {
    console.error('Error adjusting assistant requests:', error);
    return NextResponse.json({ error: 'Failed to adjust assistant requests' }, { status: 500 });
  }
}
