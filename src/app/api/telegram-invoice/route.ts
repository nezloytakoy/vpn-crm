import { Bot } from "grammy";
import { PrismaClient, SubscriptionType } from "@prisma/client"; // Импортируем Prisma и перечисление SubscriptionType

const prisma = new PrismaClient();
const bot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);

const TELEGRAM_LOG_USER_ID = 5829159515; // ID пользователя, которому отправляем логи

// Функция для отправки логов в Telegram
const sendLogToTelegram = async (message: string) => {
  try {
    await bot.api.sendMessage(TELEGRAM_LOG_USER_ID, message);
  } catch (error) {
    console.error("Ошибка отправки сообщения в Telegram:", error);
  }
};

export async function POST(request: Request) {
  try {
    const { userId, priceInDollars, tariffName } = await request.json(); // Получаем данные из тела запроса

    // Логируем полученные данные
    await sendLogToTelegram(`Received tariffName: ${tariffName}, price: ${priceInDollars}`);

    // Обрезаем цену в конце строки тарифа
    const cleanTariffName = tariffName.replace(/ - \d+\$$/, '').toLowerCase(); // Обрезаем цену и приводим к нижнему регистру

    // Рассчитываем количество звёзд (1 доллар = 42 звезды)
    const starsAmount = priceInDollars * 1;

    const title = "Оплата через Звезды Telegram";
    const description = "Оплата за товар через звезды Telegram.";
    const payload = "{}";
    const currency = "XTR"; // Валюта для звёзд Telegram
    const prices = [{ amount: starsAmount, label: "Оплата через звезды" }];

    // Создаём ссылку на инвойс
    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "", // Здесь должен быть ваш токен провайдера платежей
      currency,
      prices
    );

    // Логируем очищенное название тарифа
    await sendLogToTelegram(`Cleaned tariffName for comparison: ${cleanTariffName}`);

    // Определяем тип подписки и количество запросов на основе названия тарифа
    let subscriptionType: SubscriptionType;
    let assistantRequestsIncrement = 0;
    let aiRequestsIncrement = 0;

    switch (cleanTariffName) {
      case "ai + 5 запросов ассистенту":
      case "ai + 5 assistant requests":
        subscriptionType = SubscriptionType.FIRST;
        assistantRequestsIncrement = 5; // Увеличиваем на 5 для ассистента
        aiRequestsIncrement = 10; // Увеличиваем на 10 для AI
        break;
      case "ai + 14 запросов ассистенту":
      case "ai + 14 assistant requests":
        subscriptionType = SubscriptionType.SECOND;
        assistantRequestsIncrement = 14;
        aiRequestsIncrement = 28;
        break;
      case "ai + 30 запросов ассистенту":
      case "ai + 30 assistant requests":
        subscriptionType = SubscriptionType.THIRD;
        assistantRequestsIncrement = 30;
        aiRequestsIncrement = 60;
        break;
      case "только ai":
      case "only ai":
        subscriptionType = SubscriptionType.FOURTH;
        aiRequestsIncrement = 100; // Только AI, добавляем 100 запросов AI
        break;
      default:
        await sendLogToTelegram(`Invalid tariff name: ${cleanTariffName}`);
        throw new Error(`Invalid tariff name: ${cleanTariffName}`);
    }

    // Обновляем информацию о пользователе в базе данных
    const updatedUser = await prisma.user.update({
      where: {
        telegramId: BigInt(userId), // Ищем пользователя по Telegram ID
      },
      data: {
        subscriptionType, // Обновляем тип подписки
        hasUpdatedSubscription: true, // Указываем, что подписка была обновлена
        aiRequests: { increment: aiRequestsIncrement }, // Увеличиваем количество AI запросов
        assistantRequests: { increment: assistantRequestsIncrement }, // Увеличиваем количество запросов к ассистенту
        updatedAt: new Date(), // Обновляем поле updatedAt
      },
    });

    // Преобразуем BigInt в строку, чтобы избежать ошибки сериализации
    const sanitizedUser = {
      ...updatedUser,
      telegramId: updatedUser.telegramId.toString(), // Преобразуем BigInt в строку
    };

    // Логируем успешное обновление
    await sendLogToTelegram(`User ${userId} updated with subscription: ${subscriptionType}`);

    return new Response(JSON.stringify({ invoiceLink, updatedUser: sanitizedUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Приводим ошибку к типу Error и логируем
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Ошибка создания инвойса или обновления подписки:", errorMessage);
    await sendLogToTelegram(`Error processing invoice or subscription: ${errorMessage}`);
    
    return new Response(JSON.stringify({ message: "Ошибка создания инвойса или обновления подписки" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

