import { Bot, webhookCallback } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.');

const bot = new Bot(token);

bot.on('message:text', async (ctx) => {
  console.log('Получено сообщение:', ctx.message.text);
  await ctx.reply(`Вы сказали: ${ctx.message.text}`);
});

export const POST = webhookCallback(bot, 'std/http');
