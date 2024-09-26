import { Bot, webhookCallback } from 'grammy';

const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not found.');

const bot = new Bot(token);


bot.command('start', async (ctx) => {
  await ctx.reply('👋 Это бот для саппортов! Для продолжения нажмите на кнопку ниже и войдите в Telegram Web App.', {
  });
});

export const POST = webhookCallback(bot, 'std/http');
