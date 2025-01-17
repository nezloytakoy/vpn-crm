import { PrismaClient, Conversation, AssistantRequest } from '@prisma/client';
import { processAssistantRewards } from './processAssistantRewards';
import { sendTelegramMessageToUser, sendTelegramMessageToAssistant } from './telegramHelpers';
import { handleRejectRequest } from './assistantHandlers';
import { remindAssistant, handleIgnoredConversation } from './reminderHandlers';
import { getTranslation } from './reminderHandlers';

const prisma = new PrismaClient();

export async function handleAssistantLastMessage(conversation: Conversation) {
  const activeRequest = await prisma.assistantRequest.findFirst({
    where: {
      id: conversation.requestId,
      isActive: true,
    },
    include: { assistant: true },
  });

  if (activeRequest) {
    console.log(
      `Найден активный запрос ID: ${activeRequest.id.toString()} для диалога ID: ${conversation.id.toString()}`
    );

    await prisma.assistantRequest.update({
      where: { id: activeRequest.id },
      data: { status: 'COMPLETED', isActive: false },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'COMPLETED' },
    });

    const assistantId = activeRequest.assistantId;
    if (assistantId) {
      await processAssistantRewards(assistantId);

      const coinsToAdd = 1;
      const reason = 'Автоматическое завершение диалога';

      if (activeRequest.assistant) {
        const updatedAssistant = await prisma.assistant.update({
          where: { telegramId: activeRequest.assistant.telegramId },
          data: { coins: { increment: coinsToAdd } },
        });

        await prisma.assistantCoinTransaction.create({
          data: {
            assistantId: activeRequest.assistant.telegramId,
            amount: coinsToAdd,
            reason: reason,
          },
        });

        await sendTelegramMessageToAssistant(
          updatedAssistant.telegramId.toString(),
          `Вам начислен ${coinsToAdd} коин за завершение диалога.`
        );
      } else {
        console.error('Ошибка: ассистент не найден при начислении коинов');
      }

      await (async () => {
        // 1) Считываем язык пользователя из базы
        const userRecord = await prisma.user.findUnique({
          where: { telegramId: conversation.userId },
          select: { language: true },
        });
      
        // 2) Определяем userLang (fallback — "en" если не задан или не "ru")
        let userLang: "en" | "ru" = "en";
        if (userRecord?.language === "ru") {
          userLang = "ru";
        }
      
        // 3) Берём переводы для текста и кнопок
        const sessionEndedText = getTranslation(userLang, "session_ended");
        const extendText = getTranslation(userLang, "extend_session_button");
        const satisfiedText = getTranslation(userLang, "im_satisfied");
        const complainText = getTranslation(userLang, "complain");
      
        // 4) Отправляем сообщение пользователю
        await sendTelegramMessageToUser(
          conversation.userId.toString(),
          sessionEndedText,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: extendText, callback_data: "extend_session" }],
                [{ text: satisfiedText, callback_data: "satisfied" }],
                [{ text: complainText, callback_data: "complain" }],
              ],
            },
          }
        );
      })();
      console.log(
        `Пользователю ID: ${conversation.userId.toString()} отправлено сообщение о завершении сеанса`
      );
    } else {
      console.error('Ошибка: assistantId is null');
      return;
    }
  } else {
    console.error('Ошибка: активный запрос не найден');
  }
}

export async function handleUserLastMessage(conversation: Conversation) {
  console.log(`Последнее сообщение от пользователя в диалоге ID: ${conversation.id.toString()}`);

  if (conversation.assistantId) {
    await sendTelegramMessageToUser(
      conversation.userId.toString(),
      'Связь с ассистентом утеряна, вы будете переключены на другого ассистента.'
    );
    await sendTelegramMessageToAssistant(
      conversation.assistantId.toString(),
      'Вы оставили вопрос пользователя без ответа. Койн не будет засчитан.'
    );

    await handleRejectRequest(conversation.requestId.toString(), conversation.assistantId);
    console.log(`Запрос ID: ${conversation.requestId.toString()} обработан как отклоненный`);
  } else {
    console.log(`Нет ассистента у диалога ID ${conversation.id.toString()}, невозможно выполнить handleUserLastMessage.`);
  }
}

export async function checkActiveConversations() {
  console.log('Проверка активных бесед на наличие непрочитанных сообщений от пользователя...');

  const activeConversations = await prisma.conversation.findMany({
    where: {
      status: 'IN_PROGRESS',
    },
    include: {
      assistant: true,
      assistantRequest: true,
    },
  });

  for (const conversation of activeConversations) {
    if (conversation.lastMessageFrom === 'USER') {
      console.log(`Последнее сообщение от пользователя в диалоге ID: ${conversation.id.toString()}`);

      if (!conversation.reminderSent) {
        if (conversation.assistantId && conversation.assistantRequest) {
          await remindAssistant(conversation as Conversation & { assistantRequest: AssistantRequest });
        } else {
          console.log(`Невозможно отправить напоминание: нет assistantId или assistantRequest у диалога ID: ${conversation.id.toString()}`);
        }
      } else {
        if (conversation.assistantId && conversation.assistantRequest) {
          await handleIgnoredConversation(conversation as Conversation & { assistantRequest: AssistantRequest });
        } else {
          console.log(`Невозможно обработать игнорированный диалог: нет assistantId или assistantRequest у диалога ID: ${conversation.id.toString()}`);
        }
      }
    }
  }
}
