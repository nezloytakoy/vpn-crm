import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid'; // Для генерации уникальных токенов
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { login, password, telegramId } = body;

    if (!login || !password || !telegramId) {
      return new Response(JSON.stringify({ message: 'Логин, пароль и telegramId обязательны' }), {
        status: 400,
      });
    }

    // Проверяем, не занят ли уже логин
    const existingModerator = await prisma.moderator.findUnique({
      where: { login },
    });

    if (existingModerator) {
      return new Response(JSON.stringify({ message: 'Логин уже используется' }), {
        status: 400,
      });
    }

    // Сохраняем нового модератора с логином, паролем и telegramId
    await prisma.moderator.create({
      data: {
        login, // Логин для модератора
        password, // Пароль для модератора
        telegramId, // Telegram ID модератора
      },
    });

    // Генерируем ссылку на бота для модераторов
    const inviteLink = `https://t.me/vpn_srm_adminbot?start=invite_${nanoid(10)}`; // Используем токен в ссылке

    // Отправляем сообщение новому модератору в Telegram
    const telegramMessage = `Ваш логин: ${login}\nВаш пароль: ${password}\n\nВы были зарегистрированы как модератор.\nИспользуйте эту ссылку для подключения к боту: ${inviteLink}`;

    await sendTelegramMessage(telegramId, telegramMessage); // Отправляем сообщение по Telegram ID

    return new Response(JSON.stringify({ link: inviteLink }), {
      status: 200,
    });
  } catch (error) {
    console.error('Ошибка при генерации ссылки для модератора:', error);
    return new Response(JSON.stringify({ message: 'Ошибка при генерации ссылки' }), {
      status: 500,
    });
  }
}

// Функция отправки сообщений через бота в Telegram
async function sendTelegramMessage(telegramId: string, message: string) {
  const botToken = process.env.TELEGRAM_MODERATOR_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const telegramUrl = `${url}?chat_id=${encodeURIComponent(telegramId)}&text=${encodeURIComponent(message)}`;
    await fetch(telegramUrl, { method: 'POST' });
  } catch (error) {
    console.error('Ошибка при отправке сообщения модератору:', error);
  }
}
