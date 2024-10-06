import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid'; // Для генерации уникальных токенов

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Токен приглашения обязателен' });
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: token as string },
    });

    if (!invitation || invitation.used) {
      return res.status(400).json({ message: 'Недействительная или уже использованная ссылка' });
    }

    // Предполагаем, что у вас есть какой-то способ получения `telegramId` модератора
    const { telegramId } = req.body; // Получаем `telegramId` из запроса

    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID обязателен' });
    }

    // Добавляем модератора в систему
    await prisma.moderator.create({
      data: {
        login: `moderator_${nanoid()}`, // Сгенерированный логин
        password: 'defaultPassword', // Пароль, который можно будет сменить
        telegramId: BigInt(telegramId), // Telegram ID модератора
      },
    });

    // Обновляем статус приглашения как использованное
    await prisma.invitation.update({
      where: { token: token as string },
      data: { used: true },
    });

    res.status(200).json({ message: 'Приглашение успешно принято, модератор добавлен.' });
  } catch (error) {
    console.error('Ошибка при обработке приглашения модератора:', error);
    res.status(500).json({ message: 'Ошибка при обработке приглашения' });
  }
}
