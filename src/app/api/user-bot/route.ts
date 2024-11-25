import { Bot, webhookCallback } from 'grammy';
import { Context } from 'grammy';
import OpenAI from 'openai';
import { PrismaClient, AssistantRequest } from '@prisma/client';
import { InputFile } from 'grammy';
import { encode } from 'gpt-3-encoder';
import axios from 'axios';
import FormData from 'form-data';

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
    console.error('Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const assistantBot = new Bot(botToken);

  try {
    if (message) {

      await assistantBot.api.sendMessage(assistantChatId, message);
    } else if (ctx && ctx.chat && ctx.message) {

      await assistantBot.api.copyMessage(
        assistantChatId,
        ctx.chat.id,
        ctx.message.message_id
      );
    } else {
      console.error('Ошибка: ни message, ни ctx не определены или ctx.chat/ctx.message отсутствуют');
      return;
    }


    const assistantTelegramId = BigInt(assistantChatId);

    const activeConversation = await prisma.conversation.findFirst({
      where: {
        assistantId: assistantTelegramId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeConversation) {
      const currentTime = new Date();

      const newMessage = {
        sender: 'USER',
        message: message || 'Media message',
        timestamp: currentTime.toISOString(),
      };

      const updatedMessages = [
        ...(activeConversation.messages as Array<{
          sender: string;
          message: string;
          timestamp: string;
        }>),
        newMessage,
      ];

      await prisma.conversation.update({
        where: { id: activeConversation.id },
        data: {
          lastMessageFrom: 'USER',
          lastUserMessageAt: currentTime,
          messages: updatedMessages,
        },
      });
    } else {
      console.error('Ошибка: активный разговор не найден для ассистента');
    }
  } catch (error) {
    console.error('Ошибка при отправке сообщения ассистенту:', error);
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
  | 'reject'; // Ensure all keys are included here


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
      dialog_closed: 'Диалог с ассистентом завершен. Спасибо за использование нашего сервиса! Написать жалобу вы можете вызвав команду /problem',
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
      assistantRequestMessage: "Запрос пользователя на разговор",
      noAssistantsAvailable: 'Нет доступных ассистентов',
      requestSent: "Запрос отправлен ассистенту.",
      accept: 'Принять',
      reject: 'Отклонить',


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


    if (activeRequest.assistant) {
      await prisma.assistant.update({
        where: { telegramId: activeRequest.assistant.telegramId },
        data: { isBusy: false },
      });
    } else {
      console.error('Ошибка: ассистент не найден для запроса');
    }


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

    await sendLogToTelegram(`payment: ${JSON.stringify(payment)}, type: ${typeof payment}`);
    await sendLogToTelegram(`userId: ${userId}, type: ${typeof userId}`);

    if (payment && userId) {
      const totalStars = payment.total_amount;
      await sendLogToTelegram(`totalStars: ${totalStars}, type: ${typeof totalStars}`);

      const payloadData = JSON.parse(payment.invoice_payload);
      await sendLogToTelegram(`payloadData: ${JSON.stringify(payloadData)}, type: ${typeof payloadData}`);

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
              expirationDate: "never", // Set expirationDate to "never"
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
        } catch (subscriptionError) {
          const errorMessage = subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError);
          await sendLogToTelegram(`Error finding subscription: ${errorMessage}`);
          throw subscriptionError;
        }

        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1); // Set expiration date to 1 month later

        try {
          await prisma.userTariff.create({
            data: {
              userId: decodedUserIdBigInt,
              tariffId: null, // No tariff ID for extra requests
              totalAssistantRequests: assistantRequests || 0,
              totalAIRequests: aiRequests || 0,
              remainingAssistantRequests: assistantRequests || 0,
              remainingAIRequests: aiRequests || 0,
              expirationDate: new Date("9999-12-31T23:59:59.999Z"), // Equivalent to "never"
            },
          });

          await sendLogToTelegram(
            `User ${decodedUserIdBigInt.toString()} successfully added a tariff to UserTariff table.`
          );
        } catch (userTariffError) {
          const errorMessage = userTariffError instanceof Error ? userTariffError.message : String(userTariffError);
          await sendLogToTelegram(`Error creating UserTariff entry: ${errorMessage}`);
          throw userTariffError;
        }
      }

      // Referral logic remains unchanged
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

        await sendLogToTelegram(`referral: ${JSON.stringify(referral)}, type: ${typeof referral}`);

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
  const languageCode: Language = 'en'; // Declare languageCode outside the try block

  try {
    const languageCode: Language = ctx.from?.language_code as Language || 'en';

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

    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    if (user.isWaitingForComplaint) {
      await handleUserComplaint(telegramId, userMessage, languageCode, ctx);
      return;
    }

    if (user.isWaitingForSubject) {
      const activeRequest = await prisma.assistantRequest.findFirst({
        where: { userId: telegramId, isActive: true, subject: null },
      });

      if (activeRequest) {
        await prisma.assistantRequest.update({
          where: { id: activeRequest.id },
          data: { subject: userMessage },
        });

        await prisma.user.update({
          where: { telegramId },
          data: { isWaitingForSubject: false },
        });

        await assignAssistantToRequest(activeRequest, languageCode);

        await ctx.reply(getTranslation(languageCode, 'subjectReceived'));
      } else {
        await ctx.reply(getTranslation(languageCode, 'no_active_request'));
      }
      return;
    }

    if (user.isActiveAIChat) {
      await handleAIChat(telegramId, userMessage, ctx);
    } else {
      const activeRequest = await prisma.assistantRequest.findFirst({
        where: { userId: telegramId, isActive: true },
        include: { assistant: true },
      });

      if (activeRequest) {
        if (activeRequest.assistant) {
          await sendMessageToAssistant(
            ctx,
            activeRequest.assistant.telegramId.toString(),
            userMessage
          );
        } else {
          console.error('Ошибка: Ассистент не найден для активного запроса.');
        }
      } else {
        await ctx.reply(getTranslation(languageCode, 'no_active_dialogs'));
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await ctx.reply(getTranslation(languageCode, 'server_error')); // languageCode is now accessible
  }
});





bot.on('message:photo', async (ctx: Context) => {
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
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    if (ctx.message?.photo) {

      const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];

      const file = await ctx.api.getFile(largestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${file.file_path}`;


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
        await ctx.reply('Ошибка: не найдена активная жалоба для прикрепления фото.');
        return;
      }


      await prisma.complaint.update({
        where: { id: lastComplaint.id },
        data: {
          photoUrls: { push: fileUrl },
        },
      });

      await ctx.reply('Скриншоты были успешно прикреплены к вашей жалобе.');
    } else {
      await ctx.reply('Пожалуйста, отправьте фото для прикрепления к жалобе.');
    }
  } catch (error) {
    console.error('Ошибка при обработке фото:', error);
    await ctx.reply('Произошла ошибка при загрузке ваших фото.');
  }
});



bot.on('message:voice', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const currentTime = new Date();

    const [user, activeRequest] = await Promise.all([
      prisma.user.findUnique({
        where: { telegramId },
        include: { lastPaidSubscription: true },
      }),
      prisma.assistantRequest.findFirst({
        where: { user: { telegramId }, isActive: true },
        include: { assistant: true },
      }),
    ]);

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    const subscription = user.lastPaidSubscription;

    if (user.isActiveAIChat) {
      if (!subscription?.allowVoiceToAI) {
        await ctx.reply('Отправка голосовых сообщений ИИ не разрешена для вашей подписки.');
        return;
      }

      try {
        const voice = ctx.message.voice;
        const fileId = voice.file_id;


        const file = await ctx.api.getFile(fileId);
        const fileLink = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${file.file_path}`;


        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(response.data, 'binary');


        const formData = new FormData();
        formData.append('file', audioBuffer, { filename: 'audio.ogg' });
        formData.append('model', 'whisper-1');


        const transcriptionResponse = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          }
        );


        const transcribedText = transcriptionResponse.data.text;


        const openAiModel = await prisma.openAi.findFirst({});
        if (!openAiModel) {
          console.error('Не удалось загрузить промпт OpenAi.');
          await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова позже.');
          return;
        }


        const combinedMessage = `${transcribedText}`;


        const inputTokens = encode(combinedMessage).length;
        const maxAllowedTokens = 4096;
        const responseTokensLimit = 500;

        if (inputTokens + responseTokensLimit > maxAllowedTokens) {
          await ctx.reply('Ваш запрос слишком длинный. Попробуйте сократить его.');
          return;
        }


        await handleAIChat(telegramId, combinedMessage, ctx);

      } catch (error) {
        console.error('Ошибка при обработке голосового сообщения:', error);
        await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова позже.');
      }
    }

    else if (activeRequest && activeRequest.assistant) {
      if (!subscription?.allowVoiceToAssistant) {
        await ctx.reply('Отправка голосовых сообщений ассистенту не разрешена для вашей подписки.');
        return;
      }

      const voice = ctx.message.voice;
      const fileId = voice.file_id;
      const fileInfo = await ctx.api.getFile(fileId);
      const fileLink = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${fileInfo.file_path}`;

      const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
      const voiceBuffer = Buffer.from(response.data, 'binary');

      await sendFileToAssistant(activeRequest.assistant.telegramId.toString(), voiceBuffer, 'voice.ogg');
      await ctx.reply('Голосовое сообщение успешно отправлено ассистенту.');

      await prisma.conversation.update({
        where: { id: activeRequest.id },
        data: {
          lastMessageFrom: 'USER',
          lastUserMessageAt: currentTime,
        },
      });
    } else {
      await ctx.reply(getTranslation(languageCode, 'no_active_dialogs'));
    }
  } catch (error) {
    console.error('Ошибка при обработке голосового сообщения:', error);
    await ctx.reply('Не получилось отправить голосовое сообщение.');
  }
});

bot.on('message:document', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const currentTime = new Date();
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { lastPaidSubscription: true },
    });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    const subscription = user.lastPaidSubscription;

    if (!subscription?.allowFilesToAssistant) {
      await ctx.reply('Отправка файлов ассистенту не разрешена для вашей подписки.');
      return;
    }

    const activeRequest = await prisma.assistantRequest.findFirst({
      where: { userId: telegramId, isActive: true },
      include: { assistant: true },
    });

    if (!activeRequest || !activeRequest.assistant) {
      await ctx.reply(getTranslation(languageCode, 'no_active_dialog'));
      return;
    }

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
  } catch (error) {
    console.error('Ошибка при обработке документа:', error);
    await ctx.reply('Произошла ошибка при обработке вашего файла.');
  }
});

bot.on('message:video_note', async (ctx) => {
  try {
    const languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const currentTime = new Date();
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { lastPaidSubscription: true },
    });

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    const subscription = user.lastPaidSubscription;

    if (!subscription?.allowVideoToAssistant) {
      await ctx.reply('Отправка видео-кружков ассистенту не разрешена для вашей подписки.');
      return;
    }

    const activeRequest = await prisma.assistantRequest.findFirst({
      where: { userId: telegramId, isActive: true },
      include: { assistant: true },
    });

    if (!activeRequest || !activeRequest.assistant) {
      await ctx.reply(getTranslation(languageCode, 'no_active_dialog'));
      return;
    }

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
  } catch (error) {
    console.error('Ошибка при обработке видео-кружка:', error);
    await ctx.reply('Произошла ошибка при обработке вашего видео-кружка.');
  }
});







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

async function assignAssistantToRequest(assistantRequest: AssistantRequest, languageCode: string) {
  try {
    const userIdBigInt = assistantRequest.userId;

    // Get available assistants as before
    const availableAssistants = await prisma.assistant.findMany({
      where: {
        isWorking: true,
        isBusy: false,
        telegramId: { notIn: assistantRequest.ignoredAssistants || [] },
      },
    });

    // Calculate penalty points and sort assistants as before
    const assistantsWithPenalties = await Promise.all(
      availableAssistants.map(async (assistant) => {
        const penaltyPoints = await getPenaltyPointsForLast24Hours(assistant.telegramId);
        return { ...assistant, penaltyPoints };
      })
    );

    assistantsWithPenalties.sort((a, b) => {
      if (a.penaltyPoints !== b.penaltyPoints) {
        return a.penaltyPoints - b.penaltyPoints;
      }
      return (b.lastActiveAt ? b.lastActiveAt.getTime() : 0) - (a.lastActiveAt ? a.lastActiveAt.getTime() : 0);
    });

    if (assistantsWithPenalties.length === 0) {
      await sendLogToTelegram('Нет доступных ассистентов после сортировки.');
      await sendTelegramMessageToUser(userIdBigInt.toString(), getTranslation(languageCode, 'noAssistantsAvailable'));
      return;
    }

    const selectedAssistant = assistantsWithPenalties[0];

    // Update assistant status
    await prisma.assistant.update({
      where: { telegramId: selectedAssistant.telegramId },
      data: { isBusy: true, lastActiveAt: new Date() },
    });

    // Update AssistantRequest with assistantId
    await prisma.assistantRequest.update({
      where: { id: assistantRequest.id },
      data: { assistantId: selectedAssistant.telegramId },
    });

    // Send message to assistant with the user's subject
    await sendTelegramMessageWithButtons(
      selectedAssistant.telegramId.toString(),
      `${getTranslation(languageCode, 'assistantRequestMessage')}\n\nТема: ${assistantRequest.subject}`,
      [
        { text: getTranslation(languageCode, 'accept'), callback_data: `accept_${assistantRequest.id.toString()}` },
        { text: getTranslation(languageCode, 'reject'), callback_data: `reject_${assistantRequest.id.toString()}` },
      ]
    );

    await sendLogToTelegram(`Отправлено сообщение ассистенту ID: ${selectedAssistant.telegramId.toString()} с запросом от пользователя ${userIdBigInt.toString()}`);

    // Notify the user
    await sendTelegramMessageToUser(userIdBigInt.toString(), getTranslation(languageCode, 'requestSent'));

  } catch (error) {
    console.error('Ошибка при назначении ассистента:', error);
    await sendLogToTelegram(`Ошибка при назначении ассистента: ${error instanceof Error ? error.message : 'Unknown error'}`);
    await sendTelegramMessageToUser(assistantRequest.userId.toString(), getTranslation(languageCode, 'server_error'));
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