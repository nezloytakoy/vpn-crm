import { Bot, webhookCallback } from 'grammy';
import OpenAI from 'openai';
import { PrismaClient, SubscriptionType } from '@prisma/client';
import { ArbitrationStatus } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const token = process.env.TELEGRAM_USER_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_USER_BOT_TOKEN не найден.');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY не найден.');

const bot = new Bot(token);

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface MessageData {
  chat_id: string;
  text: string;
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
}

const userConversations = new Map<bigint, ChatMessage[]>();

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

async function sendMessageToModerator(chatId: string, text: string) {
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
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (error) {
    console.error('Ошибка при отправке сообщения модератору:', error);
  }
}


type TranslationKey =
  | 'start_message'
  | 'webapp_button'
  | 'no_user_id'
  | 'no_text_message'
  | 'error_processing_message'
  | 'dialog_closed'
  | 'error_end_dialog'
  | 'no_active_dialog'
  | 'user_ended_dialog'
  | 'ai_no_response'
  | 'ai_chat_deactivated'
  | 'ai_chat_not_active';

const getTranslation = (languageCode: string | undefined, key: TranslationKey): string => {
  const translations = {
    ru: {
      start_message:
        '👋 Это бот для пользователей! Для продолжения нажмите на кнопку ниже и войдите в Telegram Web App.',
      webapp_button: '🚪 Войти в Web App',
      no_user_id: 'Не удалось получить ваш идентификатор пользователя.',
      no_text_message: 'Пожалуйста, отправьте текстовое сообщение.',
      error_processing_message:
        'Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.',
      dialog_closed: 'Диалог с ассистентом завершен. Спасибо за использование нашего сервиса!',
      error_end_dialog: 'Произошла ошибка при завершении диалога. Пожалуйста, попробуйте еще раз позже.',
      no_active_dialog: 'У вас нет активного диалога с ассистентом.',
      user_ended_dialog: 'Пользователь завершил диалог.',
      ai_no_response: 'Извините, не удалось получить ответ от ИИ.',
      ai_chat_deactivated: 'Режим общения с ИИ деактивирован. Спасибо за использование нашего сервиса!',
      ai_chat_not_active: 'У вас нет активного диалога с ИИ.',
    },
    en: {
      start_message:
        '👋 This is the user bot! To continue, click the button below and log into the Telegram Web App.',
      webapp_button: '🚪 Log into Web App',
      no_user_id: 'Failed to retrieve your user ID.',
      no_text_message: 'Please send a text message.',
      error_processing_message:
        'An error occurred while processing your message. Please try again later.',
      dialog_closed: 'The dialog with the assistant has ended. Thank you for using our service!',
      error_end_dialog: 'An error occurred while ending the dialog. Please try again later.',
      no_active_dialog: 'You have no active dialog with an assistant.',
      user_ended_dialog: 'The user has ended the dialog.',
      ai_no_response: 'Sorry, could not get a response from the AI.',
      ai_chat_deactivated: 'AI chat mode has been deactivated. Thank you for using our service!',
      ai_chat_not_active: 'You have no active AI dialog.',
    },
  };

  const lang: 'ru' | 'en' = languageCode === 'ru' ? 'ru' : 'en';
  return translations[lang][key];
};


bot.command('end_dialog', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en'; // Получаем код языка пользователя

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    const activeRequest = await prisma.assistantRequest.findFirst({
      where: {
        user: { telegramId: telegramId },
        isActive: true,
      },
      include: { assistant: true },
    });

    if (!activeRequest) {
      await ctx.reply(getTranslation(languageCode, 'no_active_dialog'));
      return;
    }

    await prisma.assistantRequest.update({
      where: { id: activeRequest.id },
      data: { status: 'COMPLETED', isActive: false },
    });

    if (activeRequest.assistant) {
      await prisma.assistant.update({
        where: { telegramId: activeRequest.assistant.telegramId },
        data: { isBusy: false },
      });
    } else {
      console.error('Ошибка: ассистент не найден для запроса');
    }

    await ctx.reply(getTranslation(languageCode, 'dialog_closed'));

    if (activeRequest.assistant) {
      await sendMessageToAssistant(
        activeRequest.assistant.telegramId.toString(),
        getTranslation(languageCode, 'user_ended_dialog')
      );
    } else {
      console.error('Ошибка: ассистент не найден для активного запроса');
    }

  } catch (error) {
    console.error('Ошибка при завершении диалога:', error);
    const languageCode = ctx.from?.language_code || 'en';
    await ctx.reply(getTranslation(languageCode, 'error_end_dialog'));
  }
});


