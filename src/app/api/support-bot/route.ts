import { Bot, webhookCallback } from 'grammy';
import { PrismaClient } from '@prisma/client';

const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not found.');

const bot = new Bot(token);
const prisma = new PrismaClient();

bot.command('start', async (ctx) => {
  const args = ctx.match?.split(' ') ?? [];
  if (args.length > 0 && args[0].startsWith('invite_')) {
    const inviteToken = args[0].replace('invite_', '');

    try {
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
      });

      if (!invitation || invitation.used) {
        await ctx.reply('Ссылка недействительна или уже была использована.');
        return;
      }


      await prisma.assistant.create({
        data: {
          telegramId: String(ctx.from?.id),
          role: invitation.role,
        },
      });

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { used: true },
      });

      await ctx.reply('Поздравляем, вы стали ассистентом и получили доступ к функционалу бота!');
    } catch (error) {
      console.error('Ошибка при назначении роли ассистента:', error);
      await ctx.reply('Произошла ошибка при обработке вашей заявки. Пожалуйста, попробуйте позже.');
    }
  } else {
    await ctx.reply('👋 Это бот для саппортов! Используйте действительную пригласительную ссылку для доступа к функционалу.');
  }
});


bot.command('menu', async (ctx) => {
  try {
    await ctx.reply('Главное меню:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Начать работу', callback_data: 'start_work' }],
          [{ text: 'Мои коины', callback_data: 'my_coins' }],
          [{ text: 'Моя активность', callback_data: 'my_activity' }],
        ],
      },
    });
  } catch (error) {
    console.error('Ошибка при отображении главного меню:', error);
    await ctx.reply('Произошла ошибка при отображении меню. Пожалуйста, попробуйте еще раз.');
  }
});


bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery?.data;

  if (data === 'start_work') {
    await ctx.reply('Вы выбрали: Начать работу.');
  } else if (data === 'my_coins') {

    await ctx.reply('Ваши коины: 1000.');
  } else if (data === 'my_activity') {
  
    await ctx.reply('Моя активность: 10 завершенных задач.');
  }
});

export const POST = webhookCallback(bot, 'std/http');
