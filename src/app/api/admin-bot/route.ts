import { Bot, InlineKeyboard, webhookCallback, Context } from 'grammy'; 
import { PrismaClient } from '@prisma/client';


const userBot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);
const supportBot = new Bot(process.env.TELEGRAM_SUPPORT_BOT_TOKEN!);
const adminBot = new Bot(process.env.TELEGRAM_ADMIN_BOT_TOKEN!);

const prisma = new PrismaClient();

const moderatorState: { [moderatorId: number]: { state: string, targetId?: string } } = {};


const translations = {
  en: {
    welcome: "👋 Welcome, now you have moderator privileges.",
    invalid_link: "The link is invalid or has already been used.",
    moderator_bot: "👋 This is a bot for moderators!",
    command_error: "Error: Could not process the command. Please try again.",
    user_id_prompt: "Enter the user ID (9 digits).",
    assistant_id_prompt: "Enter the assistant ID (9 digits).",
    id_invalid: "The ID must be 9 digits. Please try again.",
    message_prompt: "Write your message.",
    message_sent: "Message sent successfully.",
    message_send_error: "Error sending the message. Please check the ID.",
    arbitration_list: "List of current arbitrations.",
    unknown_command: "I don't understand you.",
    message_user: "Message to user",
    message_assistant: "Message to assistant",
    menu: "Main Menu",
  },
  ru: {
    welcome: "👋 Добро пожаловать, теперь у вас есть полномочия модератора.",
    invalid_link: "Неверная или уже использованная ссылка.",
    moderator_bot: "👋 Это бот для модераторов!",
    command_error: "Ошибка: не удалось обработать команду. Попробуйте снова.",
    user_id_prompt: "Введите ID пользователя (9 цифр).",
    assistant_id_prompt: "Введите ID ассистента (9 цифр).",
    id_invalid: "ID должен состоять из 9 цифр. Попробуйте снова.",
    message_prompt: "Напишите ваше сообщение.",
    message_sent: "Сообщение успешно отправлено.",
    message_send_error: "Ошибка при отправке сообщения. Проверьте ID.",
    arbitration_list: "Список текущих арбитражей.",
    unknown_command: "Я вас не понимаю.",
    message_user: "Сообщение пользователю",
    message_assistant: "Сообщение ассистенту",
    menu: "Главное меню",
  },
};


function getTranslation(lang: 'ru' | 'en', key: keyof typeof translations['en']): string {
  return translations[lang][key] || translations['en'][key];
}


function detectUserLanguage(ctx: Context): 'ru' | 'en' {
  const langCode = ctx.from?.language_code;
  return langCode === 'ru' ? 'ru' : 'en';
}


adminBot.command('start', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    const moderator = await prisma.moderator.findFirst({
      where: { telegramId: BigInt(ctx.from.id) },
    });

    if (moderator) {
      await showModeratorMenu(ctx, lang);
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

          await ctx.reply(getTranslation(lang, 'welcome'));
          await showModeratorMenu(ctx, lang);
        } else {
          await ctx.reply(getTranslation(lang, 'invalid_link'));
        }
      } else {
        await ctx.reply(getTranslation(lang, 'moderator_bot'));
      }
    } else {
      await ctx.reply(getTranslation(lang, 'command_error'));
    }
  } else {
    await ctx.reply(getTranslation(lang, 'command_error'));
  }
});


async function showModeratorMenu(ctx: Context, lang: 'ru' | 'en') {
  const keyboard = new InlineKeyboard()
    .text('💬 ' + getTranslation(lang, 'message_user'), 'message_user')
    .row()
    .text('👨‍💻 ' + getTranslation(lang, 'message_assistant'), 'message_assistant')
    .row()
    .text('⚖️ ' + getTranslation(lang, 'arbitration_list'), 'current_arbitrations');

  await ctx.reply(getTranslation(lang, 'menu'), { reply_markup: keyboard });
}


adminBot.callbackQuery('message_user', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_user_id' };
  await ctx.reply(getTranslation(lang, 'user_id_prompt'));
});

adminBot.callbackQuery('message_assistant', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_assistant_id' };
  await ctx.reply(getTranslation(lang, 'assistant_id_prompt'));
});


adminBot.on('message:text', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  const modId = ctx.from?.id;
  if (!modId) {
    await ctx.reply(getTranslation(lang, 'command_error'));
    return;
  }

  const currentState = moderatorState[modId]?.state;

  if (!currentState) {
    await ctx.reply(getTranslation(lang, 'unknown_command'));
    return;
  }

  if (currentState === 'awaiting_user_id' || currentState === 'awaiting_assistant_id') {
    const id = ctx.message.text;

    if (!/^\d{9}$/.test(id)) {
      await ctx.reply(getTranslation(lang, 'id_invalid'));
      return;
    }

    moderatorState[modId].targetId = id;

    if (currentState === 'awaiting_user_id') {
      moderatorState[modId].state = 'awaiting_message_user';
    } else {
      moderatorState[modId].state = 'awaiting_message_assistant';
    }

    await ctx.reply(getTranslation(lang, 'message_prompt'));
  } else if (currentState === 'awaiting_message_user' || currentState === 'awaiting_message_assistant') {
    const targetId = moderatorState[modId]?.targetId;

    if (targetId) {
      const targetMessage = `Сообщение от модератора:\n\n${ctx.message.text}`;
      try {
        if (currentState === 'awaiting_message_user') {
          await userBot.api.sendMessage(Number(targetId), targetMessage);
        } else if (currentState === 'awaiting_message_assistant') {
          await supportBot.api.sendMessage(Number(targetId), targetMessage);
        }
        await ctx.reply(getTranslation(lang, 'message_sent'));
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        await ctx.reply(getTranslation(lang, 'message_send_error'));
      }
    }
    delete moderatorState[modId];
  } else {
    await ctx.reply(getTranslation(lang, 'unknown_command'));
  }
});

adminBot.callbackQuery('current_arbitrations', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  await ctx.answerCallbackQuery();
  await ctx.reply(getTranslation(lang, 'arbitration_list'));
});


export const POST = webhookCallback(adminBot, 'std/http');