bot.command('end_ai', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    if (!user.isActiveAIChat) {
      await ctx.reply(getTranslation(languageCode, 'ai_chat_not_active'));
      return;
    }

    // Update the user's isActiveAIChat flag to false
    await prisma.user.update({
      where: { telegramId },
      data: { isActiveAIChat: false },
    });

    // Remove the user's conversation from the Map
    userConversations.delete(telegramId);

    // Reply to the user
    await ctx.reply(getTranslation(languageCode, 'ai_chat_deactivated'));
  } catch (error) {
    console.error('Error ending AI chat:', error);
    const languageCode = ctx.from?.language_code || 'en';
    await ctx.reply(getTranslation(languageCode, 'error_end_dialog'));
  }
});

bot.command('start', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const username = ctx.from.username || null;

    // Проверяем, передан ли реферальный код
    const referralCode = ctx.message?.text?.split(' ')[1]; // Извлекаем реферальный код из команды /start
    let referrerId: bigint | null = null;

    if (referralCode && referralCode.startsWith('ref_')) {
      const code = referralCode.replace('ref_', '');

      // Находим запись реферальной ссылки
      const referral = await prisma.referral.findUnique({
        where: { code },
      });

      if (referral) {
        referrerId = referral.userId; // Сохраняем ID пользователя, который пригласил
      } else {
        await ctx.reply('Неверный реферальный код.');
        return;
      }
    }

    // Регистрация или обновление информации о пользователе
    const newUser = await prisma.user.upsert({
      where: { telegramId },
      update: { username },
      create: {
        telegramId,
        username,
      },
    });

    // Если есть referrerId и referralCode, увеличиваем счетчик рефералов и создаем запись в таблице Referral
    if (referrerId && referralCode) {
      await prisma.user.update({
        where: { telegramId: referrerId },
        data: {
          referralCount: { increment: 1 }, // Увеличиваем счетчик рефералов у пригласившего пользователя
        },
      });

      // Создаем реферальную запись, связывая пригласившего и приглашенного пользователей
      await prisma.referral.create({
        data: {
          userId: referrerId, // ID пригласившего
          referredUserId: newUser.telegramId, // ID приглашенного
          code: referralCode, // Код реферальной ссылки
          link: `https://t.me/vpn_srm_userbot?start=ref_${referralCode}`, // Статическая ссылка с именем бота
        },
      });
    }

    await ctx.reply(getTranslation(languageCode, 'start_message'), {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: getTranslation(languageCode, 'webapp_button'),
              web_app: { url: 'https://crm-vpn.vercel.app/user-profile' },
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error('Ошибка при обработке команды /start:', error);
    const languageCode = ctx.from?.language_code || 'en';
    await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
  }
});

const TELEGRAM_LOG_USER_ID = 5829159515; // ID пользователя для отправки логов

// Функция для отправки логов в Telegram
const sendLogToTelegram = async (message: string) => {
  try {
    await bot.api.sendMessage(TELEGRAM_LOG_USER_ID, message);
  } catch (error) {
    console.error("Ошибка отправки сообщения в Telegram:", error);
  }
};

