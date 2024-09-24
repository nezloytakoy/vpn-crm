import { Bot, webhookCallback } from 'grammy';

const supportBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!supportBotToken) throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN not found.');

const supportBot = new Bot(supportBotToken);

supportBot.on('message:text', async (ctx) => {
  await ctx.reply(`Привет, саппорт! Вы сказали: ${ctx.message.text}`);
});

export const POST = webhookCallback(supportBot, 'std/http');
