// helpers.ts

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export type TelegramButton = {
  text: string;
  callback_data: string;
};

export async function sendTelegramMessageToUser(chatId: string, text: string) {
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

export async function sendTelegramMessageWithButtons(
  chatId: string,
  text: string,
  buttons: TelegramButton[]
) {
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
        inline_keyboard: buttons.map((button) => [
          { text: button.text, callback_data: button.callback_data },
        ]),
      },
    }),
  });
}

export async function sendLogToTelegram(message: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  const chatId = '5829159515'; // Замените на ваш chat_id
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

export async function getPenaltyPointsForLast24Hours(
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
