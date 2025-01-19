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
    // Читаем из тела запроса
    // { userId, priceInDollars, tariffName, months }
    const { userId, priceInDollars, tariffName, months } = await request.json();

    await sendLogToTelegram(
      `Received tariffName: ${tariffName}, price: ${priceInDollars}, months: ${months}`
    );

    // Преобразуем priceInDollars в целое число
    const starsAmount = Math.ceil(priceInDollars * 1);
    if (starsAmount <= 0) {
      await sendLogToTelegram(`Некорректная цена: ${starsAmount}`);
      return new Response(JSON.stringify({ message: "Некорректная цена" }), {
        status: 400,
      });
    }

    // Формируем title/description, где можно упомянуть количество месяцев
    const title = `Оплата (${months} мес) через Звезды Telegram`;
    const description = `Оплата за тариф: ${tariffName}, на срок: ${months} месяцев.`;

    // Сохраняем все нужные поля (userId, tariffName, months) в payload,
    // чтобы потом в "successful_payment" это считать
    const payload = JSON.stringify({ userId, tariffName, months });

    // Устанавливаем валюту и массив цен
    const currency = "XTR";
    const prices = [
      {
        amount: starsAmount,
        label: `${tariffName || "NoName"} (${months}m)`, // Можно дополнительно указать в label
      },
    ];

    // Параметр provider_token временно пустой
    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "",  // provider_token
      currency,
      prices
    );

    await sendLogToTelegram(
      `Invoice created for user: ${userId}, tariff: ${tariffName}, months: ${months}`
    );

    return new Response(JSON.stringify({ invoiceLink }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Ошибка создания инвойса:", errorMessage);
    await sendLogToTelegram(`Error creating invoice: ${errorMessage}`);

    return new Response(JSON.stringify({ message: "Ошибка создания инвойса" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
