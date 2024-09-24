// File: app/api/bot/route.ts

import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.');

// Инициализируем бота с токеном
const bot = new Bot(token);

// Обрабатываем входящие сообщения
bot.on('message:text', async (ctx) => {
  console.log('Получено сообщение:', ctx.message.text);
  await ctx.reply(`Вы сказали: ${ctx.message.text}`);
});

// Запускаем polling для опроса сервера Telegram
bot.start();

console.log("Бот запущен в режиме polling");
