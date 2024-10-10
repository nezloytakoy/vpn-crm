import { Bot, InlineKeyboard, webhookCallback, Context } from 'grammy';
import { PrismaClient, ArbitrationStatus } from '@prisma/client';

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
  return translations[lang][key] || translations['en'][key];
}

function detectUserLanguage(ctx: Context): 'ru' | 'en' {
  const langCode = ctx.from?.language_code;
  return langCode === 'ru' ? 'ru' : 'en';
}

// Обновление lastActiveAt при каждом взаимодействии с ботом
adminBot.use(async (ctx, next) => {
  if (ctx.from?.id) {
    await prisma.moderator.update({
      where: { id: BigInt(ctx.from.id) },
      data: { lastActiveAt: new Date() },
    });
  }
  await next();
});

adminBot.command('menu', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    // Проверяем, является ли пользователь модератором
    const moderator = await prisma.moderator.findFirst({
      where: { id: BigInt(ctx.from.id) },
    });

    if (moderator) {
      // Если пользователь модератор, показываем меню
      await showModeratorMenu(ctx, lang);
    } else {
      // Если пользователь не модератор, выводим сообщение об ошибке
      await ctx.reply(getTranslation(lang, 'command_error'));
    }
  } else {
    await ctx.reply(getTranslation(lang, 'command_error'));
  }
});

