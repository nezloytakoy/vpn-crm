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
    const { userId, assistantRequests, aiRequests } = await request.json();

    if (!userId || typeof assistantRequests !== "number" || typeof aiRequests !== "number") {
      throw new Error("Invalid or missing parameters.");
    }

    await sendLogToTelegram(
      `Received extra requests: Assistant Requests = ${assistantRequests}, AI Requests = ${aiRequests}, User ID = ${userId}`
    );

    const ASSISTANT_REQUEST_PRICE = 0.1; // Price per assistant request in dollars
    const AI_REQUEST_PRICE = 0.2; // Price per AI request in dollars

    const totalPriceInDollars =
      assistantRequests * ASSISTANT_REQUEST_PRICE + aiRequests * AI_REQUEST_PRICE;

    const starsAmount = Math.ceil(totalPriceInDollars * 1);

    const title = "Оплата дополнительных запросов";
    const description = "Оплата за дополнительные запросы к ассистенту и ИИ.";
    const payload = JSON.stringify({ userId, assistantRequests, aiRequests }); // Save user and request info in payload
    const currency = "XTR";
    const prices = [{ amount: starsAmount, label: "Оплата запросов" }];

    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "",
      currency,
      prices
    );

    await sendLogToTelegram(
      `Invoice created for user: ${userId}, Assistant Requests: ${assistantRequests}, AI Requests: ${aiRequests}, Total Price: $${totalPriceInDollars}`
    );

    // Return the invoice link, but don't update the requests until payment is confirmed
    return new Response(JSON.stringify({ invoiceLink }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Ошибка обработки запроса:", errorMessage);
    await sendLogToTelegram(`Error processing extra-requests: ${errorMessage}`);

    return new Response(JSON.stringify({ message: "Ошибка обработки запроса" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
