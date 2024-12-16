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
    user_id_prompt: "Enter the user ID",
    assistant_id_prompt: "Enter the assistant ID",
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
    user_id_prompt: "Введите ID пользователя",
    assistant_id_prompt: "Введите ID ассистента",
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
  const result = translations[lang][key] || translations['en'][key];
  console.log(`getTranslation: lang=${lang}, key=${key}, result=${result}`); // Лог переводов
  return result;
}

function detectUserLanguage(ctx: Context): 'ru' | 'en' {
  const langCode = ctx.from?.language_code;
  const detectedLang = (langCode === 'ru' ? 'ru' : 'en') as 'ru' | 'en';
  console.log(`detectUserLanguage: from.language_code=${langCode}, detectedLang=${detectedLang}`); // Лог языка
  return detectedLang;
}

// Обновление lastActiveAt при каждом взаимодействии с ботом
adminBot.use(async (ctx, next) => {
  if (ctx.from?.id) {
    const moderatorId = BigInt(ctx.from.id);
    const newUsername = ctx.from.username || "Отсутствует"; 

    const moderator = await prisma.moderator.findUnique({
      where: { id: moderatorId },
    });

    if (moderator) {
      if (moderator.username !== newUsername) {
        await prisma.moderator.update({
          where: { id: moderatorId },
          data: { 
            lastActiveAt: new Date(),
            username: newUsername
          },
        });
        console.log(`Username модератора с ID ${moderatorId} обновлен на ${newUsername}`);
      } else {
        await prisma.moderator.update({
          where: { id: moderatorId },
          data: { lastActiveAt: new Date() },
        });
      }
    } else {
      console.log(`Модератор с ID ${moderatorId} не найден`);
    }
  }

  await next();
});


adminBot.command('menu', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  console.log('command /menu called, lang =', lang); // Лог внутри команды

  if (ctx.from?.id) {
    const moderator = await prisma.moderator.findFirst({
      where: { id: BigInt(ctx.from.id) },
    });

    if (moderator) {
      await showModeratorMenu(ctx, lang);
    } else {
      console.log('command /menu: moderator not found');
      await ctx.reply(getTranslation(lang, 'command_error'));
    }
  } else {
    console.log('command /menu: ctx.from.id not found');
    await ctx.reply(getTranslation(lang, 'command_error'));
  }
});

adminBot.command('start', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  console.log('command /start called, lang =', lang); // Лог внутри команды

  try {
    if (ctx.from?.id) {
      if (!ctx.from.username) {
        await ctx.reply('У вас отсутствует имя пользователя в Telegram. Пожалуйста, установите его и повторите попытку.');
        return;
      }

      if (ctx.message?.text) {
        const args = ctx.message.text.split(' ');
        console.log('command /start: args =', args);
        if (args.length > 1) {
          const inviteToken = args[1].replace('invite_', '');
          console.log('command /start: inviteToken =', inviteToken);
          const invitation = await prisma.invitation.findFirst({
            where: {
              token: inviteToken,
              used: false,
              role: 'moderator',
            },
          });

          if (invitation) {
            if (!invitation.login || !invitation.password) {
              await ctx.reply('Логин или пароль отсутствуют в приглашении.');
              return;
            }

            const moderatorId = BigInt(ctx.from.id);

            const existingModerator = await prisma.moderator.findUnique({
              where: { id: moderatorId },
            });

            if (existingModerator) {
              console.log('command /start: existingModerator found');
              await prisma.moderator.update({
                where: { id: moderatorId },
                data: { username: ctx.from.username },
              });

              await ctx.reply('Вы уже являетесь модератором.');
              await showModeratorMenu(ctx, lang); 
            } else {
              console.log('command /start: creating new moderator');
              await prisma.moderator.create({
                data: {
                  login: invitation.login,
                  password: invitation.password, 
                  id: moderatorId,
                  username: ctx.from.username,
                },
              });

              await prisma.invitation.update({
                where: { id: invitation.id },
                data: { used: true },
              });

              await ctx.reply(getTranslation(lang, 'welcome'));
              await showModeratorMenu(ctx, lang);
            }
          } else {
            console.log('command /start: no valid invitation found');
            await ctx.reply(getTranslation(lang, 'invalid_link'));
          }
        } else {
          console.log('command /start: no invite token provided, just greeting');
          await ctx.reply(getTranslation(lang, 'moderator_bot'));
        }
      } else {
        console.log('command /start: no message text');
        await ctx.reply(getTranslation(lang, 'command_error'));
      }
    } else {
      console.log('command /start: no ctx.from.id');
      await ctx.reply(getTranslation(lang, 'command_error'));
    }
  } catch (error) {
    console.error('Ошибка в команде /start:', error);
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
});