// Обработчик pre_checkout_query
bot.on("pre_checkout_query", async (ctx) => {
  try {
    // Подтверждаем, что бот готов принять платеж
    await ctx.answerPreCheckoutQuery(true);

    // Логируем информацию о pre_checkout_query
    await sendLogToTelegram(`Pre-checkout query received for user ${ctx.from?.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await sendLogToTelegram(`Error in pre-checkout query: ${errorMessage}`);
    console.error("Ошибка при ответе на pre_checkout_query:", errorMessage);
  }
});

// Обработчик успешного платежа
bot.on("message:successful_payment", async (ctx) => {
  try {
    const payment = ctx.message?.successful_payment;
    const userId = ctx.from?.id;

    if (payment && userId) {
      // Логируем успешную оплату
      await sendLogToTelegram(`User ${userId} has successfully paid for ${payment.total_amount / 42} stars`);

      // Пример получения данных о пользователе из БД и обновления подписки (необходимо реализовать соответствующую логику)
      const user = await prisma.user.findUnique({
        where: {
          telegramId: BigInt(userId), // Ищем пользователя по Telegram ID
        },
      });

      if (!user) {
        await sendLogToTelegram(`User ${userId} not found in database.`);
        throw new Error(`User ${userId} not found in database.`);
      }

      // Определяем логику для обновления подписки в зависимости от того, что пользователь купил
      let subscriptionType: SubscriptionType;
      let assistantRequestsIncrement = 0;
      let aiRequestsIncrement = 0;

      // Определяем, какой тариф был куплен
      switch (payment.invoice_payload) {  // Используем invoice_payload для определения тарифа
        case "ai + 5 запросов ассистенту":
        case "ai + 5 assistant requests":
          subscriptionType = SubscriptionType.FIRST;
          assistantRequestsIncrement = 5;
          aiRequestsIncrement = 10;
          break;
        case "ai + 14 запросов ассистенту":
        case "ai + 14 assistant requests":
          subscriptionType = SubscriptionType.SECOND;
          assistantRequestsIncrement = 14;
          aiRequestsIncrement = 28;
          break;
        case "ai + 30 запросов ассистенту":
        case "ai + 30 assistant requests":
          subscriptionType = SubscriptionType.THIRD;
          assistantRequestsIncrement = 30;
          aiRequestsIncrement = 60;
          break;
        case "только ai":
        case "only ai":
          subscriptionType = SubscriptionType.FOURTH;
          aiRequestsIncrement = 100;
          break;
        default:
          await sendLogToTelegram(`Invalid invoice payload: ${payment.invoice_payload}`);
          throw new Error(`Invalid invoice payload: ${payment.invoice_payload}`);
      }

      // Обновляем пользователя в базе данных
      await prisma.user.update({
        where: {
          telegramId: BigInt(userId),
        },
        data: {
          subscriptionType,
          hasUpdatedSubscription: true,
          aiRequests: { increment: aiRequestsIncrement },
          assistantRequests: { increment: assistantRequestsIncrement },
          updatedAt: new Date(),
        },
      });


      // Логируем успешное обновление подписки
      await sendLogToTelegram(`User ${userId} updated with subscription: ${subscriptionType}`);

      // Отправляем сообщение пользователю о том, что подписка была успешно обновлена
      await ctx.reply("Ваш платеж прошел успешно! Привилегии активированы.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await sendLogToTelegram(`Error handling successful payment: ${errorMessage}`);
    console.error("Ошибка обработки успешного платежа:", errorMessage);
  }
});

async function sendTelegramMessageToModerator(chatId: string, text: string, arbitrationId?: bigint) {
  const botToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_ADMIN_BOT_TOKEN не установлен');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;



  try {
    const messageData: MessageData = {
      chat_id: chatId,
      text,
    };

    // Если передан arbitrationId, добавляем кнопку "Рассмотреть"
    if (arbitrationId) {
      messageData.reply_markup = {
        inline_keyboard: [
          [
            {
              text: 'Рассмотреть',
              callback_data: `review_${arbitrationId.toString()}`,
            },
          ],
        ],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error(`Ошибка отправки сообщения модератору: ${response.statusText}`);
    }

    console.log(`Сообщение успешно отправлено модератору с ID: ${chatId}`);
  } catch (error) {
    console.error('Ошибка при отправке сообщения модератору:', error);
  }
}

async function sendTelegramMessageToAssistant(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка отправки сообщения ассистенту: ${response.statusText}`);
    }

    console.log(`Сообщение успешно отправлено ассистенту с ID: ${chatId}`);
  } catch (error) {
    console.error('Ошибка при отправке сообщения ассистенту:', error);
  }
}


