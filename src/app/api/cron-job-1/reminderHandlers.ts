import { PrismaClient, Conversation, AssistantRequest } from '@prisma/client';
import { sendTelegramMessageToAssistant, sendTelegramMessageToUser } from './telegramHelpers';
import { handleIgnoredRequest } from './helpers';

const prisma = new PrismaClient();

export async function remindAssistant(conversation: Conversation & { assistantRequest: AssistantRequest }) {
  const assistantTelegramId = conversation.assistantId;
  const requestId = conversation.assistantRequest.id.toString();

  if (!assistantTelegramId) {
    console.log(`Невозможно напомнить ассистенту: assistantId отсутствует у диалога ID: ${conversation.id.toString()}`);
    return;
  }

  await sendTelegramMessageToAssistant(
    assistantTelegramId.toString(),
    `Пожалуйста, дайте ответ пользователю, запрос - ${requestId}`
  );

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { reminderSent: true },
  });

  console.log(
    `Напоминание отправлено ассистенту ${assistantTelegramId.toString()} для диалога ${conversation.id.toString()}`
  );

  for (let i = 1; i <= 5; i++) {
    await sendTelegramMessageToAssistant(
      assistantTelegramId.toString(),
      `Пожалуйста, дайте ответ пользователю, запрос - ${requestId}`
    );
    console.log(`Ассистенту ${assistantTelegramId.toString()} отправлено сообщение-напоминание номер ${i}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export async function handleIgnoredConversation(conversation: Conversation & { assistantRequest: AssistantRequest }) {
  const assistantTelegramId = conversation.assistantId;
  const requestId = conversation.assistantRequest.id.toString();

  if (!assistantTelegramId) {
    console.log(`Невозможно обработать игнорированный диалог: assistantId отсутствует у диалога ID: ${conversation.id.toString()}`);
    return;
  }

  // Блокируем ассистента навсегда
  await prisma.assistant.update({
    where: { telegramId: assistantTelegramId },
    data: {
      isBlocked: true,
      unblockDate: null,
      activeConversationId: null
    },
  });

  console.log(`Ассистент ${assistantTelegramId.toString()} был заблокирован навсегда.`);

  // Сообщаем пользователю о потере связи
  const userTelegramId = conversation.userId.toString();
  await sendTelegramMessageToUser(
    userTelegramId,
    'Связь с ассистентом потеряна, переключаем вас на другого ассистента...'
  );
  console.log(`Пользователю ${userTelegramId} отправлено сообщение о переключении ассистента.`);

  // Обновляем разговор: помечаем как PENDING
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status: 'PENDING',
      userId: BigInt(0),
      assistantId: null,
    },
  });

  // Перенаправляем запрос следующему ассистенту
  await handleIgnoredRequest(requestId, assistantTelegramId);

  console.log(`Запрос ${requestId} перенаправлен следующему ассистенту.`);
}