adminBot.command('start', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    // Проверка приглашения через токен
    if (ctx.message?.text) {
      const args = ctx.message.text.split(' ');
      if (args.length > 1) {
        const inviteToken = args[1].replace('invite_', '');

        // Ищем токен в таблице Invitation
        const invitation = await prisma.invitation.findFirst({
          where: {
            token: inviteToken,
            used: false,
            role: 'moderator',
          },
        });

        if (invitation) {
          if (!invitation.login) {
            await ctx.reply('Логин отсутствует в приглашении.');
            return;
          }

          // Переносим данные из таблицы Invitation в таблицу Moderator
          await prisma.moderator.create({
            data: {
              login: invitation.login,
              password: invitation.password || 'defaultPassword',
              id: BigInt(ctx.from.id),
            },
          });

          // Обновляем статус приглашения как использованное
          await prisma.invitation.update({
            where: { id: invitation.id },
            data: { used: true },
          });

          // Приветственное сообщение и меню для модератора
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

async function sendMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_USER_BOT_TOKEN не установлен');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (error) {
    console.error('Ошибка при отправке сообщения пользователю:', error);
  }
}

async function sendMessageToAssistant(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (error) {
    console.error('Ошибка при отправке сообщения ассистенту:', error);
  }
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

adminBot.callbackQuery('current_arbitrations', async (ctx) => {
  await ctx.answerCallbackQuery();

  // Получаем список текущих арбитражей со статусом 'PENDING'
  const arbitrations = await prisma.arbitration.findMany({
    where: {
      status: 'PENDING' as ArbitrationStatus,
    },
    include: {
      user: true,
      assistant: true,
    },
  });

  if (arbitrations.length === 0) {
    await ctx.reply('Нет текущих арбитражей.');
    return;
  }

  // Формируем сообщение со списком арбитражей и кнопками для рассмотрения
  for (const arbitration of arbitrations) {
    const message = `Арбитраж ID: ${arbitration.id}\nПользователь: ${arbitration.user.telegramId}\nАссистент: ${arbitration.assistant.telegramId}\nПричина: ${arbitration.reason}`;
    const keyboard = new InlineKeyboard().text('Рассмотреть', `review_${arbitration.id.toString()}`);

    await ctx.reply(message, { reply_markup: keyboard });
  }
});

adminBot.command('end_arbitration', async (ctx) => {
  const moderatorTelegramId = BigInt(ctx.from?.id || 0);

  if (!moderatorTelegramId) {
    await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
    return;
  }

  try {
    // Находим активный арбитраж, в котором участвует модератор
    const arbitration = await prisma.arbitration.findFirst({
      where: {
        moderatorId: moderatorTelegramId,
        status: 'IN_PROGRESS' as ArbitrationStatus,
      },
      include: {
        user: true,
        assistant: true,
      },
    });

    if (!arbitration) {
      await ctx.reply('У вас нет активных арбитражей.');
      return;
    }

    // Отправляем модератору сообщение с кнопками для выбора победителя
    const keyboard = new InlineKeyboard()
      .text('Пользователь', `arbitration_decision_user_${arbitration.id}`)
      .row()
      .text('Ассистент', `arbitration_decision_assistant_${arbitration.id}`);

    await ctx.reply('Кто прав?', { reply_markup: keyboard });

  } catch (error) {
    console.error('Ошибка при завершении арбитража:', error);
    await ctx.reply('Произошла ошибка при завершении арбитража.');
  }
});


adminBot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data) {
    if (data.startsWith('review_')) {
      await ctx.answerCallbackQuery(); // Подтверждаем получение колбэка

      const arbitrationId = BigInt(data.split('_')[1]);
      const moderatorTelegramId = BigInt(ctx.from?.id || 0);

      if (!moderatorTelegramId) {
        await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
        return;
      }

      try {
        // Обновляем запись арбитража: назначаем модератора и устанавливаем статус 'IN_PROGRESS'
        const arbitration = await prisma.arbitration.update({
          where: { id: arbitrationId },
          data: {
            moderatorId: moderatorTelegramId,
            status: 'IN_PROGRESS' as ArbitrationStatus,
          },
          include: {
            user: true,
            assistant: true,
          },
        });

        // Отправляем сообщения модератору, пользователю и ассистенту
        await ctx.reply('Вы присоединились к обсуждению. Все сообщения будут пересылаться между участниками.');

        await sendMessageToUser(
          arbitration.user.telegramId.toString(),
          'Модератор присоединился к обсуждению. Опишите свою проблему.'
        );

        await sendMessageToAssistant(
          arbitration.assistant.telegramId.toString(),
          'Модератор присоединился к обсуждению. Опишите свою проблему.'
        );

      } catch (error) {
        console.error('Ошибка при обработке арбитража:', error);
        await ctx.reply('Произошла ошибка при обработке арбитража.');
      }
    } else if (data.startsWith('arbitration_decision_')) {
      await ctx.answerCallbackQuery();

      const parts = data.split('_');
      const decision = parts[2]; // 'user' или 'assistant'
      const arbitrationId = BigInt(parts[3]);
      const moderatorTelegramId = BigInt(ctx.from?.id || 0);

      if (!moderatorTelegramId) {
        await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
        return;
      }

      try {
        // Находим арбитраж
        const arbitration = await prisma.arbitration.findFirst({
          where: {
            id: arbitrationId,
            moderatorId: moderatorTelegramId,
            status: 'IN_PROGRESS' as ArbitrationStatus,
          },
          include: {
            user: true,
            assistant: true,
          },
        });

        if (!arbitration) {
          await ctx.reply('Арбитраж не найден или уже завершен.');
          return;
        }

        // Определяем новый статус арбитража и решение
        let newStatus: ArbitrationStatus;
        let decisionText = '';

        if (decision === 'user') {
          newStatus = 'REJECTED' as ArbitrationStatus; // Решение в пользу пользователя
          decisionText = 'USER';
        } else if (decision === 'assistant') {
          newStatus = 'ACCEPTED' as ArbitrationStatus; // Решение в пользу ассистента
          decisionText = 'ASSISTANT';
        } else {
          await ctx.reply('Неверное решение.');
          return;
        }

        // Обновляем арбитраж
        await prisma.arbitration.update({
          where: { id: arbitration.id },
          data: {
            status: newStatus,
            decision: decisionText,
          },
        });

        // Обновляем статус ассистента
        await prisma.assistant.update({
          where: { telegramId: arbitration.assistant.telegramId },
          data: { isBusy: false },
        });

        // Отправляем подтверждение модератору
        await ctx.reply('Арбитраж завершён.');

        // Уведомляем участников
        let userMessage = '';
        let assistantMessage = '';

        if (decision === 'user') {
          userMessage = 'Арбитраж завершён в вашу пользу.';
          assistantMessage = 'Арбитраж завершён в пользу пользователя.';
        } else {
          userMessage = 'Арбитраж завершён в пользу ассистента.';
          assistantMessage = 'Арбитраж завершён в вашу пользу.';
        }

        await sendMessageToUser(arbitration.user.telegramId.toString(), userMessage);

        await sendMessageToAssistant(arbitration.assistant.telegramId.toString(), assistantMessage);

      } catch (error) {
        console.error('Ошибка при обработке решения арбитража:', error);
        await ctx.reply('Произошла ошибка при обработке решения арбитража.');
      }
    } else if (data === 'current_arbitrations') {
      // Обработка кнопки "Список текущих арбитражей"
      const lang = detectUserLanguage(ctx);
      await ctx.answerCallbackQuery();

      // Получаем список текущих арбитражей со статусом 'PENDING'
      const arbitrations = await prisma.arbitration.findMany({
        where: {
          status: 'PENDING' as ArbitrationStatus,
        },
        include: {
          user: true,
          assistant: true,
        },
      });

      if (arbitrations.length === 0) {
        await ctx.reply('Нет текущих арбитражей.');
        return;
      }

      // Формируем сообщение со списком арбитражей и кнопками для рассмотрения
      for (const arbitration of arbitrations) {
        const message = `Арбитраж ID: ${arbitration.id}\nПользователь: ${arbitration.user.telegramId}\nАссистент: ${arbitration.assistant.telegramId}\nПричина: ${arbitration.reason}`;
        const keyboard = new InlineKeyboard().text('Рассмотреть', `review_${arbitration.id.toString()}`);

        await ctx.reply(message, { reply_markup: keyboard });
      }
    } else {
      // Обработка неизвестных callback_data
      await ctx.answerCallbackQuery();
      await ctx.reply('Неизвестная команда. Пожалуйста, используйте меню для выбора действия.');
    }
  }
});


