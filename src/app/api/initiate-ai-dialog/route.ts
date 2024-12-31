import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log('Получен POST-запрос к /api/initiate-ai-dialog');

    const body = await request.json();
    console.log('Тело запроса:', body);
    const { userId } = body;

    if (!userId) {
      console.error('userId не предоставлен в теле запроса');
      return new Response(JSON.stringify({ error: 'userId обязателен' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Включаем режим общения с ИИ для пользователя с ID: ${userId}`);

    const userIdBigInt = BigInt(userId);
    const user = await prisma.user.findUnique({
      where: { telegramId: userIdBigInt },
    });

    if (!user) {
      console.error('Пользователь не найден');
      return new Response(JSON.stringify({ error: 'Пользователь не найден' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -------- Добавляем проверку блокировки --------
    const now = new Date();
    if (user.isBlocked && user.unblockDate && user.unblockDate > now) {
      // Пользователь заблокирован, нужно сообщить ему об этом
      const msLeft = user.unblockDate.getTime() - now.getTime();
      const minutesLeft = Math.ceil(msLeft / 1000 / 60);

      // Отправляем простое сообщение о блокировке
      const BOT_TOKEN = process.env.TELEGRAM_USER_BOT_TOKEN;
      if (BOT_TOKEN) {
        const textMessage = `Вы заблокированы. Осталось примерно ${minutesLeft} минут до разблокировки.`;

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const sendMessageResp = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            text: textMessage,
          }),
        });
        const telegramResult = await sendMessageResp.json();
        if (!telegramResult.ok) {
          console.error('Ошибка при отправке сообщения о блокировке:', telegramResult.description);
        }
      } else {
        console.error('BOT_TOKEN не установлен в переменных окружения');
      }

      // Завершаем обработку, возвращая ошибку
      return new Response(JSON.stringify({
        error: 'Пользователь заблокирован',
        minutesLeft: minutesLeft
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // -------- Конец проверки блокировки --------

    // Здесь остальная логика вашего кода:
    // 1) Проверка, есть ли тарифы
    // 2) Уменьшение remainingAIRequests
    // 3) Отправка сообщения о том, что режим общения с ИИ включён, и т. д.

    // Пример финальной части:
    return new Response(
      JSON.stringify({ message: 'AI dialog initiated' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Ошибка сервера в /api/initiate-ai-dialog:', error);

    let errorMessage = 'Неизвестная ошибка';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ error: 'Ошибка сервера', message: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}
