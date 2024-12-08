import { Bot, webhookCallback } from 'grammy';
import { Context } from 'grammy';
import OpenAI from 'openai';
import { PrismaClient, AssistantRequest } from '@prisma/client';
import { InputFile } from 'grammy';
import { encode } from 'gpt-3-encoder';
import axios from 'axios';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const token = process.env.TELEGRAM_USER_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_USER_BOT_TOKEN не найден.');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY не найден.');

const bot = new Bot(token);

const assistantBot = new Bot(process.env.TELEGRAM_SUPPORT_BOT_TOKEN || "");

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};


const userConversations = new Map<bigint, ChatMessage[]>();

async function sendFileToAssistant(assistantChatId: string, fileBuffer: Buffer, fileName: string) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const assistantBot = new Bot(botToken);

  try {

    await assistantBot.api.sendDocument(assistantChatId, new InputFile(fileBuffer, fileName));
  } catch (error) {
    console.error('Ошибка при отправке файла ассистенту:', error);
  }
}


async function sendMessageToAssistant(
  ctx: Context | null,
  assistantChatId: string,
  message?: string
) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('[sendMessageToAssistant] Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const assistantBot = new Bot(botToken);

  try {
    if (message) {
      console.log(`[sendMessageToAssistant] Отправка текстового сообщения ассистенту. Chat ID: ${assistantChatId}, Message: ${message}`);
      await assistantBot.api.sendMessage(assistantChatId, message);
    } else if (ctx && ctx.chat && ctx.message) {
      console.log(`[sendMessageToAssistant] Копирование сообщения пользователю. Chat ID: ${assistantChatId}, Source Chat ID: ${ctx.chat.id}, Message ID: ${ctx.message.message_id}`);
      await assistantBot.api.copyMessage(
        assistantChatId,
        ctx.chat.id,
        ctx.message.message_id
      );
    } else {
      console.error('[sendMessageToAssistant] Ошибка: ни message, ни ctx не определены или ctx.chat/ctx.message отсутствуют');
      return;
    }

    const assistantTelegramId = BigInt(assistantChatId);
    console.log(`[sendMessageToAssistant] Идентификатор ассистента: ${assistantTelegramId}`);

    const activeConversation = await prisma.conversation.findFirst({
      where: {
        assistantId: assistantTelegramId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeConversation) {
      console.log(`[sendMessageToAssistant] Найден активный разговор. ID: ${activeConversation.id}`);

      const currentTime = new Date();
      console.log(`[sendMessageToAssistant] Текущее время: ${currentTime.toISOString()}`);

      const newMessage = {
        sender: 'USER',
        message: message || 'Media message',
        timestamp: currentTime.toISOString(),
      };

      console.log(`[sendMessageToAssistant] Новое сообщение для добавления: ${JSON.stringify(newMessage)}`);

      const updatedMessages = [
        ...(activeConversation.messages as Array<{
          sender: string;
          message: string;
          timestamp: string;
        }>),
        newMessage,
      ];

      console.log(`[sendMessageToAssistant] Обновленные сообщения: ${JSON.stringify(updatedMessages)}`);

      await prisma.conversation.update({
        where: { id: activeConversation.id },
        data: {
          lastMessageFrom: 'USER',
          lastUserMessageAt: currentTime,
          messages: updatedMessages,
        },
      });

      console.log(`[sendMessageToAssistant] Разговор обновлен. ID: ${activeConversation.id}`);
    } else {
      console.error(`[sendMessageToAssistant] Ошибка: активный разговор не найден для ассистента с ID: ${assistantTelegramId}`);
    }
  } catch (error) {
    console.error('[sendMessageToAssistant] Ошибка при отправке сообщения ассистенту:', error);
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
  | 'user_ended_dialog_no_reward'
  | 'ai_no_response'
  | 'ai_chat_deactivated'
  | 'ai_chat_not_active'
  | 'coin_awarded'
  | 'no_user_found'
  | 'no_active_dialogs'
  | 'complaint_submitted'
  | 'enterSubject'
  | 'subjectReceived'
  | 'no_active_request'
  | 'server_error'
  | 'assistantRequestMessage'
  | 'noAssistantsAvailable'
  | 'requestSent'
  | 'accept'
  | 'reject'
  | 'unexpected_photo'
  | 'unexpected_voice'
  | 'no_photo_detected'
  | 'no_active_subscription'
  | 'no_permission_to_send_photos'
  | 'no_permission_to_send_voice'
  | 'no_permission_to_send_files'
  | 'no_permission_to_send_videos'
  | 'unexpected_file'
  | 'subjectExpected'; // Added new key


type Language = 'en' | 'ru';

const getTranslation = (languageCode: string | undefined, key: TranslationKey): string => {
  const translations: Record<Language, Record<TranslationKey, string>> = {
    ru: {
      start_message:
        '👋 Это бот для пользователей! Для продолжения нажмите на кнопку ниже и войдите в Telegram Web App.',
      webapp_button: '🚪 Войти в Web App',
      no_user_id: 'Не удалось получить ваш идентификатор пользователя.',
      no_text_message: 'Пожалуйста, отправьте текстовое сообщение.',
      error_processing_message:
        'Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.',
      dialog_closed:
        'Диалог с ассистентом завершен. Спасибо за использование нашего сервиса! Написать жалобу вы можете вызвав команду /problem',
      error_end_dialog: 'Произошла ошибка при завершении диалога. Пожалуйста, попробуйте еще раз позже.',
      no_active_dialog: 'У вас нет активного диалога с ассистентом.',
      user_ended_dialog: 'Пользователь завершил диалог.',
      user_ended_dialog_no_reward: 'Пользователь завершил диалог. Награда не начислена.',
      ai_no_response: 'Извините, не удалось получить ответ от ИИ.',
      ai_chat_deactivated: 'Режим общения с ИИ деактивирован. Спасибо за использование нашего сервиса!',
      ai_chat_not_active: 'У вас нет активного диалога с ИИ.',
      coin_awarded: 'Вам начислен 1 коин за завершение диалога.',
      no_user_found: 'Пользователь не найден.',
      no_active_dialogs: 'У вас нет активных диалогов.',
      complaint_submitted: 'Ваша жалоба была отправлена.',
      enterSubject: 'Пожалуйста, введите тему вашего запроса.',
      subjectReceived: 'Тема получена. Соединяем вас с ассистентом.',
      no_active_request: 'Активный запрос не найден.',
      server_error: 'Произошла ошибка. Пожалуйста, попробуйте позже.',
      assistantRequestMessage: 'Запрос пользователя на разговор',
      noAssistantsAvailable: 'Нет доступных ассистентов',
      requestSent: 'Запрос отправлен ассистенту.',
      accept: 'Принять',
      reject: 'Отклонить',
      unexpected_photo: 'Ваше фото получено, но не ожидается. Попробуйте снова.',
      no_photo_detected: 'Пожалуйста, отправьте изображение.',
      unexpected_voice: 'Ваше голосовое сообщение получено, но не ожидается. Попробуйте снова.',
      unexpected_file: 'Ваш файл получен, но не ожидается. Попробуйте снова.',
      no_active_subscription: 'У вас нет активной подписки.',
      no_permission_to_send_photos: 'Ваша подписка не позволяет отправлять фотографии ассистентам.',
      no_permission_to_send_voice: 'Ваша подписка не позволяет отправлять голосовые сообщения ассистентам.',
      no_permission_to_send_files: 'Ваша подписка не позволяет отправлять файлы ассистентам.',
      no_permission_to_send_videos: 'Ваша подписка не позволяет отправлять видео-кружки ассистентам.',
      subjectExpected: 'Мы ожидаем от вас тему вашего запроса. Пожалуйста, укажите её.', // New translation
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
    user_ended_dialog_no_reward: 'The user has ended the dialog. No reward was granted.',
    ai_no_response: 'Sorry, could not get a response from the AI.',
    ai_chat_deactivated: 'AI chat mode has been deactivated. Thank you for using our service!',
    ai_chat_not_active: 'You have no active AI dialog.',
    coin_awarded: 'You have been awarded 1 coin for completing the dialog.',
    no_user_found: 'User not found.',
    no_active_dialogs: 'You have no active dialogs.',
    complaint_submitted: 'Your complaint has been submitted.',
    enterSubject: 'Please enter the subject of your request.',
    subjectReceived: 'Subject received. Connecting you to an assistant.',
    no_active_request: 'No active request found.',
    server_error: 'An error occurred. Please try again later.',
    assistantRequestMessage: 'User request for conversation',
    noAssistantsAvailable: 'No assistants available',
    requestSent: 'The request has been sent to the assistant.',
    accept: 'Accept',
    reject: 'Reject',
    unexpected_photo: 'Your photo has been received but was not expected. Please try again.',
    no_photo_detected: 'Please send an image.',
    unexpected_voice: 'Your voice message has been received but was not expected. Please try again.',
    unexpected_file: 'Your file has been received but was not expected. Please try again.',
    no_active_subscription: 'You do not have an active subscription.',
    no_permission_to_send_photos: 'Your subscription does not allow sending photos to assistants.',
    no_permission_to_send_voice: 'Your subscription does not allow sending voice messages to assistants.',
    no_permission_to_send_files: 'Your subscription does not allow sending files to assistants.',
    no_permission_to_send_videos: 'Your subscription does not allow sending video notes to assistants.',
    subjectExpected: 'We are waiting for you to provide the subject of your request. Please specify it.', // New translation
      
    },
  };

  const selectedLanguage: Language = (languageCode as Language) || 'en';
  return translations[selectedLanguage]?.[key] || translations['en'][key];
};

type JsonArray = Array<string | number | boolean | { [key: string]: string | number | boolean | JsonArray | JsonObject }>;

interface JsonObject {
  [key: string]: string | number | boolean | JsonArray | JsonObject;
}


// Проверка блокировки пользователя
async function checkUserBlockStatus(ctx: Context) {
  if (!ctx.from?.id) return;

  const telegramId = BigInt(ctx.from.id);


  const user = await prisma.user.findUnique({
    where: { telegramId },
    select: { isBlocked: true, unblockDate: true },
  });


  if (user?.isBlocked && user.unblockDate) {
    const currentTime = new Date();
    const remainingTime = Math.ceil((user.unblockDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60));


    if (remainingTime > 0) {
      await ctx.reply(`Вы заблокированы администратором, до разблокировки осталось ${remainingTime}ч.`);
      return true;
    } else {

      await prisma.user.update({
        where: { telegramId },
        data: { isBlocked: false, unblockDate: null },
      });
      await ctx.reply("Время блокировки вышло, вы можете продолжать пользоваться ботом.");
    }
  }
  return false;
}

// Применение проверки блокировки на каждый запрос к боту
bot.use(async (ctx, next) => {
  const isBlocked = await checkUserBlockStatus(ctx);
  if (!isBlocked) {
    await next();
  }
});




bot.command('end_dialog', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en';

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


    const conversation = await prisma.conversation.findUnique({
      where: { requestId: activeRequest.id },
    });

    if (!conversation) {
      console.error('Ошибка: разговор для запроса не найден');
      await ctx.reply(getTranslation(languageCode, 'error_end_dialog'));
      return;
    }


    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'COMPLETED' },
    });


    await prisma.assistantRequest.update({
      where: { id: activeRequest.id },
      data: { status: 'COMPLETED', isActive: false },
    });




    const messages = conversation.messages as JsonArray | null;
    if (!Array.isArray(messages) || messages.length === 0 || conversation.lastMessageFrom === 'USER') {



      if (activeRequest.assistant) {
        await sendMessageToAssistant(
          ctx,
          activeRequest.assistant.telegramId.toString(),
          `${getTranslation(languageCode, 'user_ended_dialog_no_reward')}`
        );
      } else {
        console.error('Ошибка: ассистент не найден для активного запроса');
      }
    } else {


      if (activeRequest.assistant) {
        const coinsToAdd = 1;
        const reason = 'Завершение диалога';


        const updatedAssistant = await prisma.assistant.update({
          where: { telegramId: activeRequest.assistant.telegramId },
          data: { coins: { increment: coinsToAdd } },
        });


        await prisma.assistantCoinTransaction.create({
          data: {
            assistantId: activeRequest.assistant.telegramId,
            amount: coinsToAdd,
            reason: reason,
          },
        });


        await sendMessageToAssistant(
          ctx,
          updatedAssistant.telegramId.toString(),
          `${getTranslation(languageCode, 'user_ended_dialog')} ${getTranslation(languageCode, 'coin_awarded')}`
        );
      } else {
        console.error('Ошибка: ассистент не найден для активного запроса');
      }
    }

    await ctx.reply(getTranslation(languageCode, 'dialog_closed'));

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


    await prisma.user.update({
      where: { telegramId },
      data: { isActiveAIChat: false },
    });


    userConversations.delete(telegramId);


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

    const referralCode = ctx.message?.text?.split(' ')[1];
    let referrerId = null;
    let code = '';

    if (referralCode && referralCode.startsWith('ref_')) {
      code = referralCode.replace('ref_', '');

      console.log(`Поиск реферального кода: ${code}`);

      const referral = await prisma.referral.findUnique({
        where: { code },
        select: {
          isUsed: true,
          userId: true,
        },
      });

      if (!referral) {
        await ctx.reply('Неверный реферальный код.');
        return;
      }

      if (referral.isUsed) {
        await ctx.reply('Эта реферальная ссылка уже использована.');
        return;
      }

      referrerId = referral.userId;
    }

    const lastUser = await prisma.user.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const nextOrderNumber = lastUser?.orderNumber ? lastUser.orderNumber + 1 : 1;

    console.log(`Создаем или обновляем пользователя с Telegram ID: ${telegramId}`);

    const newUser = await prisma.user.upsert({
      where: { telegramId },
      update: { username },
      create: {
        telegramId,
        username,
        orderNumber: nextOrderNumber,
      },
    });

    if (referrerId && code) {
      console.log(`Обновляем счетчик рефералов для пользователя с ID: ${referrerId}`);

      await prisma.user.update({
        where: { telegramId: referrerId },
        data: {
          referralCount: { increment: 1 },
        },
      });

      console.log(`Обновляем реферальную запись с кодом: ${code}`);

      await prisma.referral.update({
        where: { code },
        data: {
          isUsed: true,
          referredUserId: newUser.telegramId,
        },
      });

      console.log('Реферальная запись успешно обновлена');

      const referrer = await prisma.user.findUnique({
        where: { telegramId: referrerId },
        select: { username: true },
      });
      const referrerUsername = referrer?.username || 'неизвестный пользователь';

      await ctx.reply(`🎉Вы успешно зарегистрировались, используя реферальную ссылку от пользователя @${referrerUsername}.🎉`);
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Ошибка при обработке команды /start:', err.message);
    const languageCode = ctx.from?.language_code || 'en';
    await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
  }
});







