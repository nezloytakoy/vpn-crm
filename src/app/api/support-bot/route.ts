import { Bot, webhookCallback, Context } from 'grammy';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { InputFile } from 'grammy';


const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN not found.');

const bot = new Bot(token);
const prisma = new PrismaClient();

const assistantBot = new Bot(process.env.TELEGRAM_SUPPORT_BOT_TOKEN || "");


type TelegramButton = {
  text: string;
  callback_data: string;
};


async function sendTelegramMessageWithButtons(chatId: string, text: string, buttons: TelegramButton[]) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: buttons.map((button) => [{ text: button.text, callback_data: button.callback_data }]),
      },
    }),
  });
}


async function sendTelegramMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_USER_BOT_TOKEN не установлен');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка отправки сообщения: ${response.statusText}`);
    }

    console.log(`Сообщение успешно отправлено пользователю с ID: ${chatId}`);

    const userTelegramId = BigInt(chatId);


    const activeConversation = await prisma.conversation.findFirst({
      where: {
        userId: userTelegramId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeConversation) {
      const currentTime = new Date();


      if (activeConversation.lastMessageFrom === 'USER' && activeConversation.lastUserMessageAt) {
        const lastUserMessageTime = new Date(activeConversation.lastUserMessageAt).getTime();
        const responseTime = currentTime.getTime() - lastUserMessageTime;

        const responseTimesArray: Prisma.JsonArray = Array.isArray(activeConversation.assistantResponseTimes)
          ? activeConversation.assistantResponseTimes as Prisma.JsonArray
          : [];


        responseTimesArray.push(responseTime);


        const newAssistantMessage = {
          sender: 'ASSISTANT',
          message: text,
          timestamp: currentTime.toISOString(),
        };


        const updatedMessages = [
          ...(activeConversation.messages as Array<{ sender: string; message: string; timestamp: string }>),
          newAssistantMessage,
        ];


        await prisma.conversation.update({
          where: { id: activeConversation.id },
          data: {
            lastMessageFrom: 'ASSISTANT',
            assistantResponseTimes: responseTimesArray,
            messages: updatedMessages,
          },
        });
      } else {

        const newAssistantMessage = {
          sender: 'ASSISTANT',
          message: text,
          timestamp: currentTime.toISOString(),
        };


        const updatedMessages = [
          ...(activeConversation.messages as Array<{ sender: string; message: string; timestamp: string }>),
          newAssistantMessage,
        ];


        await prisma.conversation.update({
          where: { id: activeConversation.id },
          data: {
            lastMessageFrom: 'ASSISTANT',
            messages: updatedMessages,
          },
        });
      }
    } else {
      console.error('Ошибка: активный разговор не найден для пользователя');
    }
  } catch (error) {
    console.error('Ошибка при отправке сообщения пользователю:', error);
  }
}




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
    error_processing_message: "An error occurred while processing your message. Please try again later.",
    active_dialog_exists: "⚠️ You have an active dialog. Please finish it before ending work.",
    assistantRequestMessage: "User request for conversation",
    accept: "Accept",
    reject: "Reject",
    requestSent: "The request has been sent to the assistant.",
    active_requests_list: "📄 Here is the list of active user requests:",
    server_error: "⚠️ An error occurred on the server. Please try again later.",
    no_message: "No message provided.",
    no_assistant_found: "❌ Assistant not found.",
  },
  ru: {
    end_dialog_error: "Ошибка: не удалось получить ваш идентификатор Telegram.",
    no_active_requests: "⚠️ Активные запросы отсутствуют.",
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
    error_processing_message: "Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.",
    active_dialog_exists: "⚠️ У вас есть активный диалог. Пожалуйста, завершите его перед тем, как закончить работу.",
    assistantRequestMessage: "Запрос пользователя на разговор",
    accept: "Принять",
    reject: "Отклонить",
    requestSent: "Запрос отправлен ассистенту.",
    active_requests_list: "📄 Вот список активных запросов пользователей:",
    server_error: "⚠️ На сервере произошла ошибка. Пожалуйста, попробуйте позже.",
    no_message: "Сообщение отсутствует.",
    no_assistant_found: "❌ Ассистент не найден.",
  },
};



