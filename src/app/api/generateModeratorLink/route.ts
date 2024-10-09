import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

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

    // Генерируем уникальный токен приглашения
    const inviteToken = nanoid(10);

    // Сохраняем запись приглашения в базу
    await prisma.invitation.create({
      data: {
        link: `https://t.me/vpn_srm_adminbot?start=invite_${inviteToken}`,
        token: inviteToken,
        role: 'moderator',
      },
    });

    // Возвращаем сгенерированную ссылку
    const inviteLink = `https://t.me/vpn_srm_adminbot?start=invite_${inviteToken}`;

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