const TELEGRAM_LOG_USER_ID = 5829159515;


const sendLogToTelegram = async (message: string) => {
  try {
    await bot.api.sendMessage(TELEGRAM_LOG_USER_ID, message);
  } catch (error) {
    console.error("Ошибка отправки сообщения в Telegram:", error);
  }
};




bot.on("pre_checkout_query", async (ctx) => {
  try {

    await ctx.answerPreCheckoutQuery(true);


    await sendLogToTelegram(`Pre-checkout query received for user ${ctx.from?.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await sendLogToTelegram(`Error in pre-checkout query: ${errorMessage}`);
    console.error("Ошибка при ответе на pre_checkout_query:", errorMessage);
  }
});


bot.on("message:successful_payment", async (ctx) => {
  try {
    const payment = ctx.message?.successful_payment;
    const userId = ctx.from?.id;

    await sendLogToTelegram(`payment: ${JSON.stringify(serializeBigInt(payment))}, type: ${typeof payment}`);
    await sendLogToTelegram(`userId: ${userId}, type: ${typeof userId}`);

    if (payment && userId) {
      const totalStars = payment.total_amount;
      await sendLogToTelegram(`totalStars: ${totalStars}, type: ${typeof totalStars}`);

      const payloadData = JSON.parse(payment.invoice_payload);
      await sendLogToTelegram(`payloadData: ${JSON.stringify(serializeBigInt(payloadData))}, type: ${typeof payloadData}`);

      const { userId: decodedUserId, assistantRequests, aiRequests } = payloadData;
      await sendLogToTelegram(`decodedUserId: ${decodedUserId}, type: ${typeof decodedUserId}`);

      let decodedUserIdBigInt;
      try {
        decodedUserIdBigInt = BigInt(decodedUserId);
        await sendLogToTelegram(`decodedUserIdBigInt: ${decodedUserIdBigInt.toString()}, type: ${typeof decodedUserIdBigInt}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await sendLogToTelegram(`Failed to convert decodedUserId to BigInt: ${errorMessage}`);
        throw new Error(`Invalid decodedUserId format for BigInt conversion`);
      }

      // Determine if this is a tariff purchase or extra requests purchase
      if (assistantRequests || aiRequests) {
        // Extra requests purchase
        try {
          await prisma.userTariff.create({
            data: {
              userId: decodedUserIdBigInt,
              totalAssistantRequests: assistantRequests || 0,
              totalAIRequests: aiRequests || 0,
              remainingAssistantRequests: assistantRequests || 0,
              remainingAIRequests: aiRequests || 0,
              expirationDate: new Date("9999-12-31T23:59:59.999Z"), // Без срока действия
            },
          });

          await sendLogToTelegram(
            `User ${decodedUserIdBigInt.toString()} successfully added extra requests: Assistant = ${assistantRequests}, AI = ${aiRequests}`
          );
        } catch (userTariffError) {
          const errorMessage = userTariffError instanceof Error ? userTariffError.message : String(userTariffError);
          await sendLogToTelegram(`Error creating UserTariff entry for extra requests: ${errorMessage}`);
          throw userTariffError;
        }
      } else {
        // Tariff purchase
        let subscription;
        try {
          await sendLogToTelegram(`Before subscription query: totalStars = ${totalStars}`);
          subscription = await prisma.subscription.findFirst({
            where: {
              price: {
                gte: Number(totalStars) - 0.01,
                lte: Number(totalStars) + 0.01,
              },
            },
          });

          if (!subscription) {
            await sendLogToTelegram(`Subscription not found for price: ${totalStars} stars`);
            throw new Error(`Subscription not found for price: ${totalStars} stars`);
          }

          await sendLogToTelegram(`Subscription found: ${JSON.stringify(serializeBigInt(subscription))}`);
        } catch (subscriptionError) {
          const errorMessage = subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError);
          await sendLogToTelegram(`Error finding subscription: ${errorMessage}`);
          throw subscriptionError;
        }

        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1); // Срок действия подписки: 1 месяц

        try {
          await prisma.userTariff.create({
            data: {
              userId: decodedUserIdBigInt,
              tariffId: subscription.id,
              totalAssistantRequests: subscription.assistantRequestCount || 0,
              totalAIRequests: subscription.aiRequestCount || 0,
              remainingAssistantRequests: subscription.assistantRequestCount || 0,
              remainingAIRequests: subscription.aiRequestCount || 0,
              expirationDate, // Дата истечения подписки
            },
          });

          await sendLogToTelegram(
            `User ${decodedUserIdBigInt.toString()} successfully added a tariff with subscription ID ${subscription.id}.`
          );
        } catch (userTariffError) {
          const errorMessage = userTariffError instanceof Error ? userTariffError.message : String(userTariffError);
          await sendLogToTelegram(`Error creating UserTariff entry: ${errorMessage}`);
          throw userTariffError;
        }
      }

      // Логика реферальных бонусов
      try {
        const referral = await prisma.referral.findFirst({
          where: {
            referredUserId: decodedUserIdBigInt,
            isUsed: true,
          },
          select: {
            userId: true,
          },
        });

        await sendLogToTelegram(`referral: ${JSON.stringify(serializeBigInt(referral))}, type: ${typeof referral}`);

        if (referral) {
          const referringUser = await prisma.user.findUnique({
            where: { telegramId: referral.userId },
            select: { referralPercentage: true },
          });

          if (referringUser) {
            const referralCoins = totalStars * (referringUser.referralPercentage || 0);
            await sendLogToTelegram(
              `Referral found for User ${decodedUserIdBigInt.toString()}. Referring User ${referral.userId.toString()} receives ${referralCoins} coins`
            );

            await prisma.user.update({
              where: { telegramId: referral.userId },
              data: { coins: { increment: referralCoins } },
            });

            await sendLogToTelegram(`User ${referral.userId.toString()} received ${referralCoins} coins as a referral bonus.`);
          } else {
            await sendLogToTelegram(`Referring user not found for User ${decodedUserIdBigInt.toString()}`);
          }
        } else {
          await sendLogToTelegram(`No referral found for User ${decodedUserIdBigInt.toString()}`);
        }
      } catch (referralError) {
        const errorMessage = referralError instanceof Error ? referralError.message : String(referralError);
        await sendLogToTelegram(`Error handling referral bonus: ${errorMessage}`);
        throw referralError;
      }

      await ctx.reply("Ваш платеж прошел успешно! Привилегии активированы.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await sendLogToTelegram(`Error handling successful payment: ${errorMessage}`);
    console.error("Ошибка обработки успешного платежа:", errorMessage);

    await ctx.reply("Произошла ошибка при обработке вашего платежа. Пожалуйста, свяжитесь с поддержкой.");
  }
});




