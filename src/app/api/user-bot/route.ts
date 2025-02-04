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

interface MessageOptions {
  reply_markup?: {
    inline_keyboard: { text: string; callback_data: string }[][];
  };
}


const SESSION_DURATION = 60; // Длительность сеанса в минутах




type TranslationKey =
  | 'start_message'
  | 'no_user_id'
  | 'no_text_message'
  | 'error_processing_message'
  | 'dialog_closed'
  | 'no_active_dialog'
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
  | 'subjectExpected'
  | 'webapp_prompt'
  | 'session_time_remaining'
  | 'blocked_until'
  | 'block_time_expired'
  | 'invalid_referral_code'
  | 'referral_already_used'
  | 'referral_registered'
  | 'payment_success'
  | 'payment_error'
  | 'no_requests'
  | 'complaint_already_submitted'
  | 'complaint_prompt'
  | 'thanks_for_using'
  | 'not_enough_coins'
  | 'assistant_not_found_for_last_dialog'
  | 'extend_session_new_request'
  | 'extend_session_request_sent'
  | 'request_prefix'
  | 'switch_to_request'
  | 'voice_message_sent'
  | 'file_sent_to_assistant'
  | 'video_note_sent_to_assistant'
  | 'complaint_not_found'
  | 'ai_settings_load_error'
  // Добавленные ключи:
  | 'no_active_complaint'
  | 'waiting_for_assistant'
  | 'no_assistant_found'
  | 'assistant_already_offline'
  | 'complaintPhotoReceived';

type Language = 'en' | 'ru';

const getTranslation = (languageCode: string | undefined, key: TranslationKey): string => {
  const translations: Record<Language, Record<TranslationKey, string>> = {
    ru: {
      start_message: "Рады видеть вас ✌🏻\n\nНаш функционал доступен в кнопке WebApp. В личном кабинете вы сможете активировать подписку и получать удовольствие от делегирования запросов нашим экспертам / профессионалам",
      no_user_id: "Ваш пользователь был удален 🥲\n\nНе согласны? Напишите апелляцию в службу поддержки - @ блабла",
      no_text_message: "Пожалуйста, отправьте текстовое сообщение.",
      error_processing_message: "Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.",
      dialog_closed: "Диалог с ассистентом завершен. Спасибо за использование нашего сервиса!",
      no_active_dialog: "Сейчас у вас нет активного диалога с ассистентом.\n\nЧтобы задать вопрос ассистенту, следует в webapp запустить диалог",
      ai_no_response: "Извините, не удалось получить ответ от ИИ.",
      ai_chat_deactivated: "Режим общения с ИИ деактивирован. Спасибо за использование нашего сервиса!",
      ai_chat_not_active: "У вас нет активного диалога с ИИ.",
      coin_awarded: "Вам начислен 1 коин за завершение диалога.",
      no_user_found: "Пользователь не найден.",
      no_active_dialogs: "У вас нет активных диалогов 🥲",
      complaint_submitted: "Ваша жалоба была отправлена.",
      enterSubject: "Отправь свой запрос 💬\n\n Время на обработку вашего запроса - 1 час.\n\n Можно задавать вопросы и уточнения. Если 1 часа не хватит, можно будет продлить обработку вашего запроса.",
      subjectReceived: "Ассистент начал обрабатывать ваш запрос 🔮\n\n Вы можете общаться с ним в течение 1 часа",
      no_active_request: "Активный запрос не найден.",
      server_error: "Произошла ошибка. Пожалуйста, попробуйте позже.",
      assistantRequestMessage: "Запрос пользователя на разговор",
      noAssistantsAvailable: "Нет доступных ассистентов",
      requestSent: "Ваш запрос принят 🫡\n\n Сейчас подберем под него лучшего эксперта",
      accept: "Принять",
      reject: "Отклонить",
      unexpected_photo: "Ваше фото получено, но не ожидается. Попробуйте снова.",
      no_photo_detected: "Пожалуйста, отправьте изображение.",
      unexpected_voice: "Ваше голосовое сообщение получено, но не ожидается. Попробуйте снова.",
      unexpected_file: "Ваш файл получен, но не ожидается. Попробуйте снова.",
      no_active_subscription: "У вас пока нет активной подписки 🥲\n\nОформить подписку можно в своем профиле в кнопке WebApp",
      no_permission_to_send_photos: "Ваша подписка не позволяет отправлять фотографии 🥲\n\nОтправьте сообщение в формате текста",
      no_permission_to_send_voice: "Ваша подписка не позволяет отправлять голосовые сообщения 🥲\n\n Отправьте сообщение в формате текста",
      no_permission_to_send_files: "Ваша подписка не позволяет отправлять файлы 🥲\n\n Отправьте сообщение в формате текста",
      no_permission_to_send_videos: "Ваша подписка не позволяет отправлять видео-кружки 🥲\n\n Отправьте сообщение в формате текста",
      subjectExpected: "Мы ожидаем от вас тему вашего запроса. Пожалуйста, укажите её.",
      webapp_prompt: "Нажмите на кнопку ниже, чтобы открыть профиль в Web App.",
      session_time_remaining: "--------------------------------\nОбработка запроса завершится через %minutes% минут",
      blocked_until: "Ваш профиль заблокирован ⛓️\n\nДо разблокировки осталось %time%ч.",
      block_time_expired: "Время блокировки профиля завершилось ⛓️‍💥\n\nМожете продолжить пользоваться нашим сервисом",
      invalid_referral_code: "Неверный реферальный код.",
      referral_already_used: "Эта реферальная ссылка уже использована.",
      referral_registered: "🎉Вы успешно зарегистрировались, используя реферальную ссылку от пользователя @%username%.🎉",
      payment_success: "Ваш платеж прошел успешно 🥳",
      payment_error: "Произошла ошибка при обработке вашего платежа 🥲\n\nПросим обратиться в службу поддержи @ блабла",
      no_requests: "⚠️ У вас нет запросов.",
      complaint_already_submitted: "По данному запросу уже подана жалоба 🚨",
      complaint_prompt: "Нам очень жаль, что мы чем-то вас огорчили 🥲\n\nПросим описать ваше недовольство и по возможности прикрепить скрин диалога с нашим экспертом 👀",
      thanks_for_using: "Благодарим вас за доверие нашим экспертам ❤️",
      not_enough_coins: "У вас недостаточно доступных запросов ‼️\n\nНеобходимо докупить запросы или оформить подписку с большим количеством запросов ",
      assistant_not_found_for_last_dialog: "Ошибка: не удалось найти ассистента для последнего диалога.",
      extend_session_new_request: "Новый запрос на продление сеанса.",
      extend_session_request_sent: "Вы решили продлить текущий запрос 👍🏻\n\nПросим дать уточнение и дополнительную информацию для успешной обработки вашего запроса 💬",
      request_prefix: "Запрос #N%id%:\n\n",
      switch_to_request: "Переключиться на запрос %id%",
      voice_message_sent: "Голосовое сообщение успешно отправлено ассистенту 👌🏻",
      file_sent_to_assistant: "Файл успешно отправлен ассистенту 👌🏻",
      video_note_sent_to_assistant: "Видео-кружок с вашим запрос успешно отправлен ассистенту 👌🏻",
      complaint_not_found: "Жалоба не найдена",
      ai_settings_load_error: "Не удалось загрузить настройки AI 🤖\n\nПожалуйста, попробуйте позже…",
      // Новые ключи:
      no_active_complaint: "У вас нет активной жалобы для добавления фотографий.",
      waiting_for_assistant: "Ассистент ещё не присоединился к диалогу.",
      no_assistant_found: "Ассистент не найден",
      assistant_already_offline: "Ассистент уже завершил работу",
      complaintPhotoReceived: "Фотография успешно добавлена в жалобу."
    },
    en: {
      start_message: "Hello ✌🏻\n\nOur functionality is available in the WebApp button. In your account you should activate your subscription and purchase the number of hours you need.",
      no_user_id: "Your user has been deleted 🥲\n\nDisagree? Write an appeal to support - @nezloytakoy",
      no_text_message: "Please send a text message.",
      error_processing_message: "An error occurred while processing your message. Please try again later.",
      dialog_closed: "The dialog with the assistant has ended. Thank you for using our service!",
      no_active_dialog: "Right now you do not have an active dialog with the assistant.\n\nTo do this, go to the WebApp and activate the dialog",
      ai_no_response: "Sorry, could not get a response from the AI.",
      ai_chat_deactivated: "AI chat mode has been deactivated. Thank you for using our service!",
      ai_chat_not_active: "You have no active AI dialog.",
      coin_awarded: "You have been awarded 1 coin for completing the dialog.",
      no_user_found: "User not found.",
      no_active_dialogs: "You have no active dialogs.",
      complaint_submitted: "Your complaint has been sent ✅",
      enterSubject: "Send your request 💬\n\nThe time to process your request is 1 hour.\n\nYou can ask questions and clarifications. If 1 hour is not enough time, you can extend the processing of your request.",
      subjectReceived: "The assistant has started processing your request.\n\nYou can communicate with him within 1 hour.",
      no_active_request: "No active request found.",
      server_error: "An error occurred. Please try again later.",
      assistantRequestMessage: "User request for conversation",
      noAssistantsAvailable: "No assistants available",
      requestSent: "Your request accepted 🫡",
      accept: "Accept",
      reject: "Reject",
      unexpected_photo: "Your photo has been received but was not expected. Please try again.",
      no_photo_detected: "Please send an image.",
      unexpected_voice: "Your voice message has been received but was not expected. Please try again.",
      unexpected_file: "Your file has been received but is not opening 😨\n\nTry changing the file format",
      no_active_subscription: "You do not have an active subscription yet 🥲\n\nYou can subscribe in your profile under the WebApp button.",
      no_permission_to_send_photos: "Your subscription does not allow you to send photos 🥲\n\nSend a message in text format.",
      no_permission_to_send_voice: "Your subscription does not allow you to send voice messages 🥲\n\nSend a message in text format",
      no_permission_to_send_files: "Your subscription does not allow you to send files 🥲\n\nSend a message in text format",
      no_permission_to_send_videos: "Your subscription does not allow you to send video mugs 🥲\n\nSend a message in text format",
      subjectExpected: "We are waiting for you to provide the subject of your request. Please specify it.",
      webapp_prompt: "Click the button below to open your profile in the Web App.",
      session_time_remaining: "--------------------------------\n%minutes% minutes remain until the end of the session",
      blocked_until: "Your profile is locked ⛓️\n\nIt will take %time%h to unblock.",
      block_time_expired: "Profile lockout time has ended ⛓️‍💥\n\nYou can continue to use our service",
      invalid_referral_code: "Invalid referral code.",
      referral_already_used: "This referral link has already been used.",
      referral_registered: "🎉You have successfully registered using the referral link from @%username%.🎉",
      payment_success: "Your payment was successful 🥳",
      payment_error: "There was an error while processing your payment 🥲\n\nPlease contact support @ nezloytakoy",
      no_requests: "You have no requests 🥲",
      complaint_already_submitted: "A complaint has already been filed for this request 🚨",
      complaint_prompt: "We are very sorry if we have upset you in any way 🥲\n\nPlease describe your dissatisfaction and if possible attach a screenshot of the dialog with our expert 👀",
      thanks_for_using: "Thank you for trusting our experts ❤️",
      not_enough_coins: "You do not have enough hours available ‼️You need to purchase hours.",
      assistant_not_found_for_last_dialog: "Error: could not find an assistant for the last dialog.",
      extend_session_new_request: "New request to extend the session.",
      extend_session_request_sent: "You have decided to extend your current request 👍🏻🥲\n\nPlease provide clarification and additional information for successful processing of your request 💬",
      request_prefix: "Request #N%id%:\n\n",
      switch_to_request: "Switch to request %id%",
      voice_message_sent: "Voice message successfully sent to the assistant 👌🏻",
      file_sent_to_assistant: "File successfully sent to the assistant 👌🏻",
      video_note_sent_to_assistant: "A video circle with your request has been successfully sent to the assistant 👌🏻",
      complaint_not_found: "Complaint not found",
      ai_settings_load_error: "Could not load AI settings. Please try again later.",
      // New keys:
      no_active_complaint: "You have no active complaint to add photos to.",
      waiting_for_assistant: "The assistant has not yet joined the conversation.",
      no_assistant_found: "Assistant not found",
      assistant_already_offline: "The assistant has already finished working",
      complaintPhotoReceived: "Photo has been successfully added to the complaint."
    }
  };

  const selectedLanguage: Language = (languageCode as Language) || 'en';
  return translations[selectedLanguage]?.[key] || translations['en'][key];
};


type JsonArray = Array<string | number | boolean | { [key: string]: string | number | boolean | JsonArray | JsonObject }>;

interface JsonObject {
  [key: string]: string | number | boolean | JsonArray | JsonObject;
}

async function sendMessageToAssistant(
  ctx: Context | null,
  assistantChatId: string,
  message?: string,
  options?: MessageOptions
) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('[sendMessageToAssistant] Ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не установлен');
    return;
  }

  const assistantBot = new Bot(botToken);

  try {
    const languageCode = ctx?.from?.language_code || 'en';
    const assistantTelegramId = BigInt(assistantChatId);
    console.log(`[sendMessageToAssistant] Идентификатор ассистента: ${assistantTelegramId}`);

    // Находим активный разговор для ассистента
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        assistantId: assistantTelegramId,
        status: 'IN_PROGRESS',
      },
    });

    let finalMessage = message;
    if (message && activeConversation) {
      // Если есть активный разговор и мы отправляем текст, добавляем информацию о времени до конца сеанса
      const currentTime = new Date();
      const elapsedMinutes = Math.floor((currentTime.getTime() - activeConversation.createdAt.getTime()) / 60000);
      const remainingMinutes = Math.max(SESSION_DURATION - elapsedMinutes, 0);

      // Локализованная строка с временем до конца сеанса
      const timeMessage = getTranslation(languageCode, 'session_time_remaining').replace('%minutes%', String(remainingMinutes));

      finalMessage = `
${message}
${timeMessage}
`.trim();
    }

    if (finalMessage) {
      console.log(`[sendMessageToAssistant] Отправка текстового сообщения ассистенту. Chat ID: ${assistantChatId}, Message: ${finalMessage}`);
      await assistantBot.api.sendMessage(assistantChatId, finalMessage, options);
    } else if (ctx && ctx.chat && ctx.message) {
      console.log(`[sendMessageToAssistant] Копирование сообщения пользователя. Chat ID: ${assistantChatId}, Source Chat ID: ${ctx.chat.id}, Message ID: ${ctx.message.message_id}`);
      await assistantBot.api.copyMessage(
        assistantChatId,
        ctx.chat.id,
        ctx.message.message_id
      );
    } else {
      console.error('[sendMessageToAssistant] Ошибка: ни message, ни ctx не определены или ctx.chat/ctx.message отсутствуют');
      return;
    }

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

    const languageCode = ctx?.from?.language_code || 'en';
    if (remainingTime > 0) {

      await ctx.reply(getTranslation(languageCode, 'blocked_until').replace('%time%', String(remainingTime)));
      return true;
    } else {

      await prisma.user.update({
        where: { telegramId },
        data: { isBlocked: false, unblockDate: null },
      });
      await ctx.reply(getTranslation(languageCode, 'block_time_expired'));
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





bot.command('start', async (ctx) => {
  try {
    // Определяем язык по language_code пользователя или ставим "en"
    const languageCode = ctx.from?.language_code || 'en';

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(languageCode, 'no_user_id'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const userId = ctx.from.id; // для getUserProfilePhotos
    const username = ctx.from.username || null;

    // Проверяем, нет ли реферального кода "ref_..."
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
        await ctx.reply(getTranslation(languageCode, 'invalid_referral_code'));
        return;
      }

      if (referral.isUsed) {
        await ctx.reply(getTranslation(languageCode, 'referral_already_used'));
        return;
      }

      referrerId = referral.userId;
    }

    // Определяем следующий orderNumber (если используете подобную логику)
    const lastUser = await prisma.user.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const nextOrderNumber = lastUser?.orderNumber ? lastUser.orderNumber + 1 : 1;

    console.log(`Создаем или обновляем пользователя с Telegram ID: ${telegramId}`);

    // upsert пользователя: обновляем язык (language) и username
    const newUser = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username,
        language: languageCode, // <-- Сохраняем язык пользователя
      },
      create: {
        telegramId,
        username,
        orderNumber: nextOrderNumber,
        language: languageCode, // <-- При создании тоже указываем язык
      },
    });

    // Если был реферальный код, обновляем реферальную запись
    if (referrerId && code) {
      console.log(`Обновляем счетчик рефералов для пользователя с ID: ${referrerId}`);

      await prisma.user.update({
        where: { telegramId: referrerId },
        data: { referralCount: { increment: 1 } },
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

      await ctx.reply(
        getTranslation(languageCode, 'referral_registered')
          .replace('%username%', referrerUsername)
      );
    }

    // --- Получаем фото профиля пользователя (самое большое) ---
    console.log(`Пытаемся получить аватарку пользователя с ID ${userId}`);
    const userPhotos = await ctx.api.getUserProfilePhotos(userId, { offset: 0, limit: 1 });

    if (userPhotos.photos && userPhotos.photos.length > 0) {
      // userPhotos.photos[0] — это массив PhotoSize[] для первой «группы»
      const photoArray = userPhotos.photos[0];
      // Берём самую большую (последний элемент массива)
      const largestPhoto = photoArray[photoArray.length - 1];

      // Получаем file_path через ctx.api.getFile(...)
      const fileObj = await ctx.api.getFile(largestPhoto.file_id);

      // Формируем URL для скачивания
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_USER_BOT_TOKEN}/${fileObj.file_path}`;

      // 1) Скачиваем как бинарные данные
      const response = await fetch(fileUrl);
      if (!response.ok) {
        console.error("Ошибка при скачивании аватарки:", response.statusText);
      } else {
        // 2) Преобразуем в Buffer (Node.js)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3) Сохраняем buffer в поле avatarData (Bytes)
        await prisma.user.update({
          where: { telegramId },
          data: {
            avatarData: buffer,
          },
        });

        console.log(`Бинарная аватарка сохранена в БД: ${buffer.length} байт`);
      }
    } else {
      console.log('У пользователя нет фото профиля, пропускаем обновление аватарки.');
    }

    // Отправляем приветственное сообщение
    await ctx.reply(getTranslation(languageCode, 'start_message'));
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Ошибка при обработке команды /start:', err.message);
    const languageCode = ctx.from?.language_code || 'en';
    await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
  }
});


// Новый обработчик для /my_profile
// bot.command('my_profile', async (ctx) => {
//   try {
//     const languageCode = ctx.from?.language_code || 'en';

//     // Отправляем сообщение с кнопкой, открывающей WebApp
//     await ctx.reply(getTranslation(languageCode, 'webapp_prompt'), {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: getTranslation(languageCode, 'webapp_button'),
//               web_app: { url: 'https://crm-vpn.vercel.app/user-profile' },
//             },
//           ],
//         ],
//       },
//     });
//   } catch (error: unknown) {
//     const err = error as Error;
//     console.error('Ошибка при обработке команды /my_profile:', err.message);
//     const languageCode = ctx.from?.language_code || 'en';
//     await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
//   }
// });






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
      await sendLogToTelegram(`payloadData: ${JSON.stringify(serializeBigInt(payloadData))}`);

      const { userId: decodedUserId, assistantRequests, aiRequests, tariffName, months } = payloadData;
      await sendLogToTelegram(`decodedUserId: ${decodedUserId}, tariffName: ${tariffName}, months: ${months}`);

      // Преобразуем decodedUserId => BigInt
      let decodedUserIdBigInt;
      try {
        decodedUserIdBigInt = BigInt(decodedUserId);
        await sendLogToTelegram(`decodedUserIdBigInt: ${decodedUserIdBigInt.toString()}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await sendLogToTelegram(`Failed to convert decodedUserId to BigInt: ${errorMessage}`);
        throw new Error(`Invalid decodedUserId format for BigInt conversion`);
      }

      // Маппинг названий
      const tariffMap: Record<string, string> = {
        Basic: "FIRST",
        Advanced: "SECOND",
        Expert: "THIRD",
      };

      // Если есть tariffName, то используем маппинг
      if (tariffName) {
        await sendLogToTelegram(`Given tariffName=${tariffName}; mapping...`);
        // Если в тарифной карте нет ключа, оставим как есть
        const internalName = tariffMap[tariffName] || tariffName;

        await sendLogToTelegram(`Looking for subscription with name=${internalName}`);
        try {
          const subscription = await prisma.subscription.findFirst({
            where: { name: internalName },
          });

          if (!subscription) {
            await sendLogToTelegram(`Subscription not found for name=${internalName}. Aborting.`);
            throw new Error(`Subscription with name=${internalName} not found`);
          }

          await sendLogToTelegram(`Subscription found: ${JSON.stringify(serializeBigInt(subscription))}`);

          const monthsCount = typeof months === "number" && months > 0 ? months : 1;
          const expirationDate = new Date();
          expirationDate.setMonth(expirationDate.getMonth() + monthsCount);

          try {
            await prisma.userTariff.create({
              data: {
                userId: decodedUserIdBigInt,
                tariffId: subscription.id,
                totalAssistantRequests: subscription.assistantRequestCount || 0,
                totalAIRequests: subscription.aiRequestCount || 0,
                remainingAssistantRequests: subscription.assistantRequestCount || 0,
                remainingAIRequests: subscription.aiRequestCount || 0,
                expirationDate,
              },
            });

            await sendLogToTelegram(
              `User ${decodedUserIdBigInt.toString()} purchased tariff [${internalName}] for ${monthsCount} month(s).`
            );
          } catch (userTariffError) {
            const errorMessage = userTariffError instanceof Error ? userTariffError.message : String(userTariffError);
            await sendLogToTelegram(`Error creating UserTariff entry: ${errorMessage}`);
            throw userTariffError;
          }
        } catch (subscriptionError) {
          const errorMessage = subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError);
          await sendLogToTelegram(`Error finding subscription by tariffName: ${errorMessage}`);
          throw subscriptionError;
        }
      } else {
        // Покупка дополнительных запросов (tariffName отсутствует)
        await sendLogToTelegram(`tariffName not provided => treat as extra requests purchase`);

        try {
          await prisma.userTariff.create({
            data: {
              userId: decodedUserIdBigInt,
              totalAssistantRequests: assistantRequests || 0,
              totalAIRequests: aiRequests || 0,
              remainingAssistantRequests: assistantRequests || 0,
              remainingAIRequests: aiRequests || 0,
              expirationDate: new Date("9999-12-31T23:59:59.999Z"),
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
      }
      // Логика реферальных бонусов (не меняется)
      try {
        const referral = await prisma.referral.findFirst({
          where: { referredUserId: decodedUserIdBigInt, isUsed: true },
          select: { userId: true },
        });

        await sendLogToTelegram(`referral: ${JSON.stringify(serializeBigInt(referral))}`);

        if (referral) {
          const referringUser = await prisma.user.findUnique({
            where: { telegramId: referral.userId },
            select: { referralPercentage: true },
          });

          if (referringUser) {
            const referralCoins = totalStars * (referringUser.referralPercentage || 0);
            await sendLogToTelegram(
              `Referral found. Referring User ${referral.userId.toString()} receives ${referralCoins} coins`
            );

            await prisma.user.update({
              where: { telegramId: referral.userId },
              data: { coins: { increment: referralCoins } },
            });

            await sendLogToTelegram(`User ${referral.userId.toString()} received ${referralCoins} coins as a referral bonus.`);
          } else {
            await sendLogToTelegram(`Referring user not found for referral entry: ${JSON.stringify(referral)}`);
          }
        } else {
          await sendLogToTelegram(`No referral found for userId=${decodedUserIdBigInt.toString()}`);
        }
      } catch (referralError) {
        const errorMessage = referralError instanceof Error ? referralError.message : String(referralError);
        await sendLogToTelegram(`Error handling referral bonus: ${errorMessage}`);
        throw referralError;
      }

      const languageCode = ctx.from?.language_code || 'en';
      await ctx.reply(getTranslation(languageCode, 'payment_success'));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await sendLogToTelegram(`Error handling successful payment: ${errorMessage}`);
    console.error("Ошибка обработки успешного платежа:", errorMessage);

    await ctx.reply("Произошла ошибка при обработке вашего платежа. Пожалуйста, свяжитесь с поддержкой.");
  }
});


bot.on('callback_query', async (ctx) => {
  try {
    const languageCode = ctx?.from?.language_code || 'en';
    const callbackData = ctx.callbackQuery?.data;

    if (callbackData === 'complain') {
      // Обработчик для жалобы
      if (!ctx.from?.id) {
        await ctx.reply(getTranslation(languageCode, 'no_user_id'));
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
        await ctx.reply(getTranslation(languageCode, 'no_requests'));
        return;
      }

      const existingComplaint = await prisma.complaint.findUnique({
        where: { id: lastRequest.id },
      });

      if (existingComplaint) {
        await ctx.reply(getTranslation(languageCode, 'complaint_already_submitted'));
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

      console.log('languageCode before editMessageText:', languageCode);

      await ctx.editMessageText(getTranslation(languageCode, 'complaint_prompt'));
    } else if (callbackData === 'satisfied') {
      // Обработчик для кнопки "Я доволен"
      await ctx.deleteMessage();
      await ctx.reply(getTranslation(languageCode, 'thanks_for_using'));
      await ctx.answerCallbackQuery(); // Закрываем уведомление о callback query
    } else if (callbackData === 'extend_session') {
      if (!ctx.from?.id) {
        await ctx.reply(getTranslation(languageCode, "no_user_id"));
        return;
      }

      const userId = BigInt(ctx.from.id);

      // 2) Ищем пользователя (с его последним диалогом)
      const user = await prisma.user.findUnique({
        where: { telegramId: userId },
        include: {
          conversations: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!user) {
        await ctx.reply(getTranslation(languageCode, "no_user_found"));
        return;
      }

      // 3) Считаем общее количество оставшихся запросов к ассистенту
      const now = new Date();
      const userTariffs = await prisma.userTariff.findMany({
        where: {
          userId: userId,
          expirationDate: { gte: now },
          remainingAssistantRequests: { gt: 0 },
        },
        orderBy: {
          expirationDate: "asc",
        },
      });

      const totalAvailable = userTariffs.reduce(
        (acc, t) => acc + t.remainingAssistantRequests,
        0
      );

      if (totalAvailable < 1) {
        await ctx.reply(getTranslation(languageCode, "no_requests"));
        return;
      }

      // 4) Берём первый тариф и списываем 1 запрос
      const firstTariff = userTariffs.find((t) => t.remainingAssistantRequests > 0);
      if (!firstTariff) {
        // Теоретически не должно случиться
        await ctx.reply(getTranslation(languageCode, "no_requests"));
        return;
      }

      await prisma.userTariff.update({
        where: { id: firstTariff.id },
        data: { remainingAssistantRequests: { decrement: 1 } },
      });

      // 5) Получаем последний диалог
      const lastConversation = user.conversations[0];
      if (!lastConversation || !lastConversation.assistantId) {
        await ctx.reply(getTranslation(languageCode, "assistant_not_found_for_last_dialog"));
        return;
      }

      const assistantId = lastConversation.assistantId;

      // 6) Проверяем, работает ли ассистент (assistant.isWorking = true ?)
      const assistantObj = await prisma.assistant.findUnique({
        where: { telegramId: assistantId },
        select: {
          isWorking: true,
          language: true,
        },
      });

      // Если ассистент не найден или не работает
      if (!assistantObj) {
        // Локализованное сообщение: «Ассистент не найден»
        await ctx.reply(getTranslation(languageCode, "no_assistant_found"));
        return;
      }

      if (!assistantObj.isWorking) {
        // Предположим, у вас есть ключ "assistant_already_offline" => «Ассистент уже завершил работу»
        await ctx.reply(getTranslation(languageCode, "assistant_already_offline"));
        return;
      }

      // 7) Если ассистент ещё работает, отправляем ему запрос на продление
      const assistantLang = assistantObj.language ?? "en";

      await sendTelegramMessageWithButtons(
        assistantId.toString(),
        getTranslation(assistantLang, "extend_session_new_request"),
        [
          {
            text: getTranslation(assistantLang, "accept"),
            callback_data: `acceptConv_${lastConversation.id}`,
          },
          {
            text: getTranslation(assistantLang, "reject"),
            callback_data: `rejectConv_${lastConversation.id}`,
          },
        ]
      );

      // 8) Пользователю сообщаем, что запрос отправлен
      await ctx.reply(getTranslation(languageCode, "extend_session_request_sent"));

      // Закрываем уведомление Callback (если это callback)
      await ctx.answerCallbackQuery?.();
    }
  } catch (error) {
    console.error('Ошибка при обработке callback_query:', error);
    const languageCode = ctx?.from?.language_code || 'en';
    await ctx.reply(getTranslation(languageCode, 'server_error'));
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
      include: { assistant: true, assistantRequest: true },
    });

    if (activeConversation) {
      console.log(
        `Active conversation found: ${JSON.stringify(
          { ...activeConversation, userId: activeConversation.userId.toString() },
          serializeBigInt,
          2
        )}`
      );

      if (activeConversation.assistant && activeConversation.assistantRequest) {
        console.log(`Sending message to assistant ID: ${activeConversation.assistant.telegramId}`);

        // Используем реальный ID запроса вместо индекса
        const requestId = activeConversation.assistantRequest.id;
        const prefix = getTranslation(languageCode, 'request_prefix').replace('%id%', requestId.toString());

        // Добавляем кнопку для переключения на этот запрос
        const switchText = getTranslation(languageCode, 'switch_to_request').replace('%id%', requestId.toString());

        const inlineKeyboard = [[
          { text: switchText, callback_data: `activate_${activeConversation.id}` }
        ]];

        // Отправляем сообщение ассистенту
        await sendMessageToAssistant(
          ctx,
          activeConversation.assistant.telegramId.toString(),
          prefix + userMessage,
          {
            reply_markup: {
              inline_keyboard: inlineKeyboard
            }
          }
        );
      } else {
        console.error(
          `No assistant assigned or no assistantRequest found for the active conversation with ID: ${activeConversation.id}`
        );
        await ctx.reply(getTranslation(languageCode, 'no_active_dialogs'));
      }
    } else {
      // Нет активного разговора
      console.log(`No active conversation found for user ID: ${telegramId.toString()}`);

      // Проверим, нет ли созданного AssistantRequest, но без Conversation
      const openRequest = await prisma.assistantRequest.findFirst({
        where: {
          userId: telegramId,
          isActive: true,
          conversation: null, // нет привязки к Conversation
        },
      });

      if (openRequest) {
        // Значит запрос уже есть, но ассистент не присоединился (Conversation не создана)
        await ctx.reply(getTranslation(languageCode, 'waiting_for_assistant'));
        return;
      }

      // Если request нет, но isWaitingForSubject всё ещё true
      if (user.isWaitingForSubject) {
        await ctx.reply(getTranslation(languageCode, 'subjectExpected'));
      } else {
        // Никаких активных разговоров, нет openRequest
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
    const validTariffIds = activeTariffs
      .map((tariff) => tariff.tariffId)
      .filter((id): id is bigint => id !== null);

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

      // --- Блок 1: Проверяем, ожидается ли "subject" для AssistantRequest ---
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

          // Обновляем состояние пользователя (больше не ждём subject)
          await prisma.user.update({
            where: { telegramId },
            data: { isWaitingForSubject: false },
          });

          console.log(`User ${telegramId.toString()} is no longer waiting for a subject.`);

          // Назначаем ассистента на обновлённую заявку
          await assignAssistantToRequest(activeRequest, languageCode);

          await ctx.reply(getTranslation(languageCode, 'subjectReceived'));
        } else {
          console.error(`No active request found for user ID: ${telegramId.toString()} while expecting a subject.`);
          await ctx.reply(getTranslation(languageCode, 'no_active_request'));
        }

        // --- Блок 2: Проверяем, ожидается ли "complaint" ---
      } else if (user.isWaitingForComplaint) {
        console.log(`User ${telegramId.toString()} is providing a complaint photo.`);

        // Предположим, у вас в моделе Complaint есть поле: 
        // photoUrls   String[]    @default([])
        // и статус/флаг "isActive" или что-то похожее.
        const activeComplaint = await prisma.complaint.findFirst({
          where: {
            userId: telegramId,
            // например, isActive: true, 
            // или status: 'DRAFT', в зависимости от вашей логики
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' }, // последняя созданная жалоба
        });

        if (!activeComplaint) {
          console.error(`No active complaint found for user ID: ${telegramId.toString()} while expecting a complaint.`);
          await ctx.reply(getTranslation(languageCode, 'no_active_complaint'));
          return;
        }

        // Добавляем новую фотографию в массив photoUrls
        // Предположим, что в Complaint.photoUrls типа String[]
        const updatedPhotoUrls = [...(activeComplaint.photoUrls || []), fileUrl];

        await prisma.complaint.update({
          where: { id: activeComplaint.id },
          data: { photoUrls: updatedPhotoUrls },
        });

        console.log(`Photo added to complaint ID: ${activeComplaint.id} - Photo URL: ${fileUrl}`);

        // Если вы хотите, чтобы пользователь мог продолжить добавлять фото,
        // то не сбрасывайте isWaitingForComplaint. 
        // Но если вам нужно одно фото — то отключайте:
        // await prisma.user.update({
        //   where: { telegramId },
        //   data: { isWaitingForComplaint: false },
        // });

        await ctx.reply(getTranslation(languageCode, 'complaintPhotoReceived'));

      } else {
        // Если пользователь не в режиме ожидания ни subject, ни complaint
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
  let languageCode: string = 'en'; // Значение по умолчанию

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
        console.error(`No active request found for user ID: ${telegramId.toString()} while expecting a subject.`);
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
      await ctx.reply(getTranslation(languageCode, 'voice_message_sent'));

      // Находим разговор, связанный с этим запросом
      const conversationRecord = await prisma.conversation.findFirst({
        where: { requestId: activeRequest.id, status: 'IN_PROGRESS' },
      });

      if (!conversationRecord) {
        console.error('Не удалось найти разговор для обновления времени последнего сообщения.');
        return;
      }

      await prisma.conversation.update({
        where: { id: conversationRecord.id },
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
    const languageCode = ctx.from?.language_code || 'en';
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
      await ctx.reply(getTranslation(languageCode, 'file_sent_to_assistant'));

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
      await ctx.reply(getTranslation(languageCode, 'video_note_sent_to_assistant'));

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
      await ctx.reply(getTranslation(languageCode, 'complaint_not_found'));
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

  const languageCode = ctx?.from?.language_code || 'en';


  const modelData = await prisma.openAi.findFirst();
  if (!modelData) {
    await ctx.reply(getTranslation(languageCode, 'ai_settings_load_error'));
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
      await ctx.reply(getTranslation(languageCode, 'ai_no_response'));
    }
  } catch (error) {
    console.error('Ошибка при работе с OpenAI API:', error);
    await ctx.reply(getTranslation(languageCode, 'error_processing_message'));
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


/**
 * Назначает ассистента запросу AssistantRequest. 
 * @param assistantRequest Запрос (в том числе userId, subject, ignoredAssistants и т.д.).
 * @param languageCode Язык пользователя (для сообщений пользователю).
 */
async function assignAssistantToRequest(
  assistantRequest: AssistantRequest,
  languageCode: string
) {
  try {
    console.log(`Assigning assistant for request ID: ${assistantRequest.id}`);
    console.log(`Request details: ${JSON.stringify(assistantRequest, serializeBigInt, 2)}`);

    const userIdBigInt = assistantRequest.userId;

    // 1) Получаем список ассистентов, которые работают, не заблокированы 
    //    и не входят в ignoredAssistants
    const availableAssistants = await prisma.assistant.findMany({
      where: {
        isWorking: true,
        isBlocked: false,
        telegramId: { notIn: assistantRequest.ignoredAssistants || [] },
      },
    });

    logWithBigInt({ availableAssistants });

    // 2) Считаем penaltyPoints за последние 24 часа
    const assistantsWithPenalties = await Promise.all(
      availableAssistants.map(async (assistant) => {
        const penaltyPoints = await getPenaltyPointsForLast24Hours(assistant.telegramId);
        return { ...assistant, penaltyPoints };
      })
    );

    logWithBigInt({ assistantsWithPenalties });

    // 3) Сортируем по penaltyPoints (возрастающе), при равенстве - по последней активности (убывающе)
    assistantsWithPenalties.sort((a, b) => {
      if (a.penaltyPoints !== b.penaltyPoints) {
        return a.penaltyPoints - b.penaltyPoints;
      }
      return (b.lastActiveAt ? b.lastActiveAt.getTime() : 0) -
        (a.lastActiveAt ? a.lastActiveAt.getTime() : 0);
    });

    console.log(`Sorted assistants: ${JSON.stringify(assistantsWithPenalties, serializeBigInt, 2)}`);

    // 4) Если нет доступных ассистентов
    if (assistantsWithPenalties.length === 0) {
      console.log("No available assistants after sorting.");
      await sendTelegramMessageToUser(
        userIdBigInt.toString(),
        getTranslation(languageCode, "noAssistantsAvailable")
      );
      return;
    }

    // 5) Берём самого подходящего (первого) ассистента
    const selectedAssistant = assistantsWithPenalties[0];
    console.log(`Selected assistant: ${JSON.stringify(selectedAssistant, serializeBigInt, 2)}`);

    // 6) Записываем в базу, что этот ассистент назначен запросу
    await prisma.assistantRequest.update({
      where: { id: assistantRequest.id },
      data: { assistantId: selectedAssistant.telegramId },
    });

    const updatedRequest = await prisma.assistantRequest.findUnique({
      where: { id: assistantRequest.id }
    });
    console.log(
      `Updated request after assigning assistant: ${JSON.stringify(updatedRequest, serializeBigInt, 2)}`
    );

    // 7) Получаем язык ассистента из таблицы
    const assistantRecord = await prisma.assistant.findUnique({
      where: { telegramId: selectedAssistant.telegramId },
      select: { language: true },
    });
    // Если ничего не нашли или не указан - ставим "en"
    const assistantLang = assistantRecord?.language ?? "en";

    // 8) Формируем текст для ассистента (assistantLang)
    const messageText = updatedRequest?.subject
      ? updatedRequest.subject.startsWith("http")
        ? `${getTranslation(assistantLang, "assistantRequestMessage")}`
        : `${getTranslation(assistantLang, "assistantRequestMessage")}\n\nТема: ${updatedRequest.subject}`
      : `${getTranslation(assistantLang, "assistantRequestMessage")}\n\nТема: отсутствует`;

    // 9) Если subject - ссылка (http...), отсылаем её как медиа, 
    //    затем отдельным сообщением с кнопками
    if (updatedRequest?.subject?.startsWith("http")) {
      await sendTelegramMediaToAssistant(
        selectedAssistant.telegramId.toString(),
        updatedRequest.subject,
        "" // caption, если нужен
      );

      // Далее кнопки (accept / reject)
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        getTranslation(assistantLang, "assistantRequestMessage"),
        [
          {
            text: getTranslation(assistantLang, "accept"),
            callback_data: `accept_${assistantRequest.id.toString()}`,
          },
          {
            text: getTranslation(assistantLang, "reject"),
            callback_data: `reject_${assistantRequest.id.toString()}`,
          },
        ]
      );
    } else {
      // 9b) Если subject - текст
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        messageText,
        [
          {
            text: getTranslation(assistantLang, "accept"),
            callback_data: `accept_${assistantRequest.id.toString()}`,
          },
          {
            text: getTranslation(assistantLang, "reject"),
            callback_data: `reject_${assistantRequest.id.toString()}`,
          },
        ]
      );
    }

    console.log(`Message sent to assistant ID: ${selectedAssistant.telegramId}`);

    // 10) Сообщаем пользователю (на его языке, переданном как languageCode), 
    //     что запрос отправлен ассистенту
    await sendTelegramMessageToUser(
      userIdBigInt.toString(),
      getTranslation(languageCode, "requestSent")
    );

  } catch (error) {
    console.error("Error assigning assistant:", error);
    await sendLogToTelegram(
      `Error assigning assistant: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    // При ошибке отправляем пользователю (на языке user)
    await sendTelegramMessageToUser(
      assistantRequest.userId.toString(),
      getTranslation(languageCode, "server_error")
    );
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