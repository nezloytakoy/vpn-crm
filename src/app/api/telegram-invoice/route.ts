import { Bot } from "grammy";
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const bot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);
const prisma = new PrismaClient();

const TELEGRAM_LOG_USER_ID = 5829159515;

const sendLogToTelegram = async (message: string) => {
  try {
    await bot.api.sendMessage(TELEGRAM_LOG_USER_ID, message);
  } catch (error) {
    console.error("Ошибка отправки сообщения в Telegram:", error);
  }
};

export async function POST(req: Request) {
  try {
    const { userId, priceInDollars, tariffName } = await req.json();
    await sendLogToTelegram(`Received tariffName: ${tariffName}, price: ${priceInDollars}`);

    // Предположим, provider_token вы взяли из @BotFather после настройки платежей.
    const providerToken = process.env.PROVIDER_TOKEN!; // нужно определить в .env

    // Убедитесь, что priceInDollars — число. Допустим, priceInDollars = 1.23
    // Для USD amount = цена в центах: 1.23 USD = 123 цента
    const amountInCents = Math.round(priceInDollars * 100);

    // Проверяем, что amountInCents - целое число
    if (isNaN(amountInCents) || amountInCents <= 0) {
      await sendLogToTelegram('Некорректная цена.');
      return new Response(JSON.stringify({ message: 'Некорректная цена' }), { status: 400 });
    }

    const title = "Оплата через Звезды Telegram";
    const description = "Оплата за товар через звезды Telegram.";
    const payload = JSON.stringify({ userId, tariffName });
    const currency = "USD"; // валюта должна быть поддерживаемой, напр. USD
    const prices = [{ amount: amountInCents, label: "Оплата через звезды" }];

    // Создаем ссылку на инвойс
    const invoiceLink = await bot.api.createInvoiceLink(
      title,
      description,
      payload,
      providerToken,
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