adminBot.on('message', async (ctx) => {
  const moderatorTelegramId = BigInt(ctx.from?.id || 0);

  if (!moderatorTelegramId) {
    await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
    return;
  }

  const messageText = ctx.message?.text;
  if (!messageText) {
    await ctx.reply('Пожалуйста, отправьте текстовое сообщение.');
    return;
  }

  // Проверяем наличие активного арбитража
  const arbitration = await prisma.arbitration.findFirst({
    where: {
      moderatorId: moderatorTelegramId,
      status: 'IN_PROGRESS' as ArbitrationStatus,
    },
    include: {
      user: true,
      assistant: true,
    },
  });

  if (!arbitration) {
    await ctx.reply('У вас нет активных арбитражей.');
    return;
  }

  // Формируем сообщение с подписью "Модератор:"
  const messageToSend = `Модератор:\n${messageText}`;

  // Отправляем сообщение пользователю
  await sendMessageToUser(
    arbitration.user.telegramId.toString(),
    messageToSend
  );

  // Отправляем сообщение ассистенту
  await sendMessageToAssistant(
    arbitration.assistant.telegramId.toString(),
    messageToSend
  );
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
    // Обработка сообщений в контексте арбитража уже реализована выше
    return;
  }

  if (currentState === 'awaiting_user_id' || currentState === 'awaiting_assistant_id') {
    const id = ctx.message.text;

    // Проверяем, что ID состоит из цифр и имеет длину от 9 до 10 символов
    if (!/^\d{9,10}$/.test(id)) {
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

export const POST = webhookCallback(adminBot, 'std/http');
