import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    
    await sendTelegramMessageToUser(userId, 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.');

 
    const availableAssistants = await prisma.assistant.findMany({
      where: {
        isWorking: true,
        isBusy: false,
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    if (availableAssistants.length === 0) {
      return new Response(JSON.stringify({ message: 'Нет доступных ассистентов' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const selectedAssistant = availableAssistants[0];


    await prisma.assistant.update({
      where: { id: selectedAssistant.id },
      data: { isBusy: true },
    });

   
    const assistantRequest = await prisma.assistantRequest.create({
      data: {
        userId: userId,
        assistantId: selectedAssistant.id,
        message: 'Запрос пользователя на разговор',
        status: 'PENDING',
        isActive: false, 
      },
    });


    await sendTelegramMessageWithButtons(
      selectedAssistant.telegramId,
      'Поступил запрос от пользователя',
      [
        { text: 'Принять', callback_data: `accept_${assistantRequest.id}` },
        { text: 'Отклонить', callback_data: `reject_${assistantRequest.id}` },
      ]
    );

    return new Response(JSON.stringify({ message: 'Запрос отправлен ассистенту.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка:', error);
    return new Response(JSON.stringify({ error: 'Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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
        inline_keyboard: [buttons],
      },
    }),
  });
}


export async function handleCallbackQuery(callbackQuery: any) {
  const data = callbackQuery.data;
  const assistantId = callbackQuery.from.id;


  const [action, requestId] = data.split('_');

  if (action === 'accept') {

    await prisma.assistantRequest.update({
      where: { id: Number(requestId) },
      data: { status: 'IN_PROGRESS', isActive: true },
    });

 
    await sendTelegramMessageToAssistant(assistantId, 'Вы приняли запрос, ожидайте пока пользователь сформулирует свой вопрос.');

 
    const request = await prisma.assistantRequest.findUnique({
      where: { id: Number(requestId) },
      include: { user: true },
    });

    if (request) {
    
      await sendTelegramMessageToUser(request.user.telegramId, 'Ассистент присоединился к чату. Сформулируйте свой вопрос.');
    }

  } else if (action === 'reject') {

    await prisma.assistantRequest.update({
      where: { id: Number(requestId) },
      data: { status: 'REJECTED', isActive: false },
    });


    await sendTelegramMessageToAssistant(assistantId, 'Вы отклонили запрос.');
  }
}

async function sendTelegramMessageToAssistant(chatId: string, text: string) {
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
    }),
  });
}


export async function handleMessage(ctx: any) {
  const userId = ctx.from.id;
  const message = ctx.message.text;


  const activeRequest = await prisma.assistantRequest.findFirst({
    where: { userId: userId, isActive: true },
    include: { assistant: true },
  });

  if (activeRequest) {
    const assistantId = activeRequest.assistant.telegramId;
   
    await sendTelegramMessageToAssistant(assistantId, message);
  } else {
    await sendTelegramMessageToUser(userId, 'У вас нет активных запросов.');
  }
}
