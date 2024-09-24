import { Bot, webhookCallback } from 'grammy';

const adminBotToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
if (!adminBotToken) throw new Error('TELEGRAM_ADMIN_BOT_TOKEN not found.');

const adminBot = new Bot(adminBotToken);

adminBot.on('message:text', async (ctx) => {
  await ctx.reply(`Бот для администраторов/модераторов! Сообщение: ${ctx.message.text}`);
});

export const POST = webhookCallback(adminBot, 'std/http');
