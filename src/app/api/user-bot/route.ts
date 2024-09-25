import { Bot, webhookCallback } from 'grammy';

const token = process.env.TELEGRAM_USER_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not found.');

const bot = new Bot(token);


bot.command('start', async (ctx) => {
  await ctx.reply('👋 Это бот для пользователей! Для продолжения нажмите на кнопку ниже и войдите в Telegram Web App.', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚪 Войти в Web App', 
            web_app: { url: 'https://crm-vpn.vercel.app/login' }
          }
        ]
      ]
    }
  });
});

export const POST = webhookCallback(bot, 'std/http');