async function showModeratorMenu(ctx: Context, lang: 'ru' | 'en') {
  console.log('showModeratorMenu called, lang =', lang); // Лог для отображения меню
  const keyboard = new InlineKeyboard()
    .text('💬 ' + getTranslation(lang, 'message_user'), 'message_user')
    .row()
    .text('👨‍💻 ' + getTranslation(lang, 'message_assistant'), 'message_assistant');

  await ctx.reply(getTranslation(lang, 'menu'), { reply_markup: keyboard });
}


adminBot.callbackQuery('message_user', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  console.log('callbackQuery: message_user, lang =', lang);
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_user_id' };
  await ctx.reply(getTranslation(lang, 'user_id_prompt'));
});

adminBot.callbackQuery('message_assistant', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  console.log('callbackQuery: message_assistant, lang =', lang);
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_assistant_id' };
  await ctx.reply(getTranslation(lang, 'assistant_id_prompt'));
});


adminBot.on('message', async (ctx) => {
  const modId = ctx.from?.id;
  if (!modId) {
    console.log('on message: no modId');
    await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
    return;
  }

  const lang = detectUserLanguage(ctx);
  console.log('on message: received message, lang =', lang);
  const messageText = ctx.message?.text;
  if (!messageText) {
    await ctx.reply('Пожалуйста, отправьте текстовое сообщение.');
    return;
  }

  const moderatorId = BigInt(modId);

  const currentState = moderatorState[modId]?.state;
  console.log(`on message: currentState = ${currentState}, modId=${modId}`);

  if (!currentState) {
    await ctx.reply('У вас нет активных арбитражей или текущих запросов.');
    return;
  }

  if (currentState === 'awaiting_user_id' || currentState === 'awaiting_assistant_id') {
    const id = messageText;

    if (!/^\d{9,10}$/.test(id)) {
      await ctx.reply('ID должен состоять из 9-10 цифр. Попробуйте снова.');
      return;
    }

    moderatorState[modId].targetId = id;

    if (currentState === 'awaiting_user_id') {
      moderatorState[modId].state = 'awaiting_message_user';
    } else {
      moderatorState[modId].state = 'awaiting_message_assistant';
    }

    await ctx.reply('Напишите ваше сообщение.');
  } else if (currentState === 'awaiting_message_user' || currentState === 'awaiting_message_assistant') {
    const targetId = moderatorState[modId]?.targetId;

    if (targetId) {
      const targetMessage = `Сообщение от модератора:\n\n${messageText}`;
      try {
        if (currentState === 'awaiting_message_user') {
          await userBot.api.sendMessage(Number(targetId), targetMessage);
          await prisma.moderator.update({
            where: { id: moderatorId },
            data: { userMessagesCount: { increment: 1 } },
          });
        } else {
          await supportBot.api.sendMessage(Number(targetId), targetMessage);
          await prisma.moderator.update({
            where: { id: moderatorId },
            data: { assistantMessagesCount: { increment: 1 } },
          });
        }

        await ctx.reply('Сообщение отправлено.');
      } catch (error) {
        console.log('on message: error sending message', error);
        await ctx.reply('Ошибка при отправке сообщения.');
      }
    }

    delete moderatorState[modId];
  }
});


export const POST = webhookCallback(adminBot, 'std/http');
