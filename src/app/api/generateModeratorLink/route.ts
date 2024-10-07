import { PrismaClient } from '@prisma/client'; 
import { nanoid } from 'nanoid'; // Для генерации уникальных токенов

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return new Response(JSON.stringify({ message: 'Логин и пароль обязательны' }), {
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

    // Генерируем уникальный inviteToken
    const inviteToken = nanoid(10);

    // Сохраняем нового модератора с логином, паролем и токеном приглашения
    await prisma.moderator.create({
      data: {
        login, // Логин для модератора
        password, // Пароль для модератора
        inviteToken, // Токен приглашения
      },
    });

    // Генерируем ссылку на бота для модераторов
    const inviteLink = `https://t.me/vpn_srm_adminbot?start=invite_${inviteToken}`; // Используем токен в ссылке

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
