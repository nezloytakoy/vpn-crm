import { PrismaClient } from '@prisma/client';
import { sendTelegramMessageToUser, sendTelegramMessageToAssistant } from './telegramHelpers';  // Вспомогательные функции для отправки сообщений

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Найти все активные диалоги, которые идут дольше часа
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // Время час назад
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lt: oneHourAgo },
      },
      include: { user: true, assistant: true }, // Предполагается, что есть доступ к данным пользователя и ассистента
    });

    if (conversations.length === 0) {
      return new Response(JSON.stringify({ message: 'Нет активных диалогов, превышающих 1 час.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Проходимся по всем разговорам
    for (const conversation of conversations) {
      // Проверяем, кто отправил последнее сообщение
      if (conversation.lastMessageFrom === 'ASSISTANT') {
        // Начисляем ассистенту 1 коин
        await prisma.assistant.update({
          where: { telegramId: conversation.assistantId },
          data: { coins: { increment: 1 } }, // Увеличиваем количество коинов на 1
        });

        // Отправляем сообщение ассистенту об успешном начислении коина
        await sendTelegramMessageToAssistant(
          conversation.assistantId.toString(),
          'Вам начислен 1 коин за завершение диалога.'
        );
      }

      // Обновляем статус разговора как завершенный
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'ABORTED' }, // Устанавливаем статус как "ABORTED"
      });

      // Добавляем запись с действием IGNORED в таблицу RequestAction
      await prisma.requestAction.create({
        data: {
          requestId: conversation.requestId,
          assistantId: conversation.assistantId,
          action: 'IGNORED', // Действие IGNORED
        },
      });

      // Уведомляем пользователя о закрытии разговора
      await sendTelegramMessageToUser(
        conversation.userId.toString(),
        'Ваш диалог был закрыт из-за отсутствия активности.'
      );

      // Уведомляем ассистента о закрытии разговора
      await sendTelegramMessageToAssistant(
        conversation.assistantId.toString(),
        'Диалог был закрыт через 1 час бездействия.'
      );
    }

    return new Response(JSON.stringify({ message: 'Диалоги обновлены.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка при закрытии диалогов:', error);
    return new Response(JSON.stringify({ error: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
