import { Bot } from "grammy";

const bot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);

const TELEGRAM_LOG_USER_ID = 5829159515;

const sendLogToTelegram = async (message: string) => {
  try {
    await bot.api.sendMessage(TELEGRAM_LOG_USER_ID, message);
  } catch (error) {
    console.error("Error sending log message to Telegram:", error);
  }
};

export async function POST(request: Request) {
  try {
    const { userId, priceInDollars, tariffName } = await request.json();
    await sendLogToTelegram(`Received POST request with tariffName: ${tariffName}, price: ${priceInDollars}, userId: ${userId}`);

    const starsAmount = priceInDollars * 100; // Assuming starsAmount is in cents
    const title = "Оплата через Звезды Telegram";
    const description = `Оплата за тариф "${tariffName}" через звезды Telegram.`;
    const payload = JSON.stringify({ userId, tariffName }); // Saving user and tariff info in payload
    const currency = "USD"; // Default to USD
    const prices = [{ amount: starsAmount, label: "Оплата через звезды" }];

    await sendLogToTelegram(`Creating invoice with starsAmount: ${starsAmount}, title: ${title}, description: ${description}, currency: ${currency}, prices: ${JSON.stringify(prices)}`);

    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      "", // No providerToken required
      currency,
      prices
    );

    await sendLogToTelegram(`Invoice link created successfully for user: ${userId}, tariff: ${tariffName}, link: ${invoiceLink}`);

    // Return the invoice link, but don't update subscription until successful payment
    return new Response(JSON.stringify({ invoiceLink }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error creating invoice:", errorMessage);
    await sendLogToTelegram(`Error creating invoice: ${errorMessage}`);
    
    return new Response(JSON.stringify({ message: "Error creating invoice" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
