// telegramHelpers.ts

import fetch from 'node-fetch';

// Function to send a message to the user
export async function sendTelegramMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_USER_BOT_TOKEN not found');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send message: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending message to user:', error);
  }
}

// Function to send a message to the assistant
export async function sendTelegramMessageToAssistant(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_SUPPORT_BOT_TOKEN not found');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send message: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending message to assistant:', error);
  }
}
