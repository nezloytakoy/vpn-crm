// messageHandler.ts

import { PrismaClient } from '@prisma/client';
import {
  sendTelegramMessageToUser,
  sendTelegramMessageWithButtons,
  sendLogToTelegram,
} from './helpers';
import { selectAssistant } from './assistantSelector';
import { getTranslation, detectLanguage } from './translations';

const prisma = new PrismaClient();

export async function handleUserMessage(userId: string, messageText: string) {
  const userIdBigInt = BigInt(userId);
  const lang = detectLanguage();

  const user = await prisma.user.findUnique({
    where: { telegramId: userIdBigInt },
  });

  if (user?.isWaitingForSubject) {
    // User is expected to provide the subject
    // Find the active AssistantRequest
    const assistantRequest = await prisma.assistantRequest.findFirst({
      where: {
        userId: userIdBigInt,
        isActive: true,
        status: 'PENDING',
        subject: null,
      },
    });

    if (assistantRequest) {
      // Update the AssistantRequest with the subject provided by the user
      await prisma.assistantRequest.update({
        where: { id: assistantRequest.id },
        data: { subject: messageText },
      });

      // Update user to no longer be waiting for the subject
      await prisma.user.update({
        where: { telegramId: userIdBigInt },
        data: { isWaitingForSubject: false },
      });

      await sendLogToTelegram(`User ${userIdBigInt.toString()} provided subject: ${messageText}`);

      // Proceed to select and assign an assistant
      const selectedAssistant = await selectAssistant(assistantRequest.ignoredAssistants || []);

      if (!selectedAssistant) {
        await sendLogToTelegram('No available assistants after sorting.');

        await sendTelegramMessageToUser(
          userId,
          getTranslation(lang, 'noAssistantsAvailable')
        );

        return;
      }

      // Update the AssistantRequest with the assistantId
      await prisma.assistantRequest.update({
        where: { id: assistantRequest.id },
        data: { assistantId: selectedAssistant.telegramId },
      });

      // Mark assistant as busy
      await prisma.assistant.update({
        where: { telegramId: selectedAssistant.telegramId },
        data: { isBusy: true, lastActiveAt: new Date() },
      });

      await sendLogToTelegram(
        `Assigned assistant ${selectedAssistant.telegramId.toString()} to user ${userIdBigInt.toString()}`
      );

      // Notify the assistant with the subject
      await sendTelegramMessageWithButtons(
        selectedAssistant.telegramId.toString(),
        `${getTranslation(lang, 'assistantRequestMessage')}\nSubject: ${messageText}`,
        [
          {
            text: getTranslation(lang, 'accept'),
            callback_data: `accept_${assistantRequest.id.toString()}`,
          },
          {
            text: getTranslation(lang, 'reject'),
            callback_data: `reject_${assistantRequest.id.toString()}`,
          },
        ]
      );

      await sendLogToTelegram(
        `Sent message to assistant ID: ${selectedAssistant.telegramId.toString()} with request from user ${userIdBigInt.toString()}`
      );

      await sendTelegramMessageToUser(
        userId,
        getTranslation(lang, 'requestSent')
      );
    } else {
      // No active assistant request found; handle accordingly
      await sendTelegramMessageToUser(
        userId,
        getTranslation(lang, 'noActiveRequest')
      );
    }
  } else {
    // Handle other user messages or commands
  }
}
