import { Bot, InlineKeyboard, webhookCallback, Context } from 'grammy'; 
import { PrismaClient } from '@prisma/client';

// Боты для пользователей, ассистентов и модераторов
const userBot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);
const supportBot = new Bot(process.env.TELEGRAM_SUPPORT_BOT_TOKEN!);
const adminBot = new Bot(process.env.TELEGRAM_ADMIN_BOT_TOKEN!);

const prisma = new PrismaClient();

const moderatorState: { [moderatorId: number]: { state: string, targetId?: string } } = {};

// Команда /start с проверкой токена и добавлением Telegram ID
adminBot.command('start', async (ctx) => {
  if (ctx.from?.id) {
    const moderator = await prisma.moderator.findFirst({
      where: { telegramId: BigInt(ctx.from.id) },
    });

    if (moderator) {
      await showModeratorMenu(ctx);
    } else if (ctx.message?.text) {
      const args = ctx.message.text.split(' ');
      if (args.length > 1) {
        const inviteToken = args[1].replace('invite_', '');

        const inviteModerator = await prisma.moderator.findFirst({
          where: {
            inviteToken,
            telegramId: null,
          },
        });

        if (inviteModerator) {
          await prisma.moderator.update({
            where: { id: inviteModerator.id },
            data: { telegramId: BigInt(ctx.from.id) },
          });

          await ctx.reply(`👋 Добро пожаловать, ${ctx.from.username}! Теперь у вас есть полномочия модератора.`);
          await showModeratorMenu(ctx);
        } else {
          await ctx.reply('Неверная или уже использованная ссылка.');
        }
      } else {
        await ctx.reply('👋 Это бот для модераторов!');
      }
    } else {
      await ctx.reply('Ошибка: не удалось обработать команду. Попробуйте снова.');
    }
  } else {
    await ctx.reply('Ошибка: невозможно определить пользователя.');
  }
});

// Функция для отображения меню модератора
async function showModeratorMenu(ctx: Context) {
  const keyboard = new InlineKeyboard()
    .text('💬 Сообщение пользователю', 'message_user')
    .row()
    .text('👨‍💻 Сообщение ассистенту', 'message_assistant')
    .row()
    .text('⚖️ Текущие арбитражи', 'current_arbitrations');

  await ctx.reply('📋 Меню:', { reply_markup: keyboard });
}

// Обработка нажатий на кнопки
adminBot.callbackQuery('message_user', async (ctx) => {
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_user_id' };
  await ctx.reply('Введите ID пользователя (9 цифр).');
});

adminBot.callbackQuery('message_assistant', async (ctx) => {
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_assistant_id' };
  await ctx.reply('Введите ID ассистента (9 цифр).');
});

// Обработка текстовых сообщений модератора
adminBot.on('message:text', async (ctx) => {
  const modId = ctx.from?.id;
  if (!modId) {
    await ctx.reply('Ошибка: невозможно определить пользователя.');
    return;
  }

  const currentState = moderatorState[modId]?.state;

  if (!currentState) {
    // Если состояние неизвестно
    await ctx.reply('Я вас не понимаю.');
    return;
  }

  // Проверка ID пользователя или ассистента
  if (currentState === 'awaiting_user_id' || currentState === 'awaiting_assistant_id') {
    const id = ctx.message.text;

    // Проверяем, что ID состоит из 9 цифр и является числом
    if (!/^\d{9}$/.test(id)) { // Проверка, что ID состоит из 9 цифр
      await ctx.reply('ID должен состоять из 9 цифр. Попробуйте снова.');
      return;
    }

    // Сохраняем ID пользователя или ассистента
    moderatorState[modId].targetId = id;

    // Теперь определим, для пользователя или ассистента мы ожидаем сообщение
    if (currentState === 'awaiting_user_id') {
      moderatorState[modId].state = 'awaiting_message_user';
    } else {
      moderatorState[modId].state = 'awaiting_message_assistant';
    }

    await ctx.reply('Напишите ваше сообщение.');
  } else if (currentState === 'awaiting_message_user' || currentState === 'awaiting_message_assistant') {
    const targetId = moderatorState[modId]?.targetId;

    if (targetId) {
      const targetMessage = `Сообщение от модератора: ${ctx.message.text}`;
      try {
        if (currentState === 'awaiting_message_user') {
          // Отправляем сообщение пользователю через userBot
          await userBot.api.sendMessage(Number(targetId), targetMessage);
        } else if (currentState === 'awaiting_message_assistant') {
          // Отправляем сообщение ассистенту через supportBot
          await supportBot.api.sendMessage(Number(targetId), targetMessage);
        }
        await ctx.reply('Сообщение успешно отправлено.');
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error); // Логирование ошибки
        await ctx.reply('Ошибка при отправке сообщения. Проверьте ID.');
      }
    }
    delete moderatorState[modId]; // Сбрасываем состояние модератора
  } else {
    await ctx.reply('Я вас не понимаю.');
  }
});

adminBot.callbackQuery('current_arbitrations', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('Список текущих арбитражей.');
});

// Webhook для Next.js
export const POST = webhookCallback(adminBot, 'std/http');