const detectUserLanguage = (ctx: Context) => {
  const userLang = ctx.from?.language_code;
  return userLang === 'ru' ? 'ru' : 'en';
};


async function getAssistantPenaltyPoints(assistantId: bigint) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const actions = await prisma.requestAction.findMany({
    where: {
      assistantId: assistantId,
      createdAt: {
        gte: yesterday,
      },
    },
  });

  let penaltyPoints = 0;
  for (const action of actions) {
    if (action.action === 'REJECTED') {
      penaltyPoints += 1;
    } else if (action.action === 'IGNORED') {
      penaltyPoints += 3;
    }
  }

  return penaltyPoints;
}


async function findNewAssistant(requestId: bigint, ignoredAssistants: bigint[]) {

  const availableAssistants = await prisma.assistant.findMany({
    where: {
      isWorking: true,
      telegramId: {
        notIn: ignoredAssistants,
      },
    },
  });


  const assistantsWithPenalty = await Promise.all(
    availableAssistants.map(async (assistant) => {
      const penaltyPoints = await getAssistantPenaltyPoints(assistant.telegramId);
      return { ...assistant, penaltyPoints };
    })
  );


  assistantsWithPenalty.sort((a, b) => {
    if (a.penaltyPoints === b.penaltyPoints) {

      return (b.lastActiveAt?.getTime() || 0) - (a.lastActiveAt?.getTime() || 0);
    }
    return a.penaltyPoints - b.penaltyPoints;
  });


  const selectedAssistant = assistantsWithPenalty[0];


  if (!selectedAssistant) {
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: { ignoredAssistants: [] },
    });
    return findNewAssistant(requestId, []);
  }

  return selectedAssistant;
}


async function checkAssistantBlockStatus(ctx: Context) {
  if (!ctx.from?.id) {
    console.log("Пользовательский ID отсутствует в контексте.");
    return;
  }

  const telegramId = BigInt(ctx.from.id);
  console.log(`Проверка блокировки для пользователя с ID: ${telegramId.toString()}`);

  const assistant = await prisma.assistant.findUnique({
    where: { telegramId },
    select: { isBlocked: true, unblockDate: true },
  });

  if (!assistant) {
    console.log(`Пользователь с ID: ${telegramId.toString()} не найден в базе.`);
    return false;
  }

  console.log(
    `Данные ассистента: isBlocked=${assistant.isBlocked}, unblockDate=${assistant.unblockDate}`
  );

  if (assistant.isBlocked && assistant.unblockDate) {
    const currentTime = new Date();
    console.log(`Текущее время: ${currentTime.toISOString()}`);
    console.log(`Дата разблокировки: ${assistant.unblockDate.toISOString()}`);

    const remainingTime = Math.ceil(
      (assistant.unblockDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60)
    );

    console.log(`Оставшееся время блокировки: ${remainingTime}ч`);

    if (remainingTime > 0) {
      console.log(`Пользователь ${telegramId.toString()} ещё заблокирован. Оставшееся время: ${remainingTime}ч`);

      await ctx.reply(
        `Вы заблокированы администратором, до разблокировки осталось ${remainingTime}ч.`
      );
      return true;
    } else {
      console.log(
        `Время блокировки для пользователя ${telegramId.toString()} истекло. Снимаем блокировку.`
      );

      await prisma.assistant.update({
        where: { telegramId },
        data: { isBlocked: false, unblockDate: null },
      });

      console.log(
        `Блокировка пользователя ${telegramId.toString()} успешно снята в базе данных.`
      );

      await ctx.reply(
        "Время блокировки вышло, вы можете продолжать пользоваться ботом."
      );
    }
  } else {
    console.log(`Пользователь ${telegramId.toString()} не заблокирован.`);
  }

  return false;
}

bot.use(async (ctx, next) => {
  console.log("Запуск промежуточного слоя для проверки блокировки.");
  const isBlocked = await checkAssistantBlockStatus(ctx);

  if (isBlocked) {
    console.log("Пользователь заблокирован. Останавливаем обработку.");
    return;
  }

  console.log("Пользователь не заблокирован. Продолжаем выполнение.");
  await next();
});


