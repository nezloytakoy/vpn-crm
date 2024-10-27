import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
      const { categories, message } = await request.json();
  
      if (!categories || categories.length === 0 || !message) {
        return NextResponse.json({ error: 'Не указаны категории или сообщение.' }, { status: 400 });
      }
  
      const users = await prisma.user.findMany({
        where: {
          subscriptionType: {
            in: categories,
          },
        },
      });
  
      for (const user of users) {
        if (user.telegramId) {
          await sendMessageToUser(user.telegramId.toString(), message);
        }
      }
  
      return NextResponse.json({ message: 'Сообщения успешно отправлены' });
    } catch (error) {
      console.error('Ошибка при отправке сообщений пользователям:', error);
      return NextResponse.json(
        { error: 'Не удалось отправить сообщения пользователям.' },
        { status: 500 }
      );
    }
  }
  

// Helper function to send a message to a user
async function sendMessageToUser(telegramId: string, message: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_USER_BOT_TOKEN not configured');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: telegramId, text: message }),
  });
}
