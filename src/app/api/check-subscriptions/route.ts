import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log('Получен POST-запрос к /api/check-subscriptions');

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      console.error('userId не предоставлен в теле запроса');
      return new Response(JSON.stringify({ error: 'userId обязателен' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const userIdBigInt = BigInt(userId);

    console.log(`Проверка подписок для пользователя с ID: ${userIdBigInt.toString()}`);

    const now = new Date();

    // Получаем все подписки пользователя с истекшим сроком действия
    const expiredSubscriptions = await prisma.userTariff.findMany({
      where: {
        userId: userIdBigInt,
        expirationDate: {
          lt: now,
        },
      },
    });

    if (expiredSubscriptions.length === 0) {
      console.log('Нет истекших подписок для данного пользователя.');
      return new Response(JSON.stringify({ message: 'Нет истекших подписок.' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    console.log(`Найдены истекшие подписки: ${expiredSubscriptions.length}`);

    // Суммируем оставшиеся запросы из истекших подписок
    const totalRemainingAssistantRequests = expiredSubscriptions.reduce(
      (sum, subscription) => sum + subscription.remainingAssistantRequests,
      0
    );

    const totalRemainingAIRequests = expiredSubscriptions.reduce(
      (sum, subscription) => sum + subscription.remainingAIRequests,
      0
    );

    console.log(
      `Всего оставшихся запросов у истекших подписок: к ассистенту - ${totalRemainingAssistantRequests}, к ИИ - ${totalRemainingAIRequests}`
    );

    // Отнимаем оставшиеся запросы от текущего количества запросов пользователя
    const updatedUser = await prisma.user.update({
      where: {
        telegramId: userIdBigInt,
      },
      data: {
        assistantRequests: {
          decrement: totalRemainingAssistantRequests,
        },
        aiRequests: {
          decrement: totalRemainingAIRequests,
        },
      },
    });

    console.log('Обновлен пользователь:', updatedUser);

    // Удаляем истекшие подписки
    const expiredSubscriptionIds = expiredSubscriptions.map((sub) => sub.id);
    await prisma.userTariff.deleteMany({
      where: {
        id: {
          in: expiredSubscriptionIds,
        },
      },
    });

    console.log(`Удалены истекшие подписки для пользователя с ID: ${userIdBigInt.toString()}`);

    return new Response(
      JSON.stringify({
        message: 'Обновление подписок завершено',
        remainingRequestsDeducted: {
          assistantRequests: totalRemainingAssistantRequests,
          aiRequests: totalRemainingAIRequests,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Ошибка сервера в /api/check-subscriptions:', error);

    let errorMessage = 'Неизвестная ошибка';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ error: 'Ошибка сервера', message: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