bot.command('requests', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    // Проверяем, является ли отправитель ассистентом
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId },
    });

    if (!assistant) {
      await ctx.reply(getTranslation(lang, 'no_assistant_found'));
      return;
    }

    // Получаем активные беседы для текущего ассистента
    const activeConversations = await prisma.conversation.findMany({
      where: {
        assistantId: telegramId,
        status: 'IN_PROGRESS',
      },
      include: {
        assistantRequest: true,
      },
    });

    if (activeConversations.length === 0) {
      await ctx.reply(getTranslation(lang, 'no_active_requests'));
      return;
    }

    // Формируем кнопки для каждого активного запроса
    const inlineKeyboard = activeConversations.map((conversation) => {
      const subject = conversation.assistantRequest.subject || getTranslation(lang, 'no_message');
      const timeRemaining = calculateTimeRemaining(conversation.createdAt);
      return [
        {
          text: `Запрос: ${subject} | Осталось: ${timeRemaining}`,
          callback_data: `activate_${conversation.id}`,
        },
      ];
    });

    await ctx.reply(getTranslation(lang, 'active_requests_list'), {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    await ctx.reply(getTranslation(lang, 'server_error'));
  }
});

function calculateTimeRemaining(createdAt: Date): string {
  const maxDuration = 60 * 60 * 1000; // 60 минут
  const timePassed = Date.now() - createdAt.getTime();
  const timeLeft = maxDuration - timePassed;

  if (timeLeft <= 0) {
    return 'время истекло';
  }

  const minutes = Math.floor(timeLeft / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

  return `${minutes}м ${seconds}с`;
}


bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery?.data;

  if (data?.startsWith('activate_')) {
    const requestId = BigInt(data.split('_')[1]);
    const assistantId = BigInt(ctx.from?.id);

    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: assistantId },
    });

    if (!assistant) {
      await ctx.answerCallbackQuery({ text: 'Assistant not found', show_alert: true });
      return;
    }

    const request = await prisma.assistantRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request || request.assistantId !== assistantId) {
      await ctx.answerCallbackQuery({ text: 'Request not found or not assigned to you', show_alert: true });
      return;
    }

    // Активируем выбранный запрос для ассистента
    await prisma.assistant.update({
      where: { telegramId: assistantId },
      data: { activeRequestId: requestId },
    });

    await ctx.answerCallbackQuery({ text: `Активирован запрос с темой: ${request.subject}` });
    await ctx.reply(`Вы сейчас общаетесь с пользователем: ${request.user.username || request.userId}`);
  }
});