bot.command('problem', async (ctx: Context) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);


    const lastRequest = await prisma.assistantRequest.findFirst({
      where: {
        userId: telegramId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastRequest) {
      await ctx.reply('⚠️ У вас нет запросов.');
      return;
    }


    const existingComplaint = await prisma.complaint.findUnique({
      where: { id: lastRequest.id },
    });

    if (existingComplaint) {
      await ctx.reply('⚠️ Вы уже подали жалобу по этому запросу.');
      return;
    }

    const assistantId = lastRequest.assistantId ?? BigInt(0);


    await prisma.complaint.create({
      data: {
        id: lastRequest.id,
        userId: telegramId,
        assistantId: assistantId,
        text: '',
        status: 'PENDING',
      },
    });


    await prisma.user.update({
      where: { telegramId },
      data: { isWaitingForComplaint: true },
    });


    await ctx.reply('Опишите свою жалобу. После этого вы сможете загрузить скриншоты.');

  } catch (error) {
    console.error('Ошибка при создании жалобы:', error);
    await ctx.reply('Произошла ошибка при создании жалобы. Пожалуйста, попробуйте позже.');
  }
});

bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery?.data;

    if (callbackData === 'complain') {
      // Обработчик для жалобы
      if (!ctx.from?.id) {
        await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
        return;
      }

      const telegramId = BigInt(ctx.from.id);

      const lastRequest = await prisma.assistantRequest.findFirst({
        where: {
          userId: telegramId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!lastRequest) {
        await ctx.reply('⚠️ У вас нет запросов.');
        return;
      }

      const existingComplaint = await prisma.complaint.findUnique({
        where: { id: lastRequest.id },
      });

      if (existingComplaint) {
        await ctx.reply('⚠️ Вы уже подали жалобу по этому запросу.');
        return;
      }

      const assistantId = lastRequest.assistantId ?? BigInt(0);

      await prisma.complaint.create({
        data: {
          id: lastRequest.id,
          userId: telegramId,
          assistantId: assistantId,
          text: '',
          status: 'PENDING',
        },
      });

      await prisma.user.update({
        where: { telegramId },
        data: { isWaitingForComplaint: true },
      });

      await ctx.editMessageText('Опишите свою жалобу. После этого вы сможете загрузить скриншоты.');
    } else if (callbackData === 'satisfied') {
      // Обработчик для кнопки "Я доволен"
      await ctx.reply('Спасибо за использование нашего сервиса');
      await ctx.answerCallbackQuery(); // Закрываем уведомление о callback query
    } else if (callbackData === 'extend_session') {
      // Обработчик для продления сеанса
      if (!ctx.from?.id) {
        await ctx.reply('Ошибка: не удалось получить ваш идентификатор Telegram.');
        return;
      }

      const userId = BigInt(ctx.from.id);

      // Получаем пользователя
      const user = await prisma.user.findUnique({
        where: { telegramId: userId },
        include: { conversations: { orderBy: { createdAt: 'desc' }, take: 1 } }, // Берем последний диалог
      });

      if (!user) {
        await ctx.reply('Ошибка: пользователь не найден.');
        return;
      }

      // Проверка коинов
      if (user.coins < 1) {
        await ctx.reply('У вас недостаточно коинов.');
        return;
      }

      // Обновляем количество коинов пользователя
      await prisma.user.update({
        where: { telegramId: userId },
        data: { assistantRequests: { decrement: 1 } },
      });

      const lastConversation = user.conversations[0];

      // Проверяем, есть ли последний диалог
      if (!lastConversation || !lastConversation.assistantId) {
        await ctx.reply('Ошибка: не удалось найти ассистента для последнего диалога.');
        return;
      }

      const assistantId = lastConversation.assistantId;

      // Отправляем запрос на новый диалог ассистенту
      await sendTelegramMessageWithButtons(
        assistantId.toString(),
        'Новый запрос на продление сеанса.',
        [
          { text: 'Принять', callback_data: `accept_${lastConversation.id}` },
          { text: 'Отклонить', callback_data: `reject_${lastConversation.id}` },
        ]
      );

      await ctx.reply('Ваш запрос на продление сеанса отправлен ассистенту.');
      await ctx.answerCallbackQuery(); // Закрываем уведомление о callback query
    }
  } catch (error) {
    console.error('Ошибка при обработке callback_query:', error);
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
});





