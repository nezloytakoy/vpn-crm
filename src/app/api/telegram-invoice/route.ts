import { Bot } from "grammy";

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

    // Преобразуем priceInDollars в целое число для amount
    const starsAmount = Math.round(priceInDollars * 1);

    if (starsAmount <= 0) {
      await sendLogToTelegram(`Некорректная цена: ${starsAmount}`);
      return new Response(JSON.stringify({ message: "Некорректная цена" }), { status: 400 });
    }

    const title = "Оплата через Звезды Telegram";
    const description = "Оплата за товар через звезды Telegram.";
    const payload = JSON.stringify({ userId, tariffName });
    const currency = "XTR";
    const prices = [{ amount: starsAmount, label: "Оплата через звезды" }];

    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "", // provider_token пока пустой
      currency,
      prices
    );

    await sendLogToTelegram(`Invoice created for user: ${userId} with tariff: ${tariffName}`);

    return new Response(JSON.stringify({ invoiceLink }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Ошибка создания инвойса:", errorMessage);
    await sendLogToTelegram(`Error creating invoice: ${errorMessage}`);

    return new Response(JSON.stringify({ message: "Ошибка создания инвойса" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
