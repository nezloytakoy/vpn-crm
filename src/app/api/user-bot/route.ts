import { Bot, webhookCallback } from 'grammy';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
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

    await prisma.assistant.update({
      where: { telegramId: activeRequest.assistant.telegramId },
      data: { isBusy: false },
    });

    await ctx.reply(getTranslation(languageCode, 'dialog_closed'));

    await sendMessageToAssistant(activeRequest.assistant.telegramId.toString(), getTranslation(languageCode, 'user_ended_dialog'));
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
      await sendMessageToAssistant(activeRequest.assistant.telegramId.toString(), userMessage);
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