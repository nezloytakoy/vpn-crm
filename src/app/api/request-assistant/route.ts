import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Пример объекта translations
const translations = {
    en: {
        userIdRequired: 'UserId is required',
        userNotFound: 'User not found',
        requestReceived: 'Your request has been received. Please wait while an assistant contacts you.',
        noAssistantsAvailable: 'No assistants available',
        requestSent: 'The request has been sent to the assistant.',
        notEnoughRequests: 'You do not have enough requests to contact an assistant.',
        serverError: 'Server Error',
        assistantRequestMessage: 'User request for conversation',
        accept: 'Accept',
        reject: 'Reject',
        logMessage: 'userIdBigInt before creating AssistantRequest',
    },
    ru: {
        userIdRequired: 'Требуется UserId',
        userNotFound: 'Пользователь не найден',
        requestReceived: 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.',
        noAssistantsAvailable: 'Нет доступных ассистентов',
        requestSent: 'Запрос отправлен ассистенту.',
        notEnoughRequests: 'У вас недостаточно запросов для общения с ассистентом.',
        serverError: 'Ошибка сервера',
        assistantRequestMessage: 'Запрос пользователя на разговор',
        accept: 'Принять',
        reject: 'Отклонить',
        logMessage: 'userIdBigInt перед созданием AssistantRequest',
    }
};

// Функция получения перевода
function getTranslation(lang: "en" | "ru", key: keyof typeof translations["en"]) {
    return translations[lang][key] || translations["en"][key];
}

// Функция для определения языка пользователя (например, по запросу или другим критериям)
function detectLanguage(): "en" | "ru" {
    // Логика определения языка пользователя (например, по заголовкам запроса)
    return "en"; // Пример: возвращаем английский по умолчанию
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const { userId } = body;
  
      const lang = detectLanguage(); // Определяем язык
  
      if (!userId) {
        return new Response(JSON.stringify({ error: getTranslation(lang, 'userIdRequired') }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      const userIdBigInt = BigInt(userId);
  
      await sendLogToTelegram(getTranslation(lang, 'logMessage'));
  
      const userExists = await prisma.user.findUnique({
        where: { telegramId: userIdBigInt },
      });
  
      if (!userExists) {
        return new Response(JSON.stringify({ error: getTranslation(lang, 'userNotFound') }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      // Проверяем, есть ли у пользователя доступные запросы к ассистенту
      if (userExists.assistantRequests <= 0) {
        return new Response(JSON.stringify({ error: getTranslation(lang, 'notEnoughRequests') }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      // Уменьшаем количество запросов к ассистенту на 1
      await prisma.user.update({
        where: { telegramId: userIdBigInt },
        data: {
          assistantRequests: { decrement: 1 },
        },
      });
  
      await sendTelegramMessageToUser(userIdBigInt.toString(), getTranslation(lang, 'requestReceived'));
  
      // Получаем запрос пользователя, чтобы потом обновлять ignoredAssistants
      let assistantRequest = await prisma.assistantRequest.findFirst({
        where: {
          userId: userIdBigInt,
          isActive: true,
        },
      });
  
      // Если нет активного запроса, создаем новый
      if (!assistantRequest) {
        assistantRequest = await prisma.assistantRequest.create({
          data: {
            userId: userIdBigInt,
            assistantId: BigInt(0), // временно, пока не выбран ассистент
            message: getTranslation(lang, 'assistantRequestMessage'),
            status: 'PENDING',
            isActive: true,
            ignoredAssistants: [], // Инициализация массива проигнорированных ассистентов
          },
        });
      }
  
      // Ищем доступного ассистента, исключая тех, кто уже в ignoredAssistants
      const availableAssistants = await prisma.assistant.findMany({
        where: {
          isWorking: true,
          isBusy: false,
          telegramId: {
            notIn: assistantRequest.ignoredAssistants || [], // исключаем ассистентов, которые проигнорировали запрос
          },
        },
        orderBy: {
          lastActiveAt: 'desc', // Сортируем по последней активности
        },
      });
  
      if (availableAssistants.length === 0) {
        return new Response(JSON.stringify({ message: getTranslation(lang, 'noAssistantsAvailable') }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      const selectedAssistant = availableAssistants[0];
  
      await prisma.assistant.update({
        where: { telegramId: selectedAssistant.telegramId },
        data: {
          isBusy: true,
          lastActiveAt: new Date(), // Обновляем время последней активности
        },
      });
  
      // Обновляем запрос с новым ассистентом
      await prisma.assistantRequest.update({
        where: { id: assistantRequest.id },
        data: {
          assistantId: selectedAssistant.telegramId,
        },
      });
  
      // Отправляем сообщение ассистенту с кнопками для принятия или отклонения
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        getTranslation(lang, 'assistantRequestMessage'),
        [
          { text: getTranslation(lang, 'accept'), callback_data: `accept_${assistantRequest.id}` },
          { text: getTranslation(lang, 'reject'), callback_data: `reject_${assistantRequest.id}` },
        ]
      );
  
      return new Response(JSON.stringify({ message: getTranslation(lang, 'requestSent') }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Ошибка:', error);
      return new Response(JSON.stringify({ error: getTranslation(detectLanguage(), 'serverError') }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }


// Обновим и другие вспомогательные функции, чтобы использовать локализацию
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

async function sendLogToTelegram(message: string) {
    const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
    const chatId = '5829159515';
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    });
}

type TelegramButton = {
    text: string;
    callback_data: string;
};
