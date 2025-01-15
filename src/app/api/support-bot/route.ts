import { Bot, webhookCallback, Context, InlineKeyboard } from 'grammy';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { InputFile } from 'grammy';


const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN not found.');

const bot = new Bot(token);
const prisma = new PrismaClient();

const assistantBot = new Bot(process.env.TELEGRAM_SUPPORT_BOT_TOKEN || "");

const userBot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);


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
    request_not_found_or_not_assigned: "❌ Request not found or not assigned to you.",
    activated_request_with_subject: "Activated request with subject",
    now_chatting_with_user: "Now chatting with user",
    request_withdrawal: "Request withdrawal",
    total_conversations: "Total conversations",
    conversations_last_24_hours: "Conversations in the last 24 hours",
    ignored_requests: "Ignored requests",
    rejected_requests: "Rejected requests",
    complaints_last_24_hours: "Complaints in the last 24 hours",
    view_limits: "View limits",
    complaint_pending: "Complaint is pending. You cannot withdraw until it is resolved.",
    balance_frozen: "Your balance is frozen for 24 hours due to low activity.",
    withdrawal_request_sent: "Withdrawal request sent.",
    withdrawal_request_created: "Your withdrawal request has been created successfully.",
    limits_info: "If skipped requests exceed 3 or rejections exceed 10 in a day, your activity will decrease, and your balance will be frozen for 24 hours. Complaints also pause withdrawals until resolved.",
    unknown_action: "Unknown action.",
    topic: "Topic",
    no_subject: "No subject",

    blocked_until: "You are blocked by the administrator, you will be unblocked in %time%h.",
    block_time_expired: "The block time has expired, you can continue using the bot.",
    blocked_permanently: "You have been blocked by the administrator with no set unblock date.",
    request_with_time: "Request %id%: %subject% | Remaining: %time%",
    request_subject: "Request subject: %subject%",
    new_user_message: "New message from the user",
    no_more_assistants: "The connection with the assistant was lost, and there are no more assistants available.",
    reassign_request_error: "❌ An error occurred while reassigning the request.",
    end_work_confirm: "End work",
    end_work_cancel: "Return to work",
    active_dialogs_blocking_warning: "You have active dialogs. If you end work, you will not receive coins and will be blocked until reviewed by the administrator. End work?",
    work_finished_blocked: "Work finished. You will not receive a reward and your account will be blocked until reviewed by the administration.",
    assistant_lost_connecting_new: "Connection with the assistant lost, connecting another assistant...",
    accept_request_confirm: "✅ You have accepted the request.",
    assistant_joined_chat: "The assistant has joined the chat. Please formulate your question.",
    request_already_in_progress: "❌ This request is already in progress or has been completed.",
    another_assistant_accepted: "❌ Another assistant has already accepted the request.",
    exceeded_reject_limit: "🚫 You have exceeded the rejection limit and have been blocked for 24 hours.",
    request_subject_from_user: "User request subject",
    request_subject_prefix: "Request subject: %subject%",
    rejected_request_reassigned: "❌ You have rejected the request. A new assistant has been notified.",
    rejected_request_no_assistants: "❌ You have rejected the request, but there are no more assistants available.",
    rejected_request_error: "❌ An error occurred while rejecting the request.",
    session_time_remaining: "--------------------------------\n%minutes% minutes remain until the end of the session",

    // Добавленный новый ключ:
    assistant_declined_extension: "The assistant declined the session extension."
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
    work_started: "🚀 Работа начата! Чтобы завершить работу, используйте команду /offline.",
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
    request_not_found_or_not_assigned: "❌ Запрос не найден или не назначен вам.",
    activated_request_with_subject: "Активирован запрос с темой",
    now_chatting_with_user: "Сейчас общаетесь с пользователем",
    request_withdrawal: "Запросить вывод",
    total_conversations: "Всего диалогов",
    conversations_last_24_hours: "Диалогов за последние 24 часа",
    ignored_requests: "Пропущено запросов",
    rejected_requests: "Отклонено запросов",
    complaints_last_24_hours: "Жалобы за последние 24 часа",
    view_limits: "Просмотреть лимиты",
    complaint_pending: "На вас написана жалоба. Вывод недоступен, пока она не будет решена.",
    balance_frozen: "Ваш баланс заморожен на 24 часа из-за низкой активности.",
    withdrawal_request_sent: "Запрос на вывод отправлен.",
    withdrawal_request_created: "Ваш запрос на вывод успешно создан.",
    limits_info: "Если за сутки вы пропустите более 3 запросов или отклоните более 10, ваша активность снизится, и баланс заморозится на 24 часа. Жалобы также временно блокируют вывод до их решения.",
    unknown_action: "Неизвестное действие.",
    topic: "Тема",
    no_subject: "отсутствует",

    blocked_until: "Вы заблокированы администратором, до разблокировки осталось %time%ч.",
    block_time_expired: "Время блокировки вышло, вы можете продолжать пользоваться ботом.",
    blocked_permanently: "Вы заблокированы администратором без срока разблокировки.",
    request_with_time: "Запрос %id%: %subject% | Осталось: %time%",
    request_subject: "Тема запроса: %subject%",
    new_user_message: "Новое сообщение от пользователя",
    no_more_assistants: "Связь с ассистентом потеряна, но доступных ассистентов больше нет.",
    reassign_request_error: "❌ Произошла ошибка при переназначении запроса.",
    end_work_confirm: "Завершить работу",
    end_work_cancel: "Вернуться к работе",
    active_dialogs_blocking_warning: "У вас есть активные диалоги. Если вы завершите работу, вы не получите коинов и будете заблокированы до рассмотрения администратором. Завершить работу?",
    work_finished_blocked: "Работа завершена. Вы не получите вознаграждение и ваш аккаунт заблокирован до рассмотрения администрацией.",
    assistant_lost_connecting_new: "Связь с ассистентом потеряна, подключаем другого ассистента...",
    accept_request_confirm: "✅ Вы приняли запрос.",
    assistant_joined_chat: "Ассистент присоединился к чату. Сформулируйте свой вопрос.",
    request_already_in_progress: "❌ Этот запрос уже в работе или завершен.",
    another_assistant_accepted: "❌ Другой ассистент уже принял запрос.",
    exceeded_reject_limit: "🚫 Вы превысили лимит отказов и были заблокированы на 24 часа.",
    request_subject_from_user: "Тема запроса от пользователя",
    request_subject_prefix: "Тема запроса: %subject%",
    rejected_request_reassigned: "❌ Вы отклонили запрос. Новый ассистент уведомлен.",
    rejected_request_no_assistants: "❌ Вы отклонили запрос, но доступных ассистентов больше нет.",
    rejected_request_error: "❌ Произошла ошибка при отклонении запроса.",
    session_time_remaining: "--------------------------------\nДо конца сеанса осталось %minutes% минут",

    // Добавленный новый ключ:
    assistant_declined_extension: "Ассистент отклонил продление диалога."
  }
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

  const lang = detectUserLanguage(ctx);

  if (assistant.isBlocked) {
    // Если ассистент заблокирован
    if (assistant.unblockDate) {
      // Ассистент заблокирован до определённого времени
      const currentTime = new Date();
      console.log(`Текущее время: ${currentTime.toISOString()}`);
      console.log(`Дата разблокировки: ${assistant.unblockDate.toISOString()}`);

      const remainingTime = Math.ceil(
        (assistant.unblockDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60)
      );

      console.log(`Оставшееся время блокировки: ${remainingTime}ч`);



      if (remainingTime > 0) {
        console.log(`Пользователь ${telegramId.toString()} ещё заблокирован. Оставшееся время: ${remainingTime}ч`);
        await ctx.reply(getTranslation(lang, 'blocked_until').replace('{{time}}', String(remainingTime)));

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

        await ctx.reply(getTranslation(lang, 'block_time_expired'));
      }
    } else {
      // Ассистент заблокирован навсегда (unblockDate = null)
      console.log(`Пользователь ${telegramId.toString()} заблокирован без срока разблокировки.`);
      await ctx.reply(getTranslation(lang, 'blocked_permanently'));
      return true;
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

        // Получаем фото профиля (если есть)
        const userProfilePhotos = await ctx.api.getUserProfilePhotos(ctx.from.id);

        let avatarFileId: string | null = null;

        if (userProfilePhotos.total_count > 0) {
          // Берём первую "группу" фотографий
          const photos = userProfilePhotos.photos[0];
          // Берём самое большое (последний элемент массива)
          const largestPhoto = photos[photos.length - 1];

          // Получаем file_path через ctx.api.getFile(...)
          const fileObj = await ctx.api.getFile(largestPhoto.file_id);

          // Формируем полный URL для скачивания
          // Убедитесь, что process.env.TELEGRAM_SUPPORT_BOT_TOKEN 
          // действительно содержит токен вашего ассистент-бота
          const fullAvatarUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_SUPPORT_BOT_TOKEN}/${fileObj.file_path}`;

          // Сохраняем именно URL в avatarFileId (или можно переименовать поле в avatarUrl)
          avatarFileId = fullAvatarUrl;

        } else {
          console.log('У ассистента нет аватарки.');
        }

        // Определяем следующий orderNumber для ассистента
        const lastAssistant = await prisma.assistant.findFirst({
          orderBy: { orderNumber: 'desc' },
          select: { orderNumber: true },
        });

        const nextOrderNumber = lastAssistant?.orderNumber
          ? lastAssistant.orderNumber + 1
          : 1;

        // Создаём нового ассистента
        await prisma.assistant.create({
          data: {
            telegramId,
            username,
            role: invitation.role,
            orderNumber: nextOrderNumber,
            avatarFileId, // <-- тут сохраняем сформированный URL
          },
        });

        // Отмечаем приглашение как использованное
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { used: true },
        });

        // Отправляем приветственное сообщение ассистенту
        await ctx.reply(getTranslation(lang, 'assistant_congrats'));

        // Обновляем lastActiveAt
        await prisma.assistant.update({
          where: { telegramId },
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
    // Если нет invite-токена, просто выводим стандартное сообщение
    await ctx.reply(getTranslation(lang, 'start_message'));
  }
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

    // Формируем кнопки для каждого активного запроса, используя реальный ID запроса
    const inlineKeyboard = activeConversations.map((conversation) => {
      const subject = conversation.assistantRequest.subject || getTranslation(lang, 'no_message');
      const timeRemaining = calculateTimeRemaining(conversation.createdAt);
      const text = getTranslation(lang, 'request_with_time')
        .replace('%id%', conversation.assistantRequest.id.toString())
        .replace('%subject%', subject)
        .replace('%time%', timeRemaining);

      return [
        {
          text,
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

async function reassignRequest(requestId: bigint, blockedAssistantId: bigint, ctx: Context) {
  try {
    const assistantRequest = await prisma.assistantRequest.findUnique({
      where: { id: requestId },
      include: { conversation: true },
    });

    const ignoredAssistants = assistantRequest?.ignoredAssistants || [];
    if (!ignoredAssistants.includes(blockedAssistantId)) {
      ignoredAssistants.push(blockedAssistantId);
    }

    // Обновляем статус разговора на ABORTED, так как связь потеряна
    if (assistantRequest?.conversation) {
      await prisma.conversation.update({
        where: { id: assistantRequest.conversation.id },
        data: { status: 'ABORTED' },
      });
    }

    // Переводим запрос в режим ожидания другого ассистента
    await prisma.assistantRequest.update({
      where: { id: requestId },
      data: {
        status: 'PENDING',
        isActive: true,
        assistantId: null,
        ignoredAssistants,
      },
    });

    // Находим нового ассистента
    const newAssistant = await findNewAssistant(requestId, ignoredAssistants);

    // Получаем userId пользователя, которому нужно отправить сообщение
    const userId = assistantRequest?.conversation?.userId;

    if (!userId) {
      console.error('User ID not found in the conversation. Cannot send a message to user.');
      return;
    }

    if (newAssistant) {
      // Обновляем запрос с новым ассистентом
      await prisma.assistantRequest.update({
        where: { id: requestId },
        data: {
          assistantId: newAssistant.telegramId,
        },
      });

      const lang = detectUserLanguage(ctx);

      // Отправляем тему запроса или медиа новому ассистенту (если есть)
      if (assistantRequest?.subject) {
        const caption = 'Тема запроса от пользователя';
        if (assistantRequest.subject.startsWith('http')) {
          // Отправляем медиа
          await sendTelegramMediaToAssistant(
            newAssistant.telegramId.toString(),
            assistantRequest.subject,
            caption
          );
        } else {
          // Отправляем текст без кнопок
          const messageText = getTranslation(lang, 'request_subject').replace('%subject%', assistantRequest.subject || '');

          await sendTelegramMessageWithButtons(
            newAssistant.telegramId.toString(),
            messageText,
            []
          );
        }
      }

      // Отправляем основное сообщение с кнопками (accept/reject)
      const messageText = assistantRequest?.message || getTranslation(lang, 'new_user_message');

      await sendTelegramMessageWithButtons(
        newAssistant.telegramId.toString(),
        messageText,
        [
          { text: getTranslation(lang, 'accept'), callback_data: `accept_${requestId}` },
          { text: getTranslation(lang, 'reject'), callback_data: `reject_${requestId}` },
        ]
      );


    } else {
      const lang = detectUserLanguage(ctx);
      // Нет доступных ассистентов
      await userBot.api.sendMessage(
        Number(userId),
        getTranslation(lang, 'no_more_assistants')
      );
    }

  } catch (error) {
    console.error('Ошибка при переназначении запроса:', error);
    // Если произошла ошибка, уведомляем пользователя об ошибке
    // Можно отправить сообщение о проблеме пользователю или же логировать без ответа
    const assistantRequest = await prisma.assistantRequest.findUnique({
      where: { id: requestId },
      include: { conversation: true },
    });
    const userId = assistantRequest?.conversation?.userId;
    if (userId) {
      const lang = detectUserLanguage(ctx);
      await userBot.api.sendMessage(
        Number(userId),
        getTranslation(lang, 'reassign_request_error')
      );
    }
  }
}

async function handleAcceptConversation(
  conversationId: bigint,
  assistantTelegramId: bigint,
  ctx: Context
) {
  try {
    const lang = detectUserLanguage(ctx);

    // Ищем разговор, включая связанную заявку
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { assistantRequest: true }, // чтобы видеть request
    });

    if (!conversation) {
      await ctx.reply(getTranslation(lang, 'request_not_found_or_not_assigned'));
      return;
    }

    // Проверяем, что этот разговор действительно можно «принять».
    // Если conversation.status уже 'IN_PROGRESS', значит диалог уже ведётся
    if (conversation.status === 'IN_PROGRESS') {
      await ctx.reply(getTranslation(lang, 'request_already_in_progress'));
      return;
    }

    // "Реанимируем" разговор. Устанавливаем новый createdAt, статус и назначаем ассистента.
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'IN_PROGRESS',
        assistantId: assistantTelegramId,
        createdAt: new Date(),   // Обнуляем время начала диалога
        updatedAt: new Date(),   // хотя с @updatedAt это может произойти автоматически
      },
      include: {
        assistantRequest: true,
      },
    });

    // Одновременно обновляем связанную заявку (AssistantRequest), если есть
    if (conversation.assistantRequest) {
      await prisma.assistantRequest.update({
        where: { id: conversation.assistantRequest.id },
        data: {
          status: 'IN_PROGRESS',
          isActive: true,
        },
      });
    }

    // Освобождаем диалог от других ассистентов (если ранее кто-то другой им занимался)
    await prisma.assistant.updateMany({
      where: { activeConversationId: conversation.id },
      data: { activeConversationId: null },
    });

    // Назначаем текущему ассистенту активный разговор
    await prisma.assistant.update({
      where: { telegramId: assistantTelegramId },
      data: { activeConversationId: conversation.id },
    });

    // Сообщаем ассистенту об успехе
    await ctx.reply(getTranslation(lang, 'accept_request_confirm'));

    // При желании уведомляем пользователя
    if (conversation.userId) {
      await sendTelegramMessageToUser(
        conversation.userId.toString(),
        getTranslation(lang, 'assistant_joined_chat')
      );
    }

  } catch (error) {
    const lang = detectUserLanguage(ctx);
    console.error('Ошибка при принятии разговора:', error);
    await ctx.reply(getTranslation(lang, 'another_assistant_accepted'));
  }
}



async function handleRejectConversation(
  conversationId: bigint,
  assistantTelegramId: bigint,
  ctx: Context
) {
  try {
    const lang = detectUserLanguage(ctx);

    // Находим разговор, чтобы убедиться, что он существует
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      // Разговор не найден
      await ctx.reply(getTranslation(lang, 'request_not_found_or_not_assigned'));
      return;
    }

    // Проверяем, действительно ли ассистент является владельцем этого разговора
    // или имеет право его отклонить
    if (conversation.assistantId !== assistantTelegramId) {
      // Ассистент не совпадает
      await ctx.reply(getTranslation(lang, 'another_assistant_accepted'));
      return;
    }

    // Переводим разговор в статус ABORTED (или любой, нужный вам)
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ABORTED',
      },
    });

    // Сбрасываем `activeConversationId` у ассистента, если он указывает на этот разговор
    await prisma.assistant.updateMany({
      where: {
        telegramId: assistantTelegramId,
        activeConversationId: conversationId,
      },
      data: { activeConversationId: null },
    });

    // Уведомляем ассистента, что отклонение успешно
    await ctx.reply(getTranslation(lang, 'reject_request'));

    // При желании уведомляем пользователя, что ассистент отказался
    if (conversation.userId) {
      await sendTelegramMessageToUser(
        conversation.userId.toString(),
        getTranslation(lang, 'assistant_declined_extension')
        // Добавьте ключ перевода, например: "Ассистент отклонил продление диалога."
      );
    }
  } catch (error) {
    console.error('Ошибка при отклонении разговора:', error);
    const lang = detectUserLanguage(ctx);
    // Обобщённое сообщение об ошибке
    await ctx.reply(getTranslation(lang, 'server_error'));
  }
}


bot.command('offline', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(detectUserLanguage(ctx), 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const lang = detectUserLanguage(ctx);

    // Проверяем наличие активного диалога
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        assistantId: telegramId,
        status: 'IN_PROGRESS',
      },
    });

    // Если есть активные диалоги - предлагаем инлайн-кнопки и выходим без изменения isWorking
    if (activeConversation) {
      const keyboard = new InlineKeyboard()
        .text(getTranslation(lang, 'end_work_confirm'), 'end_work_confirm') // Если у вас есть ключ для "Завершить работу"
        .row()
        .text(getTranslation(lang, 'end_work_cancel'), 'end_work_cancel'); // Если есть ключ для "Вернуться к работе"

      await ctx.reply(
        getTranslation(lang, 'active_dialogs_blocking_warning'),
        { reply_markup: keyboard }
      );
      return;
    }

    // Получаем ассистента
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: telegramId },
    });

    if (!assistant) {
      console.error(`Assistant not found with telegramId: ${telegramId}`);
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

bot.callbackQuery('end_work_confirm', async (ctx) => {
  try {
    const telegramId = BigInt(ctx.from.id);
    const lang = detectUserLanguage(ctx);

    // Получаем ассистента
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: telegramId },
    });

    if (!assistant) {
      console.error(`Assistant not found with telegramId: ${telegramId}`);
      await ctx.answerCallbackQuery();
      await ctx.reply(getTranslation(lang, 'no_assistant_found'));
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
    }

    // Завершаем все активные диалоги (меняем статус на COMPLETED)
    await prisma.conversation.updateMany({
      where: {
        assistantId: telegramId,
        status: 'IN_PROGRESS',
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // Блокируем ассистента
    await prisma.assistant.update({
      where: { telegramId: telegramId },
      data: {
        isWorking: false,
        isBlocked: true,
        unblockDate: null
      },
    });

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(getTranslation(lang, 'work_finished_blocked'));

    // Найдём любой завершённый сейчас разговор, чтобы получить requestId
    const completedConversation = await prisma.conversation.findFirst({
      where: {
        assistantId: telegramId,
        status: 'COMPLETED',
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (completedConversation) {
      const userId = completedConversation.userId;

      // Отправляем сообщение пользователю через userBot
      await userBot.api.sendMessage(
        Number(userId),
        getTranslation(lang, 'assistant_lost_connecting_new')
      );
      // Переназначаем запрос другому ассистенту
      await reassignRequest(completedConversation.requestId, telegramId, ctx);
    }

  } catch (error) {
    console.error('Error confirming end work:', error);
    await ctx.answerCallbackQuery();
    await ctx.reply(getTranslation(detectUserLanguage(ctx), 'end_dialog_error'));
  }
});

bot.callbackQuery('end_work_cancel', async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
    // Просто удаляем сообщение с кнопками
    await ctx.deleteMessage();
  } catch (error) {
    console.error('Error canceling end work:', error);
  }
});

bot.command('online', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    // Проверяем, является ли отправитель ассистентом
    const assistant = await prisma.assistant.findUnique({ where: { telegramId } });
    if (!assistant) {
      await ctx.reply(getTranslation(lang, 'no_assistant_found'));
      return;
    }

    if (assistant.isWorking) {
      await ctx.reply(getTranslation(lang, 'already_working'));
      return;
    }

    // Устанавливаем статус ассистента как работающего + сохраняем текущий язык
    await prisma.assistant.update({
      where: { telegramId },
      data: {
        isWorking: true,
        language: lang,       // <-- Сохраняем текущий язык ассистента
      },
    });

    // Создать сессию работы ассистента
    await prisma.assistantSession.create({
      data: {
        assistantId: telegramId,
      },
    });

    const pendingRequest = await prisma.assistantRequest.findFirst({
      where: {
        status: 'PENDING',
      },
    });

    if (pendingRequest) {
      // Переводим запрос в статус IN_PROGRESS и назначаем ассистента
      const updatedRequest = await prisma.assistantRequest.update({
        where: { id: pendingRequest.id },
        data: {
          assistantId: telegramId,
          status: 'IN_PROGRESS',
        },
      });

      // Формируем текст сообщения, в зависимости от типа темы
      const messageText = updatedRequest?.subject
        ? updatedRequest.subject.startsWith('http')
          ? `${getTranslation(lang, 'assistantRequestMessage')}`
          : `${getTranslation(lang, 'assistantRequestMessage')}\n\n${getTranslation(lang, 'topic')}: ${updatedRequest.subject}`
        : `${getTranslation(lang, 'assistantRequestMessage')}\n\n${getTranslation(lang, 'topic')}: ${getTranslation(lang, 'no_subject')}`;

      if (updatedRequest?.subject?.startsWith('http')) {
        // Если subject — ссылка (например, на картинку)
        await sendTelegramMediaToAssistant(
          telegramId.toString(),
          updatedRequest.subject,
          ''
        );

        // После отправки медиа отправляем сообщение с кнопками
        await sendTelegramMessageWithButtons(
          telegramId.toString(),
          getTranslation(lang, 'assistantRequestMessage'),
          [
            { text: getTranslation(lang, 'accept'), callback_data: `accept_${updatedRequest.id.toString()}` },
            { text: getTranslation(lang, 'reject'), callback_data: `reject_${updatedRequest.id.toString()}` },
          ]
        );
      } else {
        // Если subject обычный текст или отсутствует
        await sendTelegramMessageWithButtons(
          telegramId.toString(),
          messageText,
          [
            { text: getTranslation(lang, 'accept'), callback_data: `accept_${updatedRequest.id.toString()}` },
            { text: getTranslation(lang, 'reject'), callback_data: `reject_${updatedRequest.id.toString()}` },
          ]
        );
      }
      return;
    }

    // Если нет PENDING-запросов
    await ctx.reply(getTranslation(lang, 'work_started'));
  } catch (error) {
    console.error('Error in /online command:', error);
    await ctx.reply(getTranslation(detectUserLanguage(ctx), 'server_error'));
  }
});


bot.command('coins', async (ctx) => {
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

    if (assistant) {
      const coinsMessage = `${getTranslation(lang, 'my_coins')}: ${assistant.coins}`;

      await ctx.reply(coinsMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: getTranslation(lang, 'request_withdrawal'), callback_data: 'request_withdrawal' }],
          ],
        },
      });
    } else {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
    }
  } catch (error) {
    console.error('Error in /my_coins command:', error);
    await ctx.reply(getTranslation(lang, 'server_error'));
  }
});

bot.command('my_activity', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    const stats = await getAssistantActivity(telegramId);

    const activityMessage = `
📊 ${getTranslation(lang, 'my_activity')}:
- ${getTranslation(lang, 'total_conversations')}: ${stats.totalConversations}
- ${getTranslation(lang, 'conversations_last_24_hours')}: ${stats.conversationsLast24Hours}
- ${getTranslation(lang, 'ignored_requests')}: ${stats.ignoredRequests}
- ${getTranslation(lang, 'rejected_requests')}: ${stats.rejectedRequests}
- ${getTranslation(lang, 'complaints_last_24_hours')}: ${stats.complaintsLast24Hours}
`;

    await ctx.reply(activityMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'view_limits'), callback_data: 'view_limits' }],
        ],
      },
    });

  } catch (error) {
    console.error('Error in /my_activity command:', error);
    await ctx.reply(getTranslation(lang, 'server_error'));
  }
});



bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery?.data;
  const lang = detectUserLanguage(ctx);

  if (!ctx.from?.id) {
    await ctx.reply(getTranslation(lang, 'end_dialog_error'));
    return;
  }

  const telegramId = BigInt(ctx.from.id);

  if (data?.startsWith('activate_')) {
    // Handle activation of a conversation
    const conversationId = BigInt(data.split('_')[1]);
    const assistantId = telegramId;

    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: assistantId },
    });

    if (!assistant) {
      await ctx.answerCallbackQuery({ text: getTranslation(lang, 'no_assistant_found'), show_alert: true });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { assistantRequest: true, user: true },
    });

    if (!conversation || conversation.assistantId !== assistantId) {
      await ctx.answerCallbackQuery({
        text: getTranslation(lang, 'request_not_found_or_not_assigned'),
        show_alert: true,
      });
      return;
    }

    // Activate the selected conversation for the assistant
    await prisma.assistant.update({
      where: { telegramId: assistantId },
      data: { activeConversationId: conversationId },
    });

    await ctx.answerCallbackQuery({
      text: `${getTranslation(lang, 'activated_request_with_subject')}: ${conversation.assistantRequest.subject}`,
    });
    await ctx.reply(
      `${getTranslation(lang, 'now_chatting_with_user')}: ${conversation.user.username || conversation.userId}`
    );
  } else if (data.startsWith('accept_') || data.startsWith('reject_')) {
    // Handle accept or reject actions
    const [action, requestIdString] = data.split('_');
    const requestId = BigInt(requestIdString);

    if (action === 'accept') {
      await handleAcceptRequest(requestId.toString(), telegramId, ctx);
    } else if (action === 'reject') {
      await handleRejectRequest(requestId.toString(), telegramId, ctx);
    }
  } else if (data.startsWith('acceptConv_') || data.startsWith('rejectConv_')) {
    // "продолжить" или "отклонить" разговор
    const [action, convIdString] = data.split('_');
    const conversationId = BigInt(convIdString);

    if (action === 'acceptConv') {
      await handleAcceptConversation(conversationId, telegramId, ctx);
    } else if (action === 'rejectConv') {
      await handleRejectConversation(conversationId, telegramId, ctx);
    }
  } else if (data === 'my_activity') {
    // Handle displaying activity
    const stats = await getAssistantActivity(telegramId);

    const activityMessage = `
📊 ${getTranslation(lang, 'my_activity')}:
- ${getTranslation(lang, 'total_conversations')}: ${stats.totalConversations}
- ${getTranslation(lang, 'conversations_last_24_hours')}: ${stats.conversationsLast24Hours}
- ${getTranslation(lang, 'ignored_requests')}: ${stats.ignoredRequests}
- ${getTranslation(lang, 'rejected_requests')}: ${stats.rejectedRequests}
- ${getTranslation(lang, 'complaints_last_24_hours')}: ${stats.complaintsLast24Hours}
`;

    await ctx.reply(activityMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'view_limits'), callback_data: 'view_limits' }],
        ],
      },
    });
  } else if (data === 'request_withdrawal') {
    // Handle withdrawal request
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
        await ctx.reply(getTranslation(lang, 'complaint_pending'));
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
        await ctx.reply(getTranslation(lang, 'balance_frozen'));
        return;
      }

      const withdrawalAmount = assistant.coins;

      // Если нужно запретить вывод при нулевом балансе, можно добавить проверку:
      // if (withdrawalAmount <= 0) {
      //   await ctx.reply('У вас 0 коинов, вывод невозможен');
      //   return;
      // }

      // Сразу сообщаем, что запрос на вывод формируется
      await ctx.reply(getTranslation(lang, 'withdrawal_request_sent'));

      // 1. Создаём запись в withdrawalRequest
      await prisma.withdrawalRequest.create({
        data: {
          userId: assistant.telegramId,
          userNickname: ctx.from?.username || null,
          userRole: 'assistant',
          amount: withdrawalAmount,
        },
      });

      // 2. Вычитаем эти коины из баланса ассистента (или просто обнуляем)
      //    Например, полностью обнуляем:
      await prisma.assistant.update({
        where: { telegramId: assistant.telegramId },
        data: {
          coins: { decrement: withdrawalAmount },
          // Либо coins: 0, если хотите без decrement. Но decrement надёжнее,
          // чтобы не писать "coins: 0" в случае, если кто-то успел пополнить баланс
        },
      });

      await ctx.reply(getTranslation(lang, 'withdrawal_request_created'));
    } else {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
    }
  }
  else if (data === 'view_limits') {
    // Handle viewing limits
    await ctx.reply(getTranslation(lang, 'limits_info'));
  } else {
    // Unknown callback data
    await ctx.answerCallbackQuery({ text: getTranslation(lang, 'unknown_action'), show_alert: true });
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


async function handleAcceptRequest(
  requestId: string,
  assistantTelegramId: bigint,
  ctx: Context
) {
  try {
    const lang = detectUserLanguage(ctx);

    // 1. Меняем статус запроса
    const assistantRequest = await prisma.assistantRequest.update({
      where: { id: BigInt(requestId) },
      data: { status: 'IN_PROGRESS', isActive: true },
      include: { user: true },
    });

    // 2. Пытаемся найти разговор по этому `requestId`
    let conversation = await prisma.conversation.findFirst({
      where: { requestId: assistantRequest.id },
    });

    // Если разговора в принципе нет - может быть ситуация,
    // когда старый диалог никогда не создавался; тогда создаём.
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: assistantRequest.userId,
          assistantId: assistantTelegramId,
          requestId: assistantRequest.id,
          messages: [],         // Или можно оставить пустым
          status: 'IN_PROGRESS',
          lastMessageFrom: 'USER',
        },
      });

      await ctx.reply(getTranslation(lang, 'accept_request'));
      await sendTelegramMessageToUser(
        assistantRequest.user.telegramId.toString(),
        getTranslation(lang, 'assistant_joined_chat')
      );
    } else {
      // Разговор уже существует. Смотрим на его статус.
      if (conversation.status === 'IN_PROGRESS') {
        // Если уже в процессе – значит «кто-то уже принял этот запрос»
        await ctx.reply(getTranslation(lang, 'request_already_in_progress'));
        return;
      } else if (
        conversation.status === 'ABORTED' ||
        conversation.status === 'COMPLETED'
      ) {
        // «реанимируем» разговор
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            assistantId: assistantTelegramId,
            // Если вы хотите сохранить историю сообщений – не затирайте их.
            // Если нет – можно messages: [],
            status: 'IN_PROGRESS',
            updatedAt: new Date(),
            // При желании можно обнулить lastMessageFrom, responseTimes и т. д.
            // Для логики продления, можно оставить как есть.
          },
        });

        await ctx.reply(getTranslation(lang, 'accept_request_confirm'));
        await sendTelegramMessageToUser(
          assistantRequest.user.telegramId.toString(),
          getTranslation(lang, 'assistant_joined_chat')
        );
      } else {
        // На всякий случай, если будут другие статусы
        await ctx.reply(getTranslation(lang, 'request_already_in_progress'));
        return;
      }
    }

    // 3. Сбрасываем `activeConversationId` у других ассистентов (чтобы только текущий был активным).
    await prisma.assistant.updateMany({
      where: { activeConversationId: conversation.id },
      data: { activeConversationId: null },
    });

    // 4. Устанавливаем активный разговор для данного ассистента
    await prisma.assistant.update({
      where: { telegramId: assistantTelegramId },
      data: { activeConversationId: conversation.id },
    });
  } catch (error) {
    const lang = detectUserLanguage(ctx);
    console.error('Ошибка при принятии запроса:', error);
    // Ловим любую ошибку и шлём «другой ассистент...», 
    // лучше логировать `error.code`, `error.message`, чтобы понять в чём дело.
    await ctx.reply(getTranslation(lang, 'another_assistant_accepted'));
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
      const lang = detectUserLanguage(ctx);
      await ctx.reply(getTranslation(lang, 'exceeded_reject_limit'));
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
    const lang = detectUserLanguage(ctx);
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
        const caption = getTranslation(lang, 'request_subject_from_user');
        if (assistantRequest.subject.startsWith('http')) {
          // Отправляем медиа (фото, видео, голосовое сообщение)
          await sendTelegramMediaToAssistant(
            newAssistant.telegramId.toString(),
            assistantRequest.subject,
            caption
          );
        } else {
          // Отправляем текст без кнопок
          const subjectText = getTranslation(lang, 'request_subject_prefix')
            .replace('%subject%', assistantRequest.subject);
          await sendTelegramMessageWithButtons(
            newAssistant.telegramId.toString(),
            subjectText,
            []
          );
        }
      }

      // Отправляем основное сообщение с кнопками
      const mainMessage = assistantRequest?.message || getTranslation(lang, 'new_user_message');
      await sendTelegramMessageWithButtons(
        newAssistant.telegramId.toString(),
        mainMessage,
        [
          { text: getTranslation(lang, 'accept'), callback_data: `accept_${requestId}` },
          { text: getTranslation(lang, 'reject'), callback_data: `reject_${requestId}` },
        ]
      );

      await ctx.reply(getTranslation(lang, 'rejected_request_reassigned'));
    } else {
      await ctx.reply(getTranslation(lang, 'rejected_request_no_assistants'));
    }

  } catch (error) {
    console.error('Ошибка при отклонении запроса:', error);
    const lang = detectUserLanguage(ctx);
    await ctx.reply(getTranslation(lang, 'rejected_request_error'));
  }
} // <-- Закрываем функцию




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
  const lang = detectUserLanguage(ctx); // Определение языка пользователя

  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const assistantTelegramId = BigInt(ctx.from.id);

    // Получаем ассистента и активную беседу
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: assistantTelegramId },
      include: { activeConversation: true },
    });

    if (!assistant) {
      await ctx.reply(getTranslation(lang, 'no_assistant_found'));
      return;
    }

    if (!assistant.activeConversationId) {
      await ctx.reply(getTranslation(lang, 'no_active_requests'));
      return;
    }

    // Получаем активную беседу
    const activeConversation = await prisma.conversation.findUnique({
      where: { id: assistant.activeConversationId },
      include: { user: true },
    });

    if (!activeConversation) {
      await ctx.reply(getTranslation(lang, 'no_active_requests'));
      return;
    }

    // Проверяем статус беседы
    if (activeConversation.status !== 'IN_PROGRESS') {
      await ctx.reply(getTranslation(lang, 'no_active_requests'));
      return;
    }

    const assistantMessage = ctx.message?.text;
    if (!assistantMessage) {
      await ctx.reply(getTranslation(lang, 'send_message_error'));
      return;
    }

    // Вычисление оставшегося времени
    const conversationStartTime = new Date(activeConversation.createdAt);
    const currentTime = new Date();
    const elapsedMinutes = Math.floor((currentTime.getTime() - conversationStartTime.getTime()) / 60000);
    const remainingMinutes = Math.max(SESSION_DURATION - elapsedMinutes, 0);

    const timeMessage = getTranslation(lang, 'session_time_remaining')
      .replace('%minutes%', String(remainingMinutes));

    const responseMessage = `
${assistantMessage}
${timeMessage}
`.trim();

    // Отправляем сообщение пользователю только если статус беседы IN_PROGRESS
    await sendTelegramMessageToUser(
      activeConversation.userId.toString(),
      responseMessage
    );

  } catch (error) {
    console.error('Ошибка при обработке сообщения от ассистента:', error);
    await ctx.reply(getTranslation(lang, 'error_processing_message'));
  }
});




export const POST = webhookCallback(bot, 'std/http');
