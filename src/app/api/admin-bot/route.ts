import { Bot, InlineKeyboard, webhookCallback, Context } from 'grammy'; 
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not found.');

const bot = new Bot(token);

// Команда /start с проверкой токена и добавлением Telegram ID
bot.command('start', async (ctx) => {
  if (ctx.message?.text) {
    const args = ctx.message.text.split(' ');
    if (args.length > 1) {
      const inviteToken = args[1].replace('invite_', '');

      const moderator = await prisma.moderator.findFirst({
        where: {
          inviteToken,
          telegramId: null,
        },
      });

      if (moderator) {
        await prisma.moderator.update({
          where: { id: moderator.id },
          data: { telegramId: BigInt(ctx.from.id) },
        });

        await ctx.reply(`👋 Добро пожаловать, ${ctx.from.username}! Теперь у вас есть полномочия модератора.`);

        // Показываем меню после успешной регистрации
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
});

// Функция для отображения меню модератора
async function showModeratorMenu(ctx: Context) {  // Указали правильный тип 'Context'
  const keyboard = new InlineKeyboard()
    .text('Сообщение пользователю', 'message_user')  // Кнопка для сообщения пользователю
    .row()
    .text('Сообщение ассистенту', 'message_assistant')  // Кнопка для сообщения ассистенту
    .row()
    .text('Текущие арбитражи', 'current_arbitrations'); // Кнопка для просмотра текущих арбитражей

  await ctx.reply('Меню', { reply_markup: keyboard });
}

// Обработка нажатий на кнопки
bot.callbackQuery('message_user', async (ctx) => {
  await ctx.answerCallbackQuery();  // Убираем "зависание" кнопки
  await ctx.reply('Введите сообщение для пользователя.');
});

bot.callbackQuery('message_assistant', async (ctx) => {
  await ctx.answerCallbackQuery();  // Убираем "зависание" кнопки
  await ctx.reply('Введите сообщение для ассистента.');
});

bot.callbackQuery('current_arbitrations', async (ctx) => {
  await ctx.answerCallbackQuery();  // Убираем "зависание" кнопки
  await ctx.reply('Список текущих арбитражей.');
});

// Webhook для Next.js
export const POST = webhookCallback(bot, 'std/http');
