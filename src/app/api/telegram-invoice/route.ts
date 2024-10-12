import { Bot } from "grammy";
import { PrismaClient, SubscriptionType } from "@prisma/client"; // Импортируем Prisma и перечисление SubscriptionType

const prisma = new PrismaClient();
const bot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);

export async function POST(request: Request) {
  try {
    const { userId, priceInDollars, tariffName } = await request.json(); // Получаем данные из тела запроса

    // Рассчитываем количество звёзд (1 доллар = 42 звезды)
    const starsAmount = priceInDollars * 42;

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

    // Теперь обрабатываем выдачу привилегий после успешной оплаты
    // Определяем тип подписки и количество запросов на основе названия тарифа
    let subscriptionType: SubscriptionType;
    let assistantRequestsIncrement = 0;
    let aiRequestsIncrement = 0;

    switch (tariffName) {
      case "AI + 5 запросов ассистенту":
      case "AI + 5 assistant requests":
        subscriptionType = SubscriptionType.FIRST;
        assistantRequestsIncrement = 5; // Увеличиваем на 5 для ассистента
        aiRequestsIncrement = 10; // Увеличиваем на 10 для AI
        break;
      case "AI + 14 запросов ассистенту":
      case "AI + 14 assistant requests":
        subscriptionType = SubscriptionType.SECOND;
        assistantRequestsIncrement = 14;
        aiRequestsIncrement = 28;
        break;
      case "AI + 30 запросов ассистенту":
      case "AI + 30 assistant requests":
        subscriptionType = SubscriptionType.THIRD;
        assistantRequestsIncrement = 30;
        aiRequestsIncrement = 60;
        break;
      case "Только AI":
      case "Only AI":
        subscriptionType = SubscriptionType.FOURTH;
        aiRequestsIncrement = 100; // Только AI, добавляем 100 запросов AI
        break;
      default:
        throw new Error("Invalid tariff name");
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

    return new Response(JSON.stringify({ invoiceLink, updatedUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ошибка создания инвойса или обновления подписки:", error);
    return new Response(JSON.stringify({ message: "Ошибка создания инвойса или обновления подписки" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
