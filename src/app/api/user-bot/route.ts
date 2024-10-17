import { Bot, webhookCallback } from 'grammy';
import { Context } from 'grammy';
import OpenAI from 'openai';
import { PrismaClient, SubscriptionType } from '@prisma/client';

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

    
    const assistantTelegramId = BigInt(chatId);

    
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
        message: text,  
        timestamp: currentTime.toISOString(), 
      };

      
      const updatedMessages = [
        ...(activeConversation.messages as Array<{ sender: string; message: string; timestamp: string }>),
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
  | 'complaint_submitted';

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
    },
  };

  const selectedLanguage: Language = (languageCode as Language) || 'en';
  return translations[selectedLanguage]?.[key] || translations['en'][key];
};

type JsonArray = Array<string | number | boolean | { [key: string]: string | number | boolean | JsonArray | JsonObject }>;

interface JsonObject {
  [key: string]: string | number | boolean | JsonArray | JsonObject;
}



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
          activeRequest.assistant.telegramId.toString(),
          `${getTranslation(languageCode, 'user_ended_dialog_no_reward')}` 
        );
      } else {
        console.error('Ошибка: ассистент не найден для активного запроса');
      }
    } else {
      
      if (activeRequest.assistant) {
        const updatedAssistant = await prisma.assistant.update({
          where: { telegramId: activeRequest.assistant.telegramId },
          data: { coins: { increment: 1 } }, 
        });

        
        await sendMessageToAssistant(
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

    // Проверка на реферальный код
    const referralCode = ctx.message?.text?.split(' ')[1]; 
    let referrerId: bigint | null = null;

    if (referralCode && referralCode.startsWith('ref_')) {
      const code = referralCode.replace('ref_', '');

      // Ищем реферальную запись по коду
      const referral = await prisma.referral.findUnique({
        where: { code },
      });

      if (referral) {
        referrerId = referral.userId; // Присваиваем ID пользователя, создавшего ссылку
      } else {
        await ctx.reply('Неверный реферальный код.');
        return;
      }
    }

    // Поиск наименьшего неиспользованного порядкового номера
    const lastUser = await prisma.user.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    const nextOrderNumber = lastUser?.orderNumber ? lastUser.orderNumber + 1 : 1;

    // Создаем или обновляем пользователя
    const newUser = await prisma.user.upsert({
      where: { telegramId },
      update: { username },
      create: {
        telegramId,
        username,
        orderNumber: nextOrderNumber, // Присваиваем порядковый номер
      },
    });

    // Обновление данных о реферальном пользователе
    if (referrerId && referralCode) {
      await prisma.user.update({
        where: { telegramId: referrerId },
        data: {
          referralCount: { increment: 1 }, // Увеличиваем счетчик рефералов
        },
      });

      // Создаем запись о реферале
      await prisma.referral.create({
        data: {
          userId: referrerId, // ID пользователя, создавшего реферальную ссылку
          referredUserId: newUser.telegramId, // ID нового пользователя
          code: referralCode, // Код реферальной ссылки
          link: `https://t.me/vpn_srm_userbot?start=ref_${referralCode}`, // Ссылка с реферальным кодом
        },
      });
    }

    // Ответное сообщение пользователю
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

    if (payment && userId) {
      
      await sendLogToTelegram(`User ${userId} has successfully paid for ${payment.total_amount / 42} stars`);

      
      const payloadData = JSON.parse(payment.invoice_payload);
      const { userId: decodedUserId, tariffName } = payloadData;

      let subscriptionType: SubscriptionType;
      let assistantRequestsIncrement = 0;
      let aiRequestsIncrement = 0;

      
      switch (tariffName.toLowerCase().replace(/ - \d+\$$/, '')) {  
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
        case "ai + 30 запросов":
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
          await sendLogToTelegram(`Invalid tariff name: ${tariffName}`);
          throw new Error(`Invalid tariff name: ${tariffName}`);
      }

      
      await prisma.user.update({
        where: {
          telegramId: BigInt(decodedUserId),
        },
        data: {
          subscriptionType,
          hasUpdatedSubscription: true,
          aiRequests: { increment: aiRequestsIncrement },
          assistantRequests: { increment: assistantRequestsIncrement },
          updatedAt: new Date(),
        },
      });

      
      await sendLogToTelegram(`User ${decodedUserId} updated with subscription: ${subscriptionType}`);

      
      await ctx.reply("Ваш платеж прошел успешно! Привилегии активированы.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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





bot.on('message:text', async (ctx: Context) => {
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

    // Получаем пользователя, активный запрос и арбитраж
    const [user, activeRequest, arbitration] = await Promise.all([
      prisma.user.findUnique({ where: { telegramId } }),
      prisma.assistantRequest.findFirst({
        where: { user: { telegramId }, isActive: true },
        include: { assistant: true },
      }),
      prisma.arbitration.findFirst({
        where: { userId: telegramId, status: 'IN_PROGRESS' },
        include: { assistant: true, moderator: true },
      }),
    ]);

    if (!user) {
      await ctx.reply(getTranslation(languageCode, 'no_user_found'));
      return;
    }

    // Если пользователь ждет возможности добавить текст к жалобе, обновляем жалобу
    if (user.isWaitingForComplaint) {
      await handleUserComplaint(telegramId, userMessage, languageCode, ctx);
      return;
    }

    if (arbitration) {
      console.log('deleted function');
    } else if (user.isActiveAIChat) {
      await handleAIChat(telegramId, userMessage, ctx);
    } else if (activeRequest) {
      if (activeRequest.assistant) {
        await sendMessageToAssistant(activeRequest.assistant.telegramId.toString(), userMessage);
      } else {
        console.error('Ошибка: Ассистент не найден для активного запроса.');
      }
    } else {
      await ctx.reply(getTranslation(languageCode, 'no_active_dialogs'));
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await ctx.reply("Не получилось обработать сообщение");
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
      // Берем последнее фото из массива (самое большое разрешение)
      const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];

      const file = await ctx.api.getFile(largestPhoto.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${file.file_path}`;
      
      // Ищем активную жалобу
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

      // Добавляем URL картинки к жалобе
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




async function handleUserComplaint(telegramId: bigint, userMessage: string, languageCode: string, ctx: Context) {
  try {
    // Находим последнюю активную жалобу (в статусе "PENDING")
    const lastComplaint = await prisma.complaint.findFirst({
      where: {
        userId: telegramId,
        status: 'PENDING', // Ищем активную жалобу
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Проверяем, есть ли активная жалоба
    if (!lastComplaint) {
      await ctx.reply("Жалоба не найдена"); // Выводим сообщение, если активная жалоба не найдена
      return;
    }

    // Обновляем жалобу, добавляем текст от пользователя
    await prisma.complaint.update({
      where: { id: lastComplaint.id },
      data: { text: userMessage }, // Обновляем текст жалобы
    });

    // Обновляем статус пользователя, что он больше не ожидает ввода жалобы
    await prisma.user.update({
      where: { telegramId },
      data: { isWaitingForComplaint: false },
    });

    await ctx.reply(getTranslation(languageCode, 'complaint_submitted')); // Сообщение об успешной отправке жалобы
  } catch (error) {
    console.error('Ошибка при обновлении жалобы:', error);
    await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
  }
}


async function handleAIChat(telegramId: bigint, userMessage: string, ctx: Context) {
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
    await ctx.reply('AI не смог сгенерировать ответ.');
  }
}





export const POST = webhookCallback(bot, 'std/http');