import { Bot } from "grammy";

const bot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);

export async function POST(request: Request) {
  try {
    const { priceInDollars } = await request.json(); // Получаем цену в долларах из тела запроса

    // Рассчитываем количество звёзд
    // const starsAmount = priceInDollars * 42;

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

    return new Response(JSON.stringify({ invoiceLink }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ошибка создания инвойса:", error);
    return new Response(JSON.stringify({ message: "Ошибка создания инвойса" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
