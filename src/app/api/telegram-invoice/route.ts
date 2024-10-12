import { Bot } from "grammy";
import { PrismaClient, SubscriptionType } from "@prisma/client";

const prisma = new PrismaClient();
const bot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);

const TELEGRAM_LOG_USER_ID = 5829159515;

const sendLogToTelegram = async (message: string) => {
  try {
    await bot.api.sendMessage(TELEGRAM_LOG_USER_ID, message);
  } catch (error) {
    console.error("Ошибка отправки сообщения в Telegram:", error);
  }
};

export async function POST(request: Request) {
  try {
    const { userId, priceInDollars, tariffName } = await request.json();

    await sendLogToTelegram(`Received tariffName: ${tariffName}, price: ${priceInDollars}`);

    const cleanTariffName = tariffName.replace(/ - \d+\$$/, '').toLowerCase();

    const starsAmount = priceInDollars * 42;

    const title = "Оплата через Звезды Telegram";
    const description = "Оплата за товар через звезды Telegram.";
    const payload = "{}";
    const currency = "XTR";
    const prices = [{ amount: starsAmount, label: "Оплата через звезды" }];

    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "", 
      currency,
      prices
    );

    await sendLogToTelegram(`Cleaned tariffName for comparison: ${cleanTariffName}`);

    let subscriptionType: SubscriptionType;
    let assistantRequestsIncrement = 0;
    let aiRequestsIncrement = 0;

    switch (cleanTariffName) {
      case "ai + 5 запросов ассистенту":
      case "ai + 5 assistant requests":
        subscriptionType = SubscriptionType.FIRST;
        assistantRequestsIncrement = 5;
        aiRequestsIncrement = 10;
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
        aiRequestsIncrement = 100;
        break;
      default:
        await sendLogToTelegram(`Invalid tariff name: ${cleanTariffName}`);
        throw new Error(`Invalid tariff name: ${cleanTariffName}`);
    }

    const updatedUser = await prisma.user.update({
      where: {
        telegramId: BigInt(userId),
      },
      data: {
        subscriptionType,
        hasUpdatedSubscription: true,
        aiRequests: { increment: aiRequestsIncrement },
        assistantRequests: { increment: assistantRequestsIncrement },
        updatedAt: new Date(),
      },
    });

    const sanitizedUser = {
      ...updatedUser,
      telegramId: updatedUser.telegramId.toString(),
    };

    await sendLogToTelegram(`User ${userId} updated with subscription: ${subscriptionType}`);

    return new Response(JSON.stringify({ invoiceLink, updatedUser: sanitizedUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Ошибка создания инвойса или обновления подписки:", errorMessage);
    await sendLogToTelegram(`Error processing invoice or subscription: ${errorMessage}`);
    
    return new Response(JSON.stringify({ message: "Ошибка создания инвойса или обновления подписки" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