bot.command('end_work', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(detectUserLanguage(ctx), 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const lang = detectUserLanguage(ctx);

    // Проверяем, есть ли активный диалог
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        assistantId: telegramId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeConversation) {
      await ctx.reply(getTranslation(lang, 'active_dialog_exists'));
      return;
    }

    // Получаем ассистента
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: telegramId },
    });

    if (!assistant) {
      console.error(`Assistent not found with telegramId: ${telegramId}`);
      await ctx.reply(getTranslation(lang, 'no_assistant_found'));
      return;
    }

    if (!assistant.isWorking) {
      await ctx.reply(getTranslation(lang, 'no_working_status'));
      return;
    }

    // Завершаем активную сессию, если есть
    const activeSession = await prisma.assistantSession.findFirst({
      where: {
        assistantId: telegramId,
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (activeSession) {
      await prisma.assistantSession.update({
        where: { id: activeSession.id },
        data: { endedAt: new Date() },
      });
    } else {
      console.warn(`No active session found for assistant ${telegramId}`);
    }

    // Обновляем статус isWorking на false
    await prisma.assistant.update({
      where: { telegramId: telegramId },
      data: { isWorking: false },
    });

    await ctx.reply(getTranslation(lang, 'end_work'));
  } catch (error) {
    console.error('Error ending work:', error);
    await ctx.reply(getTranslation(detectUserLanguage(ctx), 'end_dialog_error'));
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
        const username = ctx.from.username || null;


        const userProfilePhotos = await ctx.api.getUserProfilePhotos(ctx.from.id);

        let avatarFileId: string | null = null;

        if (userProfilePhotos.total_count > 0) {

          const photos = userProfilePhotos.photos[0];

          const largestPhoto = photos[photos.length - 1];

          avatarFileId = largestPhoto.file_id;
        } else {
          console.log('У ассистента нет аватарки.');
        }


        const lastAssistant = await prisma.assistant.findFirst({
          orderBy: { orderNumber: 'desc' },
          select: { orderNumber: true },
        });

        const nextOrderNumber = lastAssistant?.orderNumber ? lastAssistant.orderNumber + 1 : 1;


        await prisma.assistant.create({
          data: {
            telegramId: telegramId,
            username: username,
            role: invitation.role,
            orderNumber: nextOrderNumber,
            avatarFileId: avatarFileId,
          },
        });


        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { used: true },
        });


        await ctx.reply(getTranslation(lang, 'assistant_congrats'));


        await prisma.assistant.update({
          where: { telegramId: telegramId },
          data: { lastActiveAt: new Date() },
        });
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

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);


    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: telegramId },
    });

    if (!assistant) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }


    await prisma.assistant.update({
      where: { telegramId: telegramId },
      data: { lastActiveAt: new Date() },
    });


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
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('Error showing menu:', errorMessage);
  }
});

bot.on('callback_query:data', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    const telegramId = BigInt(ctx.from.id);
    const data = ctx.callbackQuery?.data;

    if (data.startsWith('accept_') || data.startsWith('reject_')) {
      const [action, requestId] = data.split('_');

      if (action === 'accept') {
        await handleAcceptRequest(requestId, telegramId, ctx);
      } else if (action === 'reject') {
        await handleRejectRequest(requestId, telegramId, ctx);
      }

      return;
    }

    if (data === 'start_work') {
      const assistant = await prisma.assistant.findUnique({ where: { telegramId: telegramId } });

      if (assistant?.isWorking) {
        await ctx.reply(getTranslation(lang, 'already_working'));
        return;
      }


      const pendingRequest = await prisma.assistantRequest.findFirst({
        where: {
          status: 'PENDING',
        },
      });

      if (pendingRequest) {

        await prisma.assistantRequest.update({
          where: { id: pendingRequest.id },
          data: { assistantId: telegramId, status: 'IN_PROGRESS' },
        });


        await sendTelegramMessageWithButtons(
          telegramId.toString(),
          getTranslation(lang, 'assistantRequestMessage'),
          [
            { text: getTranslation(lang, 'accept'), callback_data: `accept_${pendingRequest.id}` },
            { text: getTranslation(lang, 'reject'), callback_data: `reject_${pendingRequest.id}` },
          ]
        );

        return;
      }


      await prisma.assistant.update({
        where: { telegramId: telegramId },
        data: { isWorking: true },
      });


      await prisma.assistantSession.create({
        data: {
          assistantId: telegramId,

        },
      });

      await ctx.reply(getTranslation(lang, 'work_started'));
      return;
    } else if (data === 'my_coins') {

      const assistant = await prisma.assistant.findUnique({
        where: { telegramId: telegramId },
      });

      if (assistant) {
        const coinsMessage = `${getTranslation(lang, 'my_coins')}: ${assistant.coins}`;


        await ctx.reply(coinsMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Запросить вывод', callback_data: 'request_withdrawal' }],
            ],
          },
        });
      } else {
        await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      }
    } else if (data === 'my_activity') {

      const stats = await getAssistantActivity(telegramId);

      const activityMessage = `
        📊 Моя активность:
        - Всего диалогов: ${stats.totalConversations}
        - Диалогов за последние сутки: ${stats.conversationsLast24Hours}
        - Пропусков за последние сутки: ${stats.ignoredRequests}
        - Отказов за последние сутки: ${stats.rejectedRequests}
        - Жалоб за последние сутки: ${stats.complaintsLast24Hours}
      `;


      await ctx.reply(activityMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Лимиты', callback_data: 'view_limits' }],
          ],
        },
      });
    } else if (data === 'request_withdrawal') {

      const assistant = await prisma.assistant.findUnique({
        where: { telegramId: telegramId },
      });

      if (assistant) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);


        const pendingComplaints = await prisma.complaint.count({
          where: {
            assistantId: assistant.telegramId,
            status: 'PENDING',
          },
        });

        if (pendingComplaints > 0) {
          await ctx.reply('Пользователь написал на вас жалобу, вы не можете сделать вывод, пока она не будет рассмотрена.');
          return;
        }


        const rejectedActions = await prisma.requestAction.count({
          where: {
            assistantId: assistant.telegramId,
            action: 'REJECTED',
            createdAt: {
              gte: yesterday,
            },
          },
        });

        const ignoredActions = await prisma.requestAction.count({
          where: {
            assistantId: assistant.telegramId,
            action: 'IGNORED',
            createdAt: {
              gte: yesterday,
            },
          },
        });


        if (rejectedActions > 10 || ignoredActions > 3) {
          await ctx.reply('Ваш баланс заморожен на 24 часа за низкую активность.');
          return;
        }

        const withdrawalAmount = assistant.coins;


        await ctx.reply('Запрос на вывод отправлен.');


        await prisma.withdrawalRequest.create({
          data: {
            userId: assistant.telegramId,
            userNickname: ctx.from?.username || null,
            userRole: 'assistant',
            amount: withdrawalAmount,
          },
        });

        await ctx.reply('Ваш запрос на вывод успешно создан.');
      } else {
        await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      }
    } else if (data === 'view_limits') {

      await ctx.reply(
        `Если пропуски запросов за сутки будет больше 3 или отказов больше 10, то ваша активность снизится и вы получите заморозку до 24 часов. 
        Вывод коинов будет недоступен за это время. Получение жалобы также приостанавливает вывод коинов до того как ситуация не будет разрешена.`
      );
    }
  } else {
    await ctx.reply(getTranslation(lang, 'end_dialog_error'));
  }
});