// Обработчик команды /problem для бота пользователя
bot.command('problem', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId },
    });

    if (!user) {
      await ctx.reply('Ошибка: пользователь не найден.');
      return;
    }

    // Ищем активный запрос пользователя
    const activeRequest = await prisma.assistantRequest.findFirst({
      where: {
        user: { telegramId: telegramId },
        isActive: true,
      },
      include: { assistant: true },
    });

    if (!activeRequest) {
      await ctx.reply('⚠️ У вас нет активных запросов.');
      return;
    }

    // Проверяем, нет ли уже активного арбитража для этого запроса
    const existingArbitration = await prisma.arbitration.findFirst({
      where: {
        userId: telegramId,
        assistantId: activeRequest.assistantId ?? undefined, // Используем undefined, если assistantId равен null
        status: 'IN_PROGRESS' as ArbitrationStatus,
      },
    });


    if (existingArbitration) {
      await ctx.reply('У вас уже есть активный арбитраж по этому запросу.');
      return;
    }

    // Получаем никнеймы пользователя и ассистента
    const userNickname = ctx.from.username || null;
    const assistantNickname = activeRequest.assistant?.telegramId?.toString() || null;

    interface ArbitrationData {
      userId: bigint;
      userNickname: string | null;
      assistantId?: bigint; // assistantId теперь опциональный
      assistantNickname: string | null;
      moderatorId: bigint | null;
      reason: string;
      status: ArbitrationStatus;
    }
    
    const arbitrationData: ArbitrationData = {
      userId: telegramId,
      userNickname: userNickname || null,
      assistantNickname: assistantNickname || null,
      moderatorId: null, // Если модератора нет на момент создания
      reason: 'Открытие арбитража пользователем',
      status: 'PENDING' as ArbitrationStatus,
    };
    
    // Если assistantId существует, добавляем его в объект arbitrationData
    if (activeRequest.assistantId) {
      arbitrationData.assistantId = activeRequest.assistantId;
    }
    
    // Если assistantId обязательный, задаем значение по умолчанию
    const arbitration = await prisma.arbitration.create({
      data: {
        ...arbitrationData,
        assistantId: arbitrationData.assistantId || BigInt(0), // Устанавливаем assistantId как BigInt(0), если не указан
      },
    });


    await ctx.reply('Для решения спорной ситуации приглашен модератор.');
    if (activeRequest.assistant !== null) {
      await sendTelegramMessageToAssistant(
        activeRequest.assistant.telegramId.toString(),
        'Для решения спорной ситуации пользователем приглашен модератор.'
      );
    } else {
      console.error('Ошибка: Ассистент не найден для активного запроса.');
    }

    // Ищем модератора с последней активностью
    const lastActiveModerator = await prisma.moderator.findFirst({
      orderBy: {
        lastActiveAt: 'desc', // Сортируем по последней активности
      },
    });

    if (!lastActiveModerator) {
      await ctx.reply('Нет активных модераторов.');
      return;
    }

    // Отправляем сообщение последнему активному модератору через бота для модераторов
    await sendTelegramMessageToModerator(
      lastActiveModerator.id.toString(), // Используем telegramId модератора
      'Для решения спорной ситуации пользователем приглашен модератор. Проверьте арбитраж.',
      arbitration.id // Передаем ID арбитража
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    await ctx.reply(`⚠️ Произошла ошибка при открытии арбитража: ${errorMessage}. Пожалуйста, попробуйте еще раз.`);
  }
});





bot.on('message', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const userMessage = ctx.message?.text;

    if (!userMessage) {
      await ctx.reply(getTranslation(languageCode, 'no_text_message'));
      return;
    }

    // Одновременное получение пользователя, активного запроса и арбитража
    const [user, activeRequest, arbitration] = await Promise.all([
      prisma.user.findUnique({
        where: { telegramId },
      }),
      prisma.assistantRequest.findFirst({
        where: {
          user: { telegramId: telegramId },
          isActive: true,
        },
        include: { assistant: true },
      }),
      prisma.arbitration.findFirst({
        where: {
          userId: telegramId,
          status: 'IN_PROGRESS' as ArbitrationStatus,
        },
        include: {
          assistant: true,
          moderator: true,
        },
      }),
    ]);

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    if (arbitration) {
      // Если есть активный арбитраж, пересылаем сообщение ассистенту и модератору
      const messageToSend = `Пользователь:\n${userMessage}`;

      // Отправляем сообщение ассистенту
      await sendMessageToAssistant(arbitration.assistant.telegramId.toString(), messageToSend);

      // Отправляем сообщение модератору, если он назначен
      if (arbitration.moderator) {
        await sendMessageToModerator(arbitration.moderator.id.toString(), messageToSend);
      }

      // Можно уведомить пользователя, что сообщение отправлено
      // await ctx.reply('Ваше сообщение было отправлено в арбитраж.');

    } else if (user.isActiveAIChat) {
      // Обработка режима общения с ИИ
      const messages: ChatMessage[] = userConversations.get(telegramId) || [
        { role: 'system', content: 'You are a helpful assistant.' },
      ];

      messages.push({ role: 'user', content: userMessage });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
      });

      const firstChoice = response.choices[0];
      if (firstChoice && firstChoice.message && firstChoice.message.content) {
        const aiMessage = firstChoice.message.content.trim();

        messages.push({ role: 'assistant', content: aiMessage });

        userConversations.set(telegramId, messages);

        await ctx.reply(aiMessage);

        await prisma.user.update({
          where: { telegramId },
          data: {
            aiRequests: { increment: 1 },
            totalRequests: { increment: 1 },
          },
        });
      } else {
        await ctx.reply(getTranslation(languageCode, 'ai_no_response'));
      }
    } else if (activeRequest) {
      // Обработка активного запроса к ассистенту
      if (activeRequest.assistant !== null) {
        await sendMessageToAssistant(activeRequest.assistant.telegramId.toString(), userMessage);
      } else {
        console.error('Ошибка: Ассистент не найден для активного запроса.');
      }
    } else {
      // Нет активного диалога
      await ctx.reply('У вас нет активных диалогов. Используйте /start, чтобы начать.');
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    const languageCode = ctx.from?.language_code || 'en';
    await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
  }
});


export const POST = webhookCallback(bot, 'std/http');