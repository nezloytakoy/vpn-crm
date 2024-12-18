import { PrismaClient } from '@prisma/client'; 
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    console.log("Начало обработки запроса на создание приглашения");

    const body = await req.json();
    console.log("Тело запроса:", body);

    const { login, password } = body;

    if (!login || !password) {
      console.log("Логин или пароль отсутствуют");
      return new Response(JSON.stringify({ message: 'Логин и пароль обязательны' }), {
        status: 400,
      });
    }

    console.log("Проверка существования логина:", login);

    // Проверяем, не занят ли уже логин в таблице invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: { login },
    });

    if (existingInvitation) {
      console.log("Логин уже используется в invitation:", login);
      return new Response(JSON.stringify({ message: 'Логин уже используется в приглашениях' }), {
        status: 400,
      });
    }

    // Проверяем, не существует ли уже модератор с таким логином
    const existingModerator = await prisma.moderator.findFirst({
      where: { login },
    });

    if (existingModerator) {
      console.log("Логин уже используется модератором:", login);
      return new Response(JSON.stringify({ message: 'Логин уже используется модератором' }), {
        status: 400,
      });
    }

    console.log("Хеширование пароля");
    const hashedPassword = bcrypt.hashSync(password, 10);

    const inviteToken = nanoid(10);
    console.log("Сгенерирован токен приглашения:", inviteToken);

    console.log("Сохранение данных в таблицу приглашений");
    await prisma.invitation.create({
      data: {
        login,
        password: hashedPassword,
        token: inviteToken,
        role: 'moderator',
        link: `https://t.me/vpn_srm_adminbot?start=invite_${inviteToken}`,
      },
    });

    const inviteLink = `https://t.me/vpn_srm_adminbot?start=invite_${inviteToken}`;
    console.log("Создана ссылка на приглашение:", inviteLink);

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