import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }


    await sendTelegramMessage(userId, 'Ваш запрос получен. Ожидайте, пока с вами свяжется ассистент.');


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
      return res.status(200).json({ message: 'Нет доступных ассистентов' });
    }

    const selectedAssistant = availableAssistants[0];


    await prisma.assistant.update({
      where: { id: selectedAssistant.id },
      data: { isBusy: true },
    });

 
    await sendTelegramMessageWithButtons(
      selectedAssistant.telegramId,
      'Поступил запрос от пользователя',
      [
        { text: 'Принять', callback_data: `accept_${userId}` },
        { text: 'Отклонить', callback_data: `reject_${userId}` },
      ]
    );

    return res.status(200).json({ message: 'Запрос отправлен ассистенту.' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}


async function sendTelegramMessage(chatId: string, text: string) {
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
