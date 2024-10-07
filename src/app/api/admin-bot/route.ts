import { Bot, webhookCallback } from 'grammy'; 
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not found.');

const bot = new Bot(token);

bot.command('start', async (ctx) => {
  if (ctx.message?.text) {  // Проверяем, что сообщение существует и имеет текст
    const args = ctx.message.text.split(' ');
    if (args.length > 1) {
      const inviteToken = args[1].replace('invite_', ''); // Извлекаем токен после "/start"
      
      // Проверка, существует ли такой токен в базе данных
      const moderator = await prisma.moderator.findFirst({
        where: {
          inviteToken, // Токен совпадает с переданным в ссылке
          telegramId: null, // Модератор еще не зарегистрирован
        },
      });

      if (moderator) {
        // Обновляем модератора, добавляя telegramId
        await prisma.moderator.update({
          where: { id: moderator.id },
          data: { telegramId: BigInt(ctx.from.id) }, // Привязываем Telegram ID
        });

        await ctx.reply(`👋 Добро пожаловать, ${ctx.from.username}! Теперь у вас есть полномочия модератора.`);
      } else {
        await ctx.reply('Неверная или уже использованная ссылка.');
      }
    } else {
      await ctx.reply('👋 Это бот для модераторов!');
    }
  } else {
    await ctx.reply('Ошибка: не удалось обработать команду. Попробуйте снова.');
  }
});

// Webhook для Next.js
export const POST = webhookCallback(bot, 'std/http');