bot.on('message:text', async (ctx: Context) => {
  let languageCode: Language = 'en'; // Default language

  try {
    // Determine the user's language
    languageCode = (ctx.from?.language_code as Language) || 'en';

    // Ensure the user ID is present
    if (!ctx.from?.id) {
      console.error('No user ID found in the message context.');
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id); // Convert user ID to BigInt
    const userMessage = ctx.message?.text;

    if (!userMessage) {
      console.error(`No text message received from user ID: ${telegramId.toString()}`);
      await ctx.reply(getTranslation(languageCode, 'no_text_message'));
      return;
    }

    console.log(`Received message from user ID: ${telegramId.toString()} - Message: ${userMessage}`);

    // Find the user in the database
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      console.error(`No user found with telegramId: ${telegramId.toString()}`);
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    console.log(
      `User found: ${JSON.stringify(
        { ...user, telegramId: user.telegramId.toString() },
        serializeBigInt,
        2
      )}`
    );

    // Handle if the user is waiting to file a complaint
    if (user.isWaitingForComplaint) {
      console.log(`User ${telegramId.toString()} is waiting to file a complaint.`);
      await handleUserComplaint(telegramId, userMessage, languageCode, ctx);
      return;
    }

    // Handle if the user is waiting to provide a subject for their request
    if (user.isWaitingForSubject) {
      console.log(`User ${telegramId.toString()} is providing a subject for their request.`);
      const activeRequest = await prisma.assistantRequest.findFirst({
        where: { userId: telegramId, isActive: true, subject: null },
      });

      if (activeRequest) {
        console.log(
          `Active request for subject: ${JSON.stringify(
            { ...activeRequest, userId: activeRequest.userId.toString() },
            serializeBigInt,
            2
          )}`
        );

        // Update the assistant request with the subject
        await prisma.assistantRequest.update({
          where: { id: activeRequest.id },
          data: { subject: userMessage },
        });

        console.log(`Subject updated for request ID: ${activeRequest.id} - Subject: ${userMessage}`);

        // Update the user's state
        await prisma.user.update({
          where: { telegramId },
          data: { isWaitingForSubject: false },
        });

        console.log(`User ${telegramId.toString()} is no longer waiting for a subject.`);

        // Assign an assistant to the updated request
        await assignAssistantToRequest(activeRequest, languageCode);

        await ctx.reply(getTranslation(languageCode, 'subjectReceived'));
      } else {
        console.error(
          `No active request found for user ID: ${telegramId.toString()} while expecting a subject.`
        );
        await ctx.reply(getTranslation(languageCode, 'no_active_request'));
      }
      return;
    }

    // Handle active AI chat
    if (user.isActiveAIChat) {
      console.log(`User ${telegramId.toString()} is in active AI chat.`);
      await handleAIChat(telegramId, userMessage, ctx);
      return;
    }

    // Check for an active conversation
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        userId: telegramId,
        status: 'IN_PROGRESS',
      },
      include: { assistant: true },
    });

    if (activeConversation) {
      console.log(
        `Active conversation found: ${JSON.stringify(
          { ...activeConversation, userId: activeConversation.userId.toString() },
          serializeBigInt,
          2
        )}`
      );

      if (activeConversation.assistant) {
        console.log(`Sending message to assistant ID: ${activeConversation.assistant.telegramId}`);

        // Находим все активные запросы для этого ассистента, чтобы определить индекс
        const allActiveConversations = await prisma.conversation.findMany({
          where: {
            assistantId: activeConversation.assistant.telegramId,
            status: 'IN_PROGRESS',
          },
          orderBy: {
            createdAt: 'asc', // Так же, как при выводе списка
          },
          include: {
            assistantRequest: true,
          },
        });

        // Находим индекс текущего разговора в списке
        const currentIndex = allActiveConversations.findIndex(
          (conv) => conv.id === activeConversation.id
        );

        // Формируем префикс: Запрос {номер}
        const prefix = `Запрос ${currentIndex + 1}: `;

        // Добавляем префикс к сообщению перед отправкой ассистенту
        await sendMessageToAssistant(
          ctx,
          activeConversation.assistant.telegramId.toString(),
          prefix + userMessage
        );
      } else {
        console.error(
          `No assistant assigned to the active conversation with ID: ${activeConversation.id}`
        );
        await ctx.reply(getTranslation(languageCode, 'no_active_dialogs'));
      }
    } else {
      // No active conversation or dialogs
      console.log(`No active conversation found for user ID: ${telegramId.toString()}`);
      if (user.isWaitingForSubject) {
        await ctx.reply(getTranslation(languageCode, 'subjectExpected'));
      } else {
        await ctx.reply(getTranslation(languageCode, 'no_active_dialogs'));
      }
    }
  } catch (error) {
    console.error('Error processing the message:', error);
    await ctx.reply(getTranslation(languageCode, 'server_error'));
  }
});






