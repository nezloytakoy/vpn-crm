import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { message, chatId } = body;
  
      if (!message || !chatId) {
        return NextResponse.json({ error: 'Message and chatId are required' }, { status: 400 });
      }
  
      // Логика отправки сообщения через Telegram API с использованием TELEGRAM_USER_BOT_TOKEN
      const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId, // Используем chatId, переданный из компонента
          text: message,
        }),
      });
  
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
      }
  
      return NextResponse.json({ message: 'Message sent successfully' }, { status: 200 });
    } catch (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ error: 'Error sending message' }, { status: 500 });
    }
  }