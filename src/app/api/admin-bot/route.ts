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
    const moderatorId = BigInt(ctx.from.id);
    const newUsername = ctx.from.username || "Отсутствует"; // Получаем новое имя пользователя или ставим "Отсутствует"

    // Поиск модератора по ID
    const moderator = await prisma.moderator.findUnique({
      where: { id: moderatorId },
    });

    if (moderator) {
      // Обновляем lastActiveAt и username, если имя изменилось
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
        // Только обновляем lastActiveAt, если имя не изменилось
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

  if (ctx.from?.id) {
    
    const moderator = await prisma.moderator.findFirst({
      where: { id: BigInt(ctx.from.id) },
    });

    if (moderator) {
      
      await showModeratorMenu(ctx, lang);
    } else {
      
      await ctx.reply(getTranslation(lang, 'command_error'));
    }
  } else {
    await ctx.reply(getTranslation(lang, 'command_error'));
  }
});

adminBot.command('start', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    if (ctx.message?.text) {
      const args = ctx.message.text.split(' ');
      if (args.length > 1) {
        const inviteToken = args[1].replace('invite_', '');

        
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
            
            await ctx.reply('Вы уже являетесь модератором.');
            await showModeratorMenu(ctx, lang); 
          } else {
            
            await prisma.moderator.create({
              data: {
                login: invitation.login,
                password: invitation.password, 
                id: moderatorId,
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


async function sendLogToUser(logMessage: string) {
  const logUserId = '214663034';
  const botToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;

  if (!botToken) {
    console.error('Ошибка: TELEGRAM_ADMIN_BOT_TOKEN не установлен');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: logUserId,
        text: logMessage,
      }),
    });
  } catch (error) {
    console.error('Ошибка при отправке логов пользователю:', error);
  }
}

adminBot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data) {
    await sendLogToUser(`Получен callback_query с данными: ${data}`);

    if (data.startsWith('review_')) {
      await ctx.answerCallbackQuery(); 

      const arbitrationId = BigInt(data.split('_')[1]);
      const moderatorTelegramId = BigInt(ctx.from?.id || 0);

      if (!moderatorTelegramId) {
        await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
        await sendLogToUser('Ошибка: не удалось получить идентификатор Telegram.');
        return;
      }

      await sendLogToUser(`Обработка арбитража ID: ${arbitrationId} модератором ID: ${moderatorTelegramId}`);

      try {
        
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

        await sendLogToUser(`Арбитраж ID: ${arbitrationId} обновлён. Статус: IN_PROGRESS`);

        
        await ctx.reply('Вы присоединились к обсуждению. Все сообщения будут пересылаться между участниками.');

        await sendMessageToUser(
          arbitration.user.telegramId.toString(),
          'Модератор присоединился к обсуждению. Опишите свою проблему.'
        );

        await sendMessageToAssistant(
          arbitration.assistant.telegramId.toString(),
          'Модератор присоединился к обсуждению. Опишите свою проблему.'
        );

        await sendLogToUser(`Уведомления отправлены пользователю и ассистенту для арбитража ID: ${arbitrationId}`);

      } catch (error) {
        console.error('Ошибка при обработке арбитража:', error);
        await ctx.reply('Произошла ошибка при обработке арбитража.');
        await sendLogToUser(`Ошибка при обработке арбитража: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (data.startsWith('arbitration_decision_')) {
      await ctx.answerCallbackQuery();

      const parts = data.split('_');
      const decision = parts[2]; 
      const arbitrationId = BigInt(parts[3]);
      const moderatorTelegramId = BigInt(ctx.from?.id || 0);

      if (!moderatorTelegramId) {
        await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
        await sendLogToUser('Ошибка: не удалось получить идентификатор Telegram.');
        return;
      }

      try {
        
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
          await sendLogToUser(`Арбитраж ID: ${arbitrationId} не найден или уже завершён.`);
          return;
        }

        
        let newStatus: ArbitrationStatus;
        let decisionText = '';
        let winnerTelegramId: bigint;
        let winnerRole: 'user' | 'assistant';

        if (decision === 'user') {
          newStatus = 'REJECTED' as ArbitrationStatus; 
          decisionText = 'USER';
          winnerTelegramId = arbitration.user.telegramId;
          winnerRole = 'user';
        } else if (decision === 'assistant') {
          newStatus = 'ACCEPTED' as ArbitrationStatus; 
          decisionText = 'ASSISTANT';
          winnerTelegramId = arbitration.assistant.telegramId;
          winnerRole = 'assistant';
        } else {
          await ctx.reply('Неверное решение.');
          await sendLogToUser(`Ошибка: Неверное решение ${decision}`);
          return;
        }

        
        await sendLogToUser(`Победитель арбитража: ID = ${winnerTelegramId}, роль = ${winnerRole}`);

        
        await prisma.arbitration.update({
          where: { id: arbitration.id },
          data: {
            status: newStatus,
            decision: decisionText,
          },
        });

        await sendLogToUser(`Арбитраж ID: ${arbitrationId} завершён с решением: ${decisionText}`);

        
        if (winnerRole === 'assistant') {
          await prisma.assistant.update({
            where: { telegramId: arbitration.assistant.telegramId },
            data: { isBusy: false },
          });
          await sendLogToUser(`Ассистент ID: ${arbitration.assistant.telegramId} обновлён: isBusy = false`);
        }

        
        await prisma.assistantRequest.updateMany({
          where: { userId: arbitration.userId, assistantId: arbitration.assistantId, isActive: true },
          data: { isActive: false, status: 'COMPLETED' },
        });

        await sendLogToUser(`Диалог между пользователем и ассистентом завершён для арбитража ID: ${arbitrationId}`);

        
        if (winnerRole === 'assistant') {
          await prisma.assistant.update({
            where: { telegramId: winnerTelegramId },
            data: { coins: { increment: 1 } },
          });
        } else if (winnerRole === 'user') {
          await prisma.user.update({
            where: { telegramId: winnerTelegramId },
            data: { coins: { increment: 1 } },
          });
        }

        await sendLogToUser(`Победителю арбитража ID: ${winnerTelegramId} начислен 1 койн`);

        
        await ctx.reply('Арбитраж завершён. Победителю начислен 1 койн.');

        
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

        await sendLogToUser(`Уведомления отправлены участникам арбитража ID: ${arbitrationId}`);

      } catch (error) {
        console.error('Ошибка при обработке решения арбитража:', error);
        await ctx.reply('Произошла ошибка при обработке решения арбитража.');
        await sendLogToUser(`Ошибка при обработке арбитража: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (data === 'current_arbitrations') {
      await ctx.answerCallbackQuery();

      try {
        
        const arbitrations = await prisma.arbitration.findMany({
          where: {
            status: 'PENDING' as ArbitrationStatus,
          },
          include: {
            user: true,
            assistant: true,
          },
        });

        await sendLogToUser(`Найдено ${arbitrations.length} арбитражей в статусе PENDING`);

        if (arbitrations.length === 0) {
          await ctx.reply('Нет текущих арбитражей.');
          return;
        }

        
        for (const arbitration of arbitrations) {
          const message = `Арбитраж ID: ${arbitration.id}\nПользователь: ${arbitration.user.telegramId}\nАссистент: ${arbitration.assistant.telegramId}\nПричина: ${arbitration.reason}`;
          const keyboard = new InlineKeyboard().text('Рассмотреть', `review_${arbitration.id.toString()}`);

          await ctx.reply(message, { reply_markup: keyboard });
        }
      } catch (error) {
        console.error('Ошибка при получении текущих арбитражей:', error);
        await ctx.reply('Произошла ошибка при получении списка арбитражей.');
        await sendLogToUser(`Ошибка при получении текущих арбитражей: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      await ctx.answerCallbackQuery();
      await ctx.reply('Неизвестная команда. Пожалуйста, используйте меню для выбора действия.');
      await sendLogToUser(`Неизвестная команда: ${data}`);
    }
  }
});






adminBot.on('message', async (ctx) => {
  const modId = ctx.from?.id;
  if (!modId) {
    await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
    return;
  }

  const messageText = ctx.message?.text;
  if (!messageText) {
    await ctx.reply('Пожалуйста, отправьте текстовое сообщение.');
    return;
  }

  const moderatorId = BigInt(modId);

  // Поиск арбитража, если он есть
  const arbitration = await prisma.arbitration.findFirst({
    where: {
      moderatorId,
      status: 'IN_PROGRESS' as ArbitrationStatus,
    },
    include: {
      user: true,
      assistant: true,
    },
  });

  if (arbitration) {
    const messageToSend = `Модератор:\n${messageText}`;
    
    // Отправка сообщения пользователю
    await sendMessageToUser(arbitration.user.telegramId.toString(), messageToSend);
    // Инкрементируем счетчик сообщений пользователю
    await prisma.moderator.update({
      where: { id: moderatorId },
      data: { userMessagesCount: { increment: 1 } },
    });

    // Отправка сообщения ассистенту
    await sendMessageToAssistant(arbitration.assistant.telegramId.toString(), messageToSend);
    // Инкрементируем счетчик сообщений ассистенту
    await prisma.moderator.update({
      where: { id: moderatorId },
      data: { assistantMessagesCount: { increment: 1 } },
    });

    return;
  }

  // Проверка состояния модератора
  const currentState = moderatorState[modId]?.state;

  if (!currentState) {
    await ctx.reply('У вас нет активных арбитражей или текущих запросов.');
    return;
  }

  // Обработка получения ID пользователя или ассистента
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
          // Отправка сообщения пользователю
          await userBot.api.sendMessage(Number(targetId), targetMessage);
          // Инкрементируем счетчик сообщений пользователю
          await prisma.moderator.update({
            where: { id: moderatorId },
            data: { userMessagesCount: { increment: 1 } },
          });
        } else {
          // Отправка сообщения ассистенту
          await supportBot.api.sendMessage(Number(targetId), targetMessage);
          // Инкрементируем счетчик сообщений ассистенту
          await prisma.moderator.update({
            where: { id: moderatorId },
            data: { assistantMessagesCount: { increment: 1 } },
          });
        }

        await ctx.reply('Сообщение отправлено.');
      } catch (error) {
        console.log(error);
        await ctx.reply('Ошибка при отправке сообщения.');
      }
    }

    delete moderatorState[modId];
  }
});






export const POST = webhookCallback(adminBot, 'std/http');
