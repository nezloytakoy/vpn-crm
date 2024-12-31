// index.ts

import { PrismaClient } from '@prisma/client';
import { getTranslation, detectLanguage } from './translations';
import { handleAssistantRequest } from './tariffValidation';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    const lang = detectLanguage();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: getTranslation(lang, 'userIdRequired') }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userIdBigInt = BigInt(userId);

    // 1) Ищем пользователя по ID
    const user = await prisma.user.findUnique({
      where: { telegramId: userIdBigInt },
      select: {
        isBlocked: true,
        unblockDate: true,
      },
    });

    if (!user) {
      // Пользователь не найден
      return new Response(
        JSON.stringify({ error: getTranslation(lang, 'userNotFound') }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2) Проверяем, заблокирован ли и не истекла ли дата разблокировки
    if (
      user.isBlocked === true &&
      user.unblockDate &&
      user.unblockDate.getTime() > Date.now()
    ) {
      // 3) Пользователь заблокирован — считаем оставшееся время
      const msLeft = user.unblockDate.getTime() - Date.now();
      // Пусть отправим сообщение в минутах (или часах, как угодно)
      const minutesLeft = Math.ceil(msLeft / 1000 / 60);

      // Формируем текст для отправки
      const messageText = `Вы заблокированы. До разблокировки осталось примерно ${minutesLeft} минут.`;

      // 4) Отправляем сообщение в Telegram
      // Убедитесь, что у вас есть process.env.TELEGRAM_USER_BOT_TOKEN
      const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
      if (!botToken) {
        console.error('TELEGRAM_USER_BOT_TOKEN не задан в переменных окружения');
      } else {
        const chatId = userId; // Так как userId = Telegram ID
        const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        await fetch(sendMessageUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,       // ID чата = telegramId пользователя
            text: messageText,
          }),
        }).catch((err) => {
          console.error('Ошибка при отправке сообщения о блокировке:', err);
        });
      }

      // Можем также вернуть ответ, который скажет фронту, что пользователь заблокирован
      return new Response(
        JSON.stringify({ error: getTranslation(lang, 'userIsBlocked') }),
        {
          status: 403, // Forbidden
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Если не заблокирован, продолжаем логику:
    const result = await handleAssistantRequest(userIdBigInt);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: getTranslation(detectLanguage(), 'serverError') }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