async function getAssistantActivity(assistantId: bigint) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);


  const totalConversations = await prisma.conversation.count({
    where: { assistantId: assistantId },
  });


  const conversationsLast24Hours = await prisma.conversation.count({
    where: {
      assistantId: assistantId,
      createdAt: {
        gte: yesterday,
      },
    },
  });


  const ignoredRequests = await prisma.requestAction.count({
    where: {
      assistantId: assistantId,
      action: 'IGNORED',
      createdAt: {
        gte: yesterday,
      },
    },
  });


  const rejectedRequests = await prisma.requestAction.count({
    where: {
      assistantId: assistantId,
      action: 'REJECTED',
      createdAt: {
        gte: yesterday,
      },
    },
  });


  const complaintsLast24Hours = await prisma.complaint.count({
    where: {
      assistantId: assistantId,
      createdAt: {
        gte: yesterday,
      },
    },
  });

  return {
    totalConversations,
    conversationsLast24Hours,
    ignoredRequests,
    rejectedRequests,
    complaintsLast24Hours,
  };
}


async function handleAcceptRequest(requestId: string, assistantTelegramId: bigint, ctx: Context) {
  try {
    const assistantRequest = await prisma.assistantRequest.update({
      where: { id: BigInt(requestId) },
      data: { status: 'IN_PROGRESS', isActive: true },
      include: { user: true },
    });



    const existingConversation = await prisma.conversation.findFirst({
      where: { requestId: assistantRequest.id, status: 'ABORTED' },
    });

    if (existingConversation) {

      await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: {
          assistantId: assistantTelegramId,
          messages: [],
          status: 'IN_PROGRESS',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageFrom: '',
          assistantResponseTimes: [],
          lastUserMessageAt: null,
        },
      });

      await ctx.reply('✅ Вы приняли запрос.');

      await sendTelegramMessageToUser(
        assistantRequest.user.telegramId.toString(),
        'Ассистент присоединился к чату. Сформулируйте свой вопрос.'
      );
    } else {

      await prisma.conversation.create({
        data: {
          userId: assistantRequest.userId,
          assistantId: assistantTelegramId,
          requestId: assistantRequest.id,
          messages: [],
          status: 'IN_PROGRESS',
          lastMessageFrom: 'USER',
        },
      });

      await ctx.reply('✅ Вы приняли запрос. Ожидайте вопрос пользователя.');

      await sendTelegramMessageToUser(
        assistantRequest.user.telegramId.toString(),
        'Ассистент присоединился к чату. Сформулируйте свой вопрос.'
      );
    }
  } catch (error) {
    console.error('Ошибка при принятии запроса:', error);
    await ctx.reply('❌ Другой ассистент уже принял запрос.');
  }
}

async function handleRejectRequest(requestId: string, assistantTelegramId: bigint, ctx: Context) {
  try {
    const edges = await prisma.edges.findFirst();
    const maxRejects = edges ? edges.maxRejects : 7;

    const rejectCount = await prisma.requestAction.count({
      where: {
        assistantId: assistantTelegramId,
        action: 'REJECTED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (rejectCount >= maxRejects) {
      await prisma.assistant.update({
        where: { telegramId: assistantTelegramId },
        data: {
          isBlocked: true,
          unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await ctx.reply('🚫 Вы превысили лимит отказов и были заблокированы на 24 часа.');
      return;
    }

    const assistantRequest = await prisma.assistantRequest.findUnique({
      where: { id: BigInt(requestId) },
      include: { conversation: true },
    });

    const ignoredAssistants = assistantRequest?.ignoredAssistants || [];
    ignoredAssistants.push(assistantTelegramId);

    if (assistantRequest?.conversation) {
      await prisma.conversation.update({
        where: { id: assistantRequest.conversation.id },
        data: { status: 'ABORTED' },
      });
    }

    // Сохраняем действие отклонения
    await prisma.requestAction.create({
      data: {
        requestId: BigInt(requestId),
        assistantId: assistantTelegramId,
        action: 'REJECTED',
      },
    });

    // Обновляем статус запроса и добавляем игнорируемого ассистента
    await prisma.assistantRequest.update({
      where: { id: BigInt(requestId) },
      data: {
        status: 'PENDING',
        isActive: true,
        assistantId: null,
        ignoredAssistants,
      },
    });

    // Находим нового ассистента
    const newAssistant = await findNewAssistant(BigInt(requestId), ignoredAssistants);

    if (newAssistant) {
      // Обновляем запрос с новым ассистентом
      await prisma.assistantRequest.update({
        where: { id: BigInt(requestId) },
        data: {
          assistantId: newAssistant.telegramId,
        },
      });

      // Обрабатываем поле subject и отправляем только одно сообщение
      if (assistantRequest?.subject) {
        const caption = 'Тема запроса от пользователя';
        if (assistantRequest.subject.startsWith('http')) {
          // Отправляем медиа (фото, видео, голосовое сообщение)
          await sendTelegramMediaToAssistant(
            newAssistant.telegramId.toString(),
            assistantRequest.subject,
            caption
          );
        } else {
          // Отправляем текст без кнопок
          await sendTelegramMessageWithButtons(
            newAssistant.telegramId.toString(),
            `Тема запроса: ${assistantRequest.subject}`,
            []
          );
        }
      }

      // Отправляем основное сообщение с кнопками
      await sendTelegramMessageWithButtons(
        newAssistant.telegramId.toString(),
        assistantRequest?.message || 'Новое сообщение от пользователя',
        [
          { text: getTranslation('en', 'accept'), callback_data: `accept_${requestId}` },
          { text: getTranslation('en', 'reject'), callback_data: `reject_${requestId}` },
        ]
      );

      await ctx.reply('❌ Вы отклонили запрос. Новый ассистент уведомлен.');
    } else {
      await ctx.reply('❌ Вы отклонили запрос, но доступных ассистентов больше нет.');
    }

  } catch (error) {
    console.error('Ошибка при отклонении запроса:', error);
    await ctx.reply('❌ Произошла ошибка при отклонении запроса.');
  }
}




// Общая функция для отправки медиа ассистенту
async function sendTelegramMediaToAssistant(userId: string, mediaUrl: string, caption: string): Promise<void> {
  try {
    if (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.png')) {
      await sendPhoto(userId, mediaUrl, caption);
    } else if (mediaUrl.endsWith('.mp4')) {
      await sendVideo(userId, mediaUrl, caption);
    } else if (mediaUrl.endsWith('.ogg') || mediaUrl.endsWith('.mp3')) {
      await sendVoice(userId, mediaUrl);
    } else {
      console.error('Unsupported media type:', mediaUrl);
    }
  } catch (error) {
    console.error("Error sending media to assistant:", error);
    throw error;
  }
}


async function sendPhoto(userId: string, mediaUrl: string, caption: string): Promise<void> {
  try {
    // Загрузка изображения
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Отправка изображения
    await assistantBot.api.sendPhoto(userId, new InputFile(buffer), { caption });
    console.log(`Photo sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending photo:', error);
  }
}

// Функция для отправки видео
async function sendVideo(userId: string, mediaUrl: string, caption: string) {
  try {
    await assistantBot.api.sendVideo(userId, mediaUrl, { caption });
    console.log(`Video sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending video:', error);
  }
}

// Функция для отправки голосового сообщения
async function sendVoice(userId: string, mediaUrl: string) {
  try {
    console.log(`sendVoice: Preparing to send voice message to assistant ${userId}`);
    console.log(`Media URL: ${mediaUrl}`);

    // Загрузка голосового сообщения
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const voiceBuffer = Buffer.from(response.data, 'binary');
    const fileName = 'voice.ogg'; // Фиксированное имя файла для голосовых сообщений

    console.log(`Sending voice message to assistant ${userId}`);
    await sendFileToAssistant(userId, voiceBuffer, fileName);

    console.log(`Voice message successfully sent to assistant ${userId}`);
  } catch (error) {
    console.error(`Error sending voice message to assistant ${userId}:`, error);
  }
}

// Функция для отправки файла ассистенту
async function sendFileToAssistant(assistantChatId: string, fileBuffer: Buffer, fileName: string) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const assistantBot = new Bot(botToken);

  try {
    await assistantBot.api.sendDocument(assistantChatId, new InputFile(fileBuffer, fileName));
    console.log(`File sent to assistant: ${assistantChatId}`);
  } catch (error) {
    console.error('Ошибка при отправке файла ассистенту:', error);
  }
}




const SESSION_DURATION = 60; // Длительность сессии в минутах

bot.on('message', async (ctx) => {
  try {
    const lang = detectUserLanguage(ctx);

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const assistantTelegramId = BigInt(ctx.from.id);
    const assistantMessage = ctx.message?.text;

    if (!assistantMessage) {
      await ctx.reply(getTranslation(lang, 'send_message_error'));
      return;
    }

    // Поиск активного разговора вместо запроса
    const [activeConversation] = await Promise.all([
      prisma.conversation.findFirst({
        where: {
          assistant: { telegramId: assistantTelegramId },
          status: 'IN_PROGRESS',
        },
        include: { user: true },
      }),
    ]);

    if (activeConversation) {
      // Вычисление оставшегося времени
      const conversationStartTime = new Date(activeConversation.createdAt);
      const currentTime = new Date();
      const elapsedMinutes = Math.floor((currentTime.getTime() - conversationStartTime.getTime()) / 60000);
      const remainingMinutes = Math.max(SESSION_DURATION - elapsedMinutes, 0);

      // Формирование сообщения с информацией о времени
      const responseMessage = `
${assistantMessage}
--------------------------------
До конца сеанса осталось ${remainingMinutes} минут
      `;

      await sendTelegramMessageToUser(
        activeConversation.user.telegramId.toString(),
        responseMessage
      );
    } else {
      await ctx.reply(getTranslation(lang, 'no_user_requests'));
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения от ассистента:', error);
    await ctx.reply(getTranslation(detectUserLanguage(ctx), 'error_processing_message'));
  }
});


export const POST = webhookCallback(bot, 'std/http');
