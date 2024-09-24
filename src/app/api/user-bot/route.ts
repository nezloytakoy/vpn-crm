import { Bot, webhookCallback } from 'grammy';

const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;
if (!userBotToken) throw new Error('TELEGRAM_USER_BOT_TOKEN not found.');

const userBot = new Bot(userBotToken);

userBot.on('message:text', async (ctx) => {
  await ctx.reply(`Бот для пользователей! Сообщение: ${ctx.message.text}`);
});

export const POST = webhookCallback(userBot, 'std/http');
