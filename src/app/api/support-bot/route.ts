import { Bot, webhookCallback, Context } from 'grammy';
import { PrismaClient } from '@prisma/client';

const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not found.');

const bot = new Bot(token);
const prisma = new PrismaClient();


type TranslationKey = keyof typeof translations["en"];


const getTranslation = (lang: "en" | "ru", key: TranslationKey) => {
  return translations[lang][key] || translations["en"][key];
};


const translations = {
  en: {
    end_dialog_error: "Error: could not get your Telegram ID.",
    no_active_requests: "⚠️ You have no active requests.",
    dialog_closed: "The dialog with the user has been closed.",
    assistant_finished_dialog: "The assistant has finished the dialog.",
    start_invalid_link: "❌ The link is invalid or has already been used.",
    assistant_congrats: "🎉 Congratulations, you are now an assistant!",
    start_message: "👋 This is the support bot! Use a valid invite link to access the functionality.",
    menu_message: "📋 Main menu:",
    start_work: "🚀 Start working!",
    my_coins: "💰 My coins",
    my_activity: "📊 My activity",
    already_working: "⚠️ You are already working!",
    work_started: "🚀 Work started! To end, use the /end_work command.",
    end_work: "🚪 Work finished!",
    no_working_status: "⚠️ You are not working at the moment!",
    accept_request: "✅ You have accepted the request. Please wait for the user's question.",
    reject_request: "❌ You have rejected the request.",
    send_message_error: "Please send a text message.",
    no_user_requests: "⚠️ You have no active user requests.",
  },
  ru: {
    end_dialog_error: "Ошибка: не удалось получить ваш идентификатор Telegram.",
    no_active_requests: "⚠️ У вас нет активных запросов.",
    dialog_closed: "Диалог с пользователем завершен.",
    assistant_finished_dialog: "Ассистент завершил диалог.",
    start_invalid_link: "❌ Ссылка недействительна или уже была использована.",
    assistant_congrats: "🎉 Поздравляем, вы стали ассистентом!",
    start_message: "👋 Это бот для саппортов! Используйте действительную пригласительную ссылку для доступа к функционалу.",
    menu_message: "📋 Главное меню:",
    start_work: "🚀 Начать работу!",
    my_coins: "💰 Мои коины",
    my_activity: "📊 Моя активность",
    already_working: "⚠️ Вы уже работаете!",
    work_started: "🚀 Работа начата! Чтобы завершить работу, используйте команду /end_work.",
    end_work: "🚪 Работа завершена!",
    no_working_status: "⚠️ Вы не работаете в данный момент!",
    accept_request: "✅ Вы приняли запрос. Ожидайте вопрос пользователя.",
    reject_request: "❌ Вы отклонили запрос.",
    send_message_error: "Пожалуйста, отправьте текстовое сообщение.",
    no_user_requests: "⚠️ У вас нет активных запросов пользователей.",
  },
};


const detectUserLanguage = (ctx: Context) => {
  const userLang = ctx.from?.language_code;
  return userLang === 'ru' ? 'ru' : 'en';
};


bot.command('end_dialog', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    const activeRequest = await prisma.assistantRequest.findFirst({
      where: {
        assistant: { telegramId },
        isActive: true,
      },
      include: { user: true },
    });

    if (!activeRequest) {
      await ctx.reply(getTranslation(lang, 'no_active_requests'));
      return;
    }

    await prisma.assistantRequest.update({
      where: { id: activeRequest.id },
      data: { status: 'COMPLETED', isActive: false },
    });

    await prisma.assistant.update({
      where: { telegramId },
      data: { isBusy: false },
    });

    await ctx.reply(getTranslation(lang, 'dialog_closed'));

    await sendTelegramMessageToUser(activeRequest.user.telegramId.toString(), getTranslation(lang, 'assistant_finished_dialog'));
  } catch (error) {
    console.error('Error ending dialog:', error);
    await ctx.reply(getTranslation(lang, 'end_dialog_error'));
  }
});


bot.command('start', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  const args = ctx.match?.split(' ') ?? [];

  if (args.length > 0 && args[0].startsWith('invite_')) {
    const inviteToken = args[0].replace('invite_', '');

    try {
      const invitation = await prisma.invitation.findUnique({ where: { token: inviteToken } });

      if (!invitation || invitation.used) {
        await ctx.reply(getTranslation(lang, 'start_invalid_link'));
        return;
      }

      if (ctx.from?.id) {
        const telegramId = BigInt(ctx.from.id);

        await prisma.assistant.create({
          data: {
            telegramId,
            role: invitation.role,
          },
        });

        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { used: true },
        });

        await ctx.reply(getTranslation(lang, 'assistant_congrats'));
      } else {
        await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      }
    } catch (error) {
      console.error('Error assigning assistant role:', error);
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
    }
  } else {
    await ctx.reply(getTranslation(lang, 'start_message'));
  }
});


bot.command('menu', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  try {
    await ctx.reply(getTranslation(lang, 'menu_message'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'start_work'), callback_data: 'start_work' }],
          [{ text: getTranslation(lang, 'my_coins'), callback_data: 'my_coins' }],
          [{ text: getTranslation(lang, 'my_activity'), callback_data: 'my_activity' }],
        ],
      },
    });
  } catch (error) {
    console.error('Error displaying menu:', error);
    await ctx.reply(getTranslation(lang, 'end_dialog_error'));
  }
});


bot.on('callback_query:data', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    const telegramId = BigInt(ctx.from.id);
    const data = ctx.callbackQuery?.data;

    if (data === 'start_work') {
      const assistant = await prisma.assistant.findUnique({ where: { telegramId } });

      if (assistant?.isWorking) {
        await ctx.reply(getTranslation(lang, 'already_working'));
        return;
      }

      await prisma.assistant.update({
        where: { telegramId },
        data: { isWorking: true, isBusy: false },
      });

      await ctx.reply(getTranslation(lang, 'work_started'));
    } else if (data === 'my_coins') {
      await ctx.reply(getTranslation(lang, 'my_coins'));
    } else if (data === 'my_activity') {
      await ctx.reply(getTranslation(lang, 'my_activity'));
    }
  } else {
    await ctx.reply(getTranslation(lang, 'end_dialog_error'));
  }
});


async function sendTelegramMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export const POST = webhookCallback(bot, 'std/http');
