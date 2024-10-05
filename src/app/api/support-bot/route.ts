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
        await ctx.reply('❌ Ссылка недействительна или уже была использована.');
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

      await ctx.reply('🎉 Поздравляем, вы стали ассистентом и получили доступ к функционалу бота!');
    } catch (error) {
      console.error('Ошибка при назначении роли ассистента:', error);
      await ctx.reply('⚠️ Произошла ошибка при обработке вашей заявки. Пожалуйста, попробуйте позже.');
    }
  } else {
    await ctx.reply('👋 Это бот для саппортов! Используйте действительную пригласительную ссылку для доступа к функционалу.');
  }
});

bot.command('menu', async (ctx) => {
  try {
    await ctx.reply('📋 Главное меню:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Начать работу', callback_data: 'start_work' }],
          [{ text: '💰 Мои коины', callback_data: 'my_coins' }],
          [{ text: '📊 Моя активность', callback_data: 'my_activity' }],
        ],
      },
    });
  } catch (error) {
    console.error('Ошибка при отображении главного меню:', error);
    await ctx.reply('⚠️ Произошла ошибка при отображении меню. Пожалуйста, попробуйте еще раз.');
  }
});

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery?.data;
  const telegramId = String(ctx.from?.id);

  if (data === 'start_work') {
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId },
    });

    if (assistant?.isWorking) {
      await ctx.reply('⚠️ Вы уже работаете!');
      return;
    }

    await prisma.assistant.update({
      where: { telegramId },
      data: { isWorking: true, isBusy: false },
    });

    await ctx.reply('🚀 Работа начата! Чтобы завершить работу, используйте команду /end_work.');
  } else if (data === 'my_coins') {
    await ctx.reply('💰 Ваши коины: 1000.');
  } else if (data === 'my_activity') {
    await ctx.reply('📊 Моя активность: 10 завершенных задач.');
  } else if (data.startsWith('accept_') || data.startsWith('reject_')) {
    const [action, requestId] = data.split('_');

    if (action === 'accept') {
      await handleAcceptRequest(requestId, telegramId, ctx);
    } else if (action === 'reject') {
      await handleRejectRequest(requestId, telegramId, ctx);
    }
  }
});

async function handleAcceptRequest(requestId: string, assistantTelegramId: string, ctx: any) {
  // Обновляем статус запроса
  const assistantRequest = await prisma.assistantRequest.update({
    where: { id: Number(requestId) },
    data: { status: 'IN_PROGRESS', isActive: true },
    include: { user: true },
  });

  // Обновляем статус ассистента
  await prisma.assistant.update({
    where: { telegramId: assistantTelegramId },
    data: { isBusy: true },
  });

  // Отправляем сообщения ассистенту и пользователю
  await ctx.reply('✅ Вы приняли запрос, ожидайте пока пользователь сформулирует свой вопрос.');
  await sendTelegramMessageToUser(assistantRequest.user.telegramId, 'Ассистент присоединился к чату. Сформулируйте свой вопрос.');
}

async function handleRejectRequest(requestId: string, assistantTelegramId: string, ctx: any) {
  // Обновляем статус запроса
  await prisma.assistantRequest.update({
    where: { id: Number(requestId) },
    data: { status: 'REJECTED', isActive: false },
  });

  // Освобождаем ассистента
  await prisma.assistant.update({
    where: { telegramId: assistantTelegramId },
    data: { isBusy: false },
  });

  // Отправляем ассистенту сообщение об отклонении
  await ctx.reply('❌ Вы отклонили запрос.');
}

bot.command('end_work', async (ctx) => {
  try {
    const telegramId = String(ctx.from?.id);

    const assistant = await prisma.assistant.findUnique({
      where: { telegramId },
    });

    if (!assistant?.isWorking) {
      await ctx.reply('⚠️ Вы не работаете в данный момент!');
      return;
    }

    await prisma.assistant.update({
      where: { telegramId },
      data: { isWorking: false, isBusy: false },
    });

    await ctx.reply('🚪 Работа завершена! Вы завершили свою смену.');
  } catch (error) {
    console.error('Ошибка при завершении работы:', error);
    await ctx.reply('⚠️ Произошла ошибка при завершении работы. Пожалуйста, попробуйте еще раз.');
  }
});

// Функция отправки сообщения пользователю
async function sendTelegramMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

export const POST = webhookCallback(bot, 'std/http');
