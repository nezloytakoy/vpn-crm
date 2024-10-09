import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ message: 'Токен приглашения обязателен' }), {
        status: 400,
      });
    }

    // Поиск приглашения по токену
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.used) {
      return new Response(JSON.stringify({ message: 'Недействительная или уже использованная ссылка' }), {
        status: 400,
      });
    }

    const { telegramId, login, password } = await req.json(); // Получение `telegramId`, логина и пароля из тела запроса

    if (!telegramId || !login || !password) {
      return new Response(JSON.stringify({ message: 'Telegram ID, логин и пароль обязательны' }), {
        status: 400,
      });
    }

    // Проверка существующего модератора по логину
    const existingModerator = await prisma.moderator.findUnique({
      where: { login },
    });

    if (existingModerator) {
      return new Response(JSON.stringify({ message: 'Логин уже используется' }), {
        status: 400,
      });
    }

    // Добавление модератора в систему
    await prisma.moderator.create({
      data: {
        login, // Логин модератора
        password, // Пароль модератора
        id: BigInt(telegramId), // Используем `telegramId` как основной идентификатор
      },
    });

    // Обновление статуса приглашения как использованное
    await prisma.invitation.update({
      where: { token },
      data: { used: true },
    });

    return new Response(JSON.stringify({ message: 'Приглашение успешно принято, модератор добавлен.' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Ошибка при обработке приглашения модератора:', error);
    return new Response(JSON.stringify({ message: 'Ошибка при обработке приглашения' }), {
      status: 500,
    });
  }
}
