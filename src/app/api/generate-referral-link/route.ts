import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// Функция для отправки сообщений в Telegram
const sendLogToTelegram = async (message: string) => {
  const telegramToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  const chatId = 5829159515; 
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
  } catch (error) {
    console.error('Ошибка при отправке логов в Telegram:', error);
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      await sendLogToTelegram('Ошибка: не указан userId');
      return NextResponse.json({ error: 'Не указан userId' }, { status: 400 });
    }

    
    const referralCode = nanoid(10);

    
    const botUsername = 'vpn_srm_userbot'; 
    const referralLink = `https://t.me/${botUsername}?start=ref_${referralCode}`;

    
    await prisma.referral.create({
      data: {
        userId: BigInt(userId),
        code: referralCode,
        link: referralLink,
        createdAt: new Date(),
      },
    });

    await sendLogToTelegram(`Новая реферальная ссылка сгенерирована для пользователя ${userId}: ${referralLink}`);

    return NextResponse.json({ referralLink }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при генерации реферальной ссылки:', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    await sendLogToTelegram(`Ошибка при генерации реферальной ссылки для пользователя: ${errorMessage}`);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