bot.on('message:photo', async (ctx: Context) => {
  let languageCode: string = 'en'; // Установка значения по умолчанию

  try {
    // Определяем язык пользователя
    languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    // Проверка существования пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    // Проверяем, есть ли активные подписки, разрешающие отправку фотографий
    const activeTariffs = await prisma.userTariff.findMany({
      where: {
        userId: telegramId,
        expirationDate: { gte: new Date() }, // Проверяем, что срок действия не истек
      },
      select: {
        tariffId: true,
      },
    });

    // Фильтрация валидных тарифов (исключаем null)
    const validTariffIds = activeTariffs.map((tariff) => tariff.tariffId).filter((id): id is bigint => id !== null);

    if (validTariffIds.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_active_subscription'));
      return;
    }

    // Проверяем, есть ли среди активных подписок разрешение на отправку фотографий ассистенту
    const hasPermission = await prisma.subscription.findMany({
      where: {
        id: { in: validTariffIds },
        allowFilesToAssistant: true,
      },
    });

    if (hasPermission.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_permission_to_send_photos'));
      return;
    }

    // Если разрешение есть, продолжаем обработку фотографии
    if (ctx.message?.photo) {
      const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];

      // Получаем ссылку на файл
      const file = await ctx.api.getFile(largestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${file.file_path}`;

      if (user.isWaitingForSubject) {
        console.log(`User ${telegramId.toString()} is providing a subject as a photo.`);

        const activeRequest = await prisma.assistantRequest.findFirst({
          where: { userId: telegramId, isActive: true, subject: null },
        });

        if (activeRequest) {
          console.log(
            `Active request for subject as photo: ${JSON.stringify(
              { ...activeRequest, userId: activeRequest.userId.toString() },
              null,
              2
            )}`
          );

          // Сохраняем ссылку на фото как тему
          await prisma.assistantRequest.update({
            where: { id: activeRequest.id },
            data: { subject: fileUrl },
          });

          console.log(`Subject updated for request ID: ${activeRequest.id} - Subject (photo URL): ${fileUrl}`);

          // Обновляем состояние пользователя
          await prisma.user.update({
            where: { telegramId },
            data: { isWaitingForSubject: false },
          });

          console.log(`User ${telegramId.toString()} is no longer waiting for a subject.`);

          // Назначаем ассистента на обновлённую заявку
          await assignAssistantToRequest(activeRequest, languageCode);

          await ctx.reply(getTranslation(languageCode, 'subjectReceived'));
        } else {
          console.error(
            `No active request found for user ID: ${telegramId.toString()} while expecting a subject.`
          );
          await ctx.reply(getTranslation(languageCode, 'no_active_request'));
        }
      } else {
        // Если пользователь не в режиме ожидания темы
        await ctx.reply(getTranslation(languageCode, 'unexpected_photo'));
      }
    } else {
      await ctx.reply(getTranslation(languageCode, 'no_photo_detected'));
    }
  } catch (error) {
    console.error('Error processing photo:', error);
    // Используем доступный languageCode
    await ctx.reply(getTranslation(languageCode, 'server_error'));
  }
});

bot.on('message:voice', async (ctx) => {
  let languageCode: string = 'en'; // Установка значения по умолчанию

  try {
    languageCode = ctx.from?.language_code || 'en'; // Определяем язык пользователя

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const currentTime = new Date();

    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    // Проверяем, есть ли активные подписки, разрешающие отправку голосовых сообщений ассистенту
    const activeTariffs = await prisma.userTariff.findMany({
      where: {
        userId: telegramId,
        expirationDate: { gte: new Date() }, // Проверяем, что срок действия не истек
      },
      select: {
        tariffId: true,
      },
    });

    // Фильтруем валидные тарифы (исключаем null)
    const validTariffIds = activeTariffs.map((tariff) => tariff.tariffId).filter((id): id is bigint => id !== null);

    if (validTariffIds.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_active_subscription'));
      return;
    }

    // Проверяем, есть ли среди активных подписок разрешение на отправку голосовых сообщений
    const hasPermission = await prisma.subscription.findMany({
      where: {
        id: { in: validTariffIds },
        allowVoiceToAssistant: true,
      },
    });

    if (hasPermission.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_permission_to_send_voice'));
      return;
    }

    // Если пользователь ожидает ввода темы
    if (user.isWaitingForSubject) {
      console.log(`User ${telegramId.toString()} is providing a subject as a voice message.`);

      const activeRequest = await prisma.assistantRequest.findFirst({
        where: { userId: telegramId, isActive: true, subject: null },
      });

      if (activeRequest) {
        const voice = ctx.message.voice;
        const fileId = voice.file_id;

        // Получаем ссылку на файл
        const file = await ctx.api.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${file.file_path}`;

        // Сохраняем ссылку на голосовое сообщение как тему
        await prisma.assistantRequest.update({
          where: { id: activeRequest.id },
          data: { subject: fileUrl },
        });

        console.log(`Subject updated for request ID: ${activeRequest.id} - Subject (voice URL): ${fileUrl}`);

        // Обновляем состояние пользователя
        await prisma.user.update({
          where: { telegramId },
          data: { isWaitingForSubject: false },
        });

        console.log(`User ${telegramId.toString()} is no longer waiting for a subject.`);

        // Назначаем ассистента на обновлённую заявку
        await assignAssistantToRequest(activeRequest, languageCode);

        await ctx.reply(getTranslation(languageCode, 'subjectReceived'));
        return;
      } else {
        console.error(
          `No active request found for user ID: ${telegramId.toString()} while expecting a subject.`
        );
        await ctx.reply(getTranslation(languageCode, 'no_active_request'));
        return;
      }
    }

    // Если у пользователя есть активный диалог
    const activeRequest = await prisma.assistantRequest.findFirst({
      where: { userId: telegramId, isActive: true },
      include: { assistant: true },
    });

    if (activeRequest && activeRequest.assistant) {
      const voice = ctx.message.voice;
      const fileId = voice.file_id;
      const fileInfo = await ctx.api.getFile(fileId);
      const fileLink = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${fileInfo.file_path}`;

      const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
      const voiceBuffer = Buffer.from(response.data, 'binary');
      const fileName = 'voice.ogg';

      await sendFileToAssistant(activeRequest.assistant.telegramId.toString(), voiceBuffer, fileName);
      await ctx.reply('Голосовое сообщение успешно отправлено ассистенту.');

      await prisma.conversation.update({
        where: { id: activeRequest.id },
        data: {
          lastMessageFrom: 'USER',
          lastUserMessageAt: currentTime,
        },
      });
      return;
    }

    // Если тема не ожидается и активного диалога нет
    await ctx.reply(getTranslation(languageCode, 'unexpected_voice'));
  } catch (error) {
    console.error('Ошибка при обработке голосового сообщения:', error);
    await ctx.reply(getTranslation(languageCode, 'server_error'));
  }
});




bot.on('message:document', async (ctx) => {
  let languageCode: string = 'en'; // Установка значения по умолчанию

  try {
    languageCode = ctx.from?.language_code || 'en'; // Определяем язык пользователя

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const currentTime = new Date();

    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    // Проверяем, есть ли активные подписки, разрешающие отправку файлов ассистенту
    const activeTariffs = await prisma.userTariff.findMany({
      where: {
        userId: telegramId,
        expirationDate: { gte: new Date() }, // Проверяем, что срок действия не истек
      },
      select: {
        tariffId: true,
      },
    });

    // Фильтруем валидные тарифы (исключаем null)
    const validTariffIds = activeTariffs.map((tariff) => tariff.tariffId).filter((id): id is bigint => id !== null);

    if (validTariffIds.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_active_subscription'));
      return;
    }

    // Проверяем, есть ли среди активных подписок разрешение на отправку файлов
    const hasPermission = await prisma.subscription.findMany({
      where: {
        id: { in: validTariffIds },
        allowFilesToAssistant: true,
      },
    });

    if (hasPermission.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_permission_to_send_files'));
      return;
    }

    // Если пользователь ожидает ввода темы
    if (user.isWaitingForSubject) {
      console.log(`User ${telegramId.toString()} is providing a subject as a file message.`);

      const activeRequest = await prisma.assistantRequest.findFirst({
        where: { userId: telegramId, isActive: true, subject: null },
      });

      if (activeRequest) {
        const document = ctx.message.document;
        const fileId = document.file_id;

        // Получаем ссылку на файл
        const fileInfo = await ctx.api.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${fileInfo.file_path}`;

        // Сохраняем ссылку на файл как тему
        await prisma.assistantRequest.update({
          where: { id: activeRequest.id },
          data: { subject: fileUrl },
        });

        console.log(`Subject updated for request ID: ${activeRequest.id} - Subject (file URL): ${fileUrl}`);

        // Обновляем состояние пользователя
        await prisma.user.update({
          where: { telegramId },
          data: { isWaitingForSubject: false },
        });

        console.log(`User ${telegramId.toString()} is no longer waiting for a subject.`);

        // Назначаем ассистента на обновлённую заявку
        await assignAssistantToRequest(activeRequest, languageCode);

        await ctx.reply(getTranslation(languageCode, 'subjectReceived'));
        return;
      } else {
        console.error(
          `No active request found for user ID: ${telegramId.toString()} while expecting a subject.`
        );
        await ctx.reply(getTranslation(languageCode, 'no_active_request'));
        return;
      }
    }

    // Если у пользователя есть активный диалог
    const activeRequest = await prisma.assistantRequest.findFirst({
      where: { userId: telegramId, isActive: true },
      include: { assistant: true },
    });

    if (activeRequest && activeRequest.assistant) {
      const document = ctx.message.document;
      const fileId = document.file_id;
      const fileInfo = await ctx.api.getFile(fileId);
      const fileLink = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${fileInfo.file_path}`;

      const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(response.data, 'binary');
      const fileName = document.file_name || 'document';

      await sendFileToAssistant(activeRequest.assistant.telegramId.toString(), fileBuffer, fileName);
      await ctx.reply('Файл успешно отправлен ассистенту.');

      await prisma.conversation.update({
        where: { id: activeRequest.id },
        data: {
          lastMessageFrom: 'USER',
          lastUserMessageAt: currentTime,
        },
      });
      return;
    }

    // Если тема не ожидается и активного диалога нет
    await ctx.reply(getTranslation(languageCode, 'unexpected_file'));
  } catch (error) {
    console.error('Ошибка при обработке документа:', error);
    await ctx.reply(getTranslation(languageCode, 'server_error'));
  }
});



bot.on('message:video_note', async (ctx) => {
  let languageCode: string = 'en'; // Установка значения по умолчанию

  try {
    languageCode = ctx.from?.language_code || 'en'; // Определение языка пользователя

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const currentTime = new Date();

    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    // Проверяем, есть ли активные подписки, разрешающие отправку видео ассистенту
    const activeTariffs = await prisma.userTariff.findMany({
      where: {
        userId: telegramId,
        expirationDate: { gte: new Date() }, // Проверяем, что срок действия не истек
      },
      select: {
        tariffId: true,
      },
    });

    // Фильтруем валидные тарифы (исключаем null)
    const validTariffIds = activeTariffs.map((tariff) => tariff.tariffId).filter((id): id is bigint => id !== null);

    if (validTariffIds.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_active_subscription'));
      return;
    }

    // Проверяем, есть ли среди активных подписок разрешение на отправку видео
    const hasPermission = await prisma.subscription.findMany({
      where: {
        id: { in: validTariffIds },
        allowVideoToAssistant: true,
      },
    });

    if (hasPermission.length === 0) {
      await ctx.reply(getTranslation(languageCode, 'no_permission_to_send_videos'));
      return;
    }

    // Если пользователь ожидает ввода темы
    if (user.isWaitingForSubject) {
      console.log(`User ${telegramId.toString()} is providing a subject as a video note.`);

      const activeRequest = await prisma.assistantRequest.findFirst({
        where: { userId: telegramId, isActive: true, subject: null },
      });

      if (activeRequest) {
        const videoNote = ctx.message.video_note;
        const fileId = videoNote.file_id;

        // Получаем ссылку на файл
        const fileInfo = await ctx.api.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${fileInfo.file_path}`;

        // Сохраняем ссылку на видео-кружок как тему
        await prisma.assistantRequest.update({
          where: { id: activeRequest.id },
          data: { subject: fileUrl },
        });

        console.log(`Subject updated for request ID: ${activeRequest.id} - Subject (video note URL): ${fileUrl}`);

        // Обновляем состояние пользователя
        await prisma.user.update({
          where: { telegramId },
          data: { isWaitingForSubject: false },
        });

        console.log(`User ${telegramId.toString()} is no longer waiting for a subject.`);

        // Назначаем ассистента на обновлённую заявку
        await assignAssistantToRequest(activeRequest, languageCode);

        await ctx.reply(getTranslation(languageCode, 'subjectReceived'));
        return;
      } else {
        console.error(
          `No active request found for user ID: ${telegramId.toString()} while expecting a subject.`
        );
        await ctx.reply(getTranslation(languageCode, 'no_active_request'));
        return;
      }
    }

    // Если у пользователя есть активный диалог
    const activeRequest = await prisma.assistantRequest.findFirst({
      where: { userId: telegramId, isActive: true },
      include: { assistant: true },
    });

    if (activeRequest && activeRequest.assistant) {
      const videoNote = ctx.message.video_note;
      const fileId = videoNote.file_id;
      const fileInfo = await ctx.api.getFile(fileId);
      const fileLink = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${fileInfo.file_path}`;

      const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(response.data, 'binary');
      const fileName = 'video_note.mp4';

      await sendFileToAssistant(activeRequest.assistant.telegramId.toString(), fileBuffer, fileName);
      await ctx.reply('Видео-кружок успешно отправлен ассистенту.');

      await prisma.conversation.update({
        where: { id: activeRequest.id },
        data: {
          lastMessageFrom: 'USER',
          lastUserMessageAt: currentTime,
        },
      });
      return;
    }

    // Если тема не ожидается и активного диалога нет
    await ctx.reply(getTranslation(languageCode, 'unexpected_file'));
  } catch (error) {
    console.error('Ошибка при обработке видео-кружка:', error);
    await ctx.reply(getTranslation(languageCode, 'server_error'));
  }
});




async function sendTelegramMediaToAssistant(userId: string, mediaUrl: string, caption: string): Promise<void> {
  try {
    console.log(`sendTelegramMediaToAssistant: Preparing to send media to user ${userId}`);
    console.log(`Media URL: ${mediaUrl}, Caption: ${caption}`);

    if (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.png')) {
      console.log('Detected media type: Photo');
      await sendPhoto(userId, mediaUrl, caption);
    } else if (mediaUrl.endsWith('.mp4')) {
      console.log('Detected media type: Video');
      await sendVideo(userId, mediaUrl, caption);
    } else if (mediaUrl.endsWith('.ogg') || mediaUrl.endsWith('.mp3') || mediaUrl.endsWith('.oga')) {
      console.log('Detected media type: Voice');
      await sendVoice(userId, mediaUrl, caption);
    } else {
      console.log('Unsupported media type, treating as a document:', mediaUrl);
      await sendDocument(userId, mediaUrl, caption);
    }
  } catch (error) {
    console.error("Error sending media to assistant:", error);
    throw error;
  }
}

async function handleUserComplaint(telegramId: bigint, userMessage: string, languageCode: string, ctx: Context) {
  try {

    const lastComplaint = await prisma.complaint.findFirst({
      where: {
        userId: telegramId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });


    if (!lastComplaint) {
      await ctx.reply("Жалоба не найдена");
      return;
    }


    await prisma.complaint.update({
      where: { id: lastComplaint.id },
      data: { text: userMessage },
    });


    await prisma.user.update({
      where: { telegramId },
      data: { isWaitingForComplaint: false },
    });

    await ctx.reply(getTranslation(languageCode, 'complaint_submitted'));
  } catch (error) {
    console.error('Ошибка при обновлении жалобы:', error);
    await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
  }
}


async function handleAIChat(telegramId: bigint, userMessage: string, ctx: Context) {


  const modelData = await prisma.openAi.findFirst();
  if (!modelData) {
    await ctx.reply('Не удалось загрузить настройки AI. Пожалуйста, попробуйте позже.');
    return;
  }

  const systemPrompt = modelData.prompt;
  const maxTokensPerRequest = modelData.maxTokensPerRequest;


  const combinedMessage = `${systemPrompt}\n${userMessage}`;


  const messages: ChatMessage[] = userConversations.get(telegramId) || [];


  messages.push({ role: 'user', content: combinedMessage });

  console.log(messages);


  const inputTokens = messages.reduce((total, msg) => total + encode(msg.content).length, 0);
  const maxAllowedTokens = maxTokensPerRequest;
  const responseTokensLimit = 500;

  if (inputTokens + responseTokensLimit > maxAllowedTokens) {
    await ctx.reply('Ваш запрос слишком длинный. Попробуйте сократить его.');
    return;
  }

  try {

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: responseTokensLimit,
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
      await ctx.reply('AI не смог сгенерировать ответ.');
    }
  } catch (error) {
    console.error('Ошибка при работе с OpenAI API:', error);
    await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова позже.');
  }
}


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


type TelegramButton = {
  text: string;
  callback_data: string;
};

function serializeBigInt(obj: unknown): unknown {
  if (typeof obj === 'bigint') {
    return obj.toString(); // Преобразуем BigInt в строку
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt); // Рекурсивно обрабатываем массивы
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    ); // Рекурсивно обрабатываем объекты
  }
  return obj; // Возвращаем остальные типы (string, number, boolean и т. д.)
}

// Logging function with type safety
function logWithBigInt<T>(obj: T): void {
  console.log(JSON.stringify(obj, serializeBigInt, 2));
}


async function assignAssistantToRequest(assistantRequest: AssistantRequest, languageCode: string) {
  try {
    console.log(`Assigning assistant for request ID: ${assistantRequest.id}`);
    console.log(`Request details: ${JSON.stringify(assistantRequest, serializeBigInt, 2)}`);

    const userIdBigInt = assistantRequest.userId;

    // Fetch only assistants who are working and not blocked
    const availableAssistants = await prisma.assistant.findMany({
      where: {
        isWorking: true,
        isBlocked: false, // Exclude blocked assistants
        telegramId: { notIn: assistantRequest.ignoredAssistants || [] },
      },
    });

    logWithBigInt({ availableAssistants });

    const assistantsWithPenalties = await Promise.all(
      availableAssistants.map(async (assistant) => {
        const penaltyPoints = await getPenaltyPointsForLast24Hours(assistant.telegramId);
        return { ...assistant, penaltyPoints };
      })
    );

    logWithBigInt({ assistantsWithPenalties });

    // Sort assistants based on penalties and activity
    assistantsWithPenalties.sort((a, b) => {
      if (a.penaltyPoints !== b.penaltyPoints) {
        return a.penaltyPoints - b.penaltyPoints;
      }
      return (b.lastActiveAt ? b.lastActiveAt.getTime() : 0) - (a.lastActiveAt ? a.lastActiveAt.getTime() : 0);
    });

    console.log(`Sorted assistants: ${JSON.stringify(assistantsWithPenalties, serializeBigInt, 2)}`);

    if (assistantsWithPenalties.length === 0) {
      console.log('No available assistants after sorting.');
      await sendTelegramMessageToUser(userIdBigInt.toString(), getTranslation(languageCode, 'noAssistantsAvailable'));
      return;
    }

    const selectedAssistant = assistantsWithPenalties[0];

    console.log(`Selected assistant: ${JSON.stringify(selectedAssistant, serializeBigInt, 2)}`);

    // Assign the selected assistant to the request
    await prisma.assistantRequest.update({
      where: { id: assistantRequest.id },
      data: { assistantId: selectedAssistant.telegramId },
    });

    const updatedRequest = await prisma.assistantRequest.findUnique({ where: { id: assistantRequest.id } });

    console.log(`Updated request after assigning assistant: ${JSON.stringify(updatedRequest, serializeBigInt, 2)}`);

    const messageText = updatedRequest?.subject
      ? updatedRequest.subject.startsWith('http')
        ? `${getTranslation(languageCode, 'assistantRequestMessage')}`
        : `${getTranslation(languageCode, 'assistantRequestMessage')}\n\nТема: ${updatedRequest.subject}`
      : `${getTranslation(languageCode, 'assistantRequestMessage')}\n\nТема: отсутствует`;

    if (updatedRequest?.subject?.startsWith('http')) {
      // If subject is a media link, send it to the assistant
      await sendTelegramMediaToAssistant(
        selectedAssistant.telegramId.toString(),
        updatedRequest.subject,
        ''
      );

      // Follow up with message containing action buttons
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        getTranslation(languageCode, 'assistantRequestMessage'),
        [
          { text: getTranslation(languageCode, 'accept'), callback_data: `accept_${assistantRequest.id.toString()}` },
          { text: getTranslation(languageCode, 'reject'), callback_data: `reject_${assistantRequest.id.toString()}` },
        ]
      );
    } else {
      // If subject is text, send message with action buttons
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        messageText,
        [
          { text: getTranslation(languageCode, 'accept'), callback_data: `accept_${assistantRequest.id.toString()}` },
          { text: getTranslation(languageCode, 'reject'), callback_data: `reject_${assistantRequest.id.toString()}` },
        ]
      );
    }

    console.log(`Message sent to assistant ID: ${selectedAssistant.telegramId}`);

    await sendTelegramMessageToUser(userIdBigInt.toString(), getTranslation(languageCode, 'requestSent'));
  } catch (error) {
    console.error('Error assigning assistant:', error);
    await sendLogToTelegram(`Error assigning assistant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    await sendTelegramMessageToUser(assistantRequest.userId.toString(), getTranslation(languageCode, 'server_error'));
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
    console.log(`sendVideo: Preparing to send video to user ${userId}`);
    console.log(`Video Media URL: ${mediaUrl}, Caption: ${caption}`);

    // Загрузка видео с mediaUrl
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(response.data, 'binary');
    const fileName = 'video.mp4'; // Имя файла для видео

    console.log(`Sending video to user ${userId}`);

    // Отправка видео как файла
    await assistantBot.api.sendVideo(userId, new InputFile(videoBuffer, fileName), {
      caption: caption,
    });

    console.log(`Video successfully sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending video to user ${userId}:`, error);
  }
}


// Функция для отправки голосового сообщения
async function sendVoice(userId: string, mediaUrl: string, caption: string) {
  try {
    console.log(`sendVoice: Preparing to send voice message to user ${userId}`);
    console.log(`Voice Media URL: ${mediaUrl}, Caption: ${caption}`);

    // Загрузка голосового сообщения с mediaUrl
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const voiceBuffer = Buffer.from(response.data, 'binary');
    const fileName = 'voice.ogg'; // Имя файла для голосового сообщения

    console.log(`Sending voice message to user ${userId}`);

    // Отправка голосового сообщения как файла
    await assistantBot.api.sendDocument(userId, new InputFile(voiceBuffer, fileName));

    console.log(`Voice message successfully sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending voice message to user ${userId}:`, error);
  }
}

async function sendDocument(userId: string, mediaUrl: string, caption: string) {
  try {
    console.log(`sendDocument: Preparing to send document to user ${userId}`);
    console.log(`Document Media URL: ${mediaUrl}, Caption: ${caption}`);

    // Загрузка документа с mediaUrl
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const documentBuffer = Buffer.from(response.data, 'binary');
    const fileName = mediaUrl.split('/').pop() || 'document'; // Получаем имя файла из URL

    console.log(`Sending document to user ${userId}`);

    // Отправка документа
    await assistantBot.api.sendDocument(userId, new InputFile(documentBuffer, fileName), {
      caption: caption,
    });

    console.log(`Document successfully sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending document to user ${userId}:`, error);
  }
}

async function getPenaltyPointsForLast24Hours(
  assistantId: bigint
): Promise<number> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const assistantIdNumber = Number(assistantId);

  const actions = await prisma.requestAction.findMany({
    where: {
      assistantId: assistantIdNumber,
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

async function sendTelegramMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}





export const POST = webhookCallback(bot, 'std/http');