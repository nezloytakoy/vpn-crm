import { PrismaClient } from '@prisma/client';
import {
  getTranslation,
  detectLanguage,
} from './translations';
import {
  sendTelegramMessageToUser,
  sendLogToTelegram,
} from './helpers';
import {assignAssistant} from './assistantAssignment'

const prisma = new PrismaClient();

// Обработка ввода темы от пользователя
export async function handleUserSubjectInput(userIdBigInt: bigint, subject: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: userIdBigInt },
    });

    if (!user || !user.isWaitingForSubject) {
      console.error(`[handleUserSubjectInput] User not waiting for subject or not found.`);
      return;
    }

    // Находим активный запрос пользователя
    const activeRequest = await prisma.assistantRequest.findFirst({
      where: { userId: userIdBigInt, isActive: true, subject: null },
    });

    if (!activeRequest) {
      console.error(`[handleUserSubjectInput] Active request not found for user ${userIdBigInt}`);
      return;
    }

    // Обновляем запрос с введенной темой
    await prisma.assistantRequest.update({
      where: { id: activeRequest.id },
      data: { subject },
    });

    // Обновляем статус пользователя
    await prisma.user.update({
      where: { telegramId: userIdBigInt },
      data: { isWaitingForSubject: false },
    });

    await sendLogToTelegram(
      `[handleUserSubjectInput] User ${userIdBigInt.toString()} entered subject: ${subject}`
    );

    // Распределяем запрос на ассистента
    const assignedAssistant = await assignAssistant(activeRequest.id);

    if (!assignedAssistant) {
      await sendLogToTelegram(
        `[Warning] No available assistants for request ID ${activeRequest.id.toString()}`
      );
      await sendTelegramMessageToUser(
        userIdBigInt.toString(),
        getTranslation(detectLanguage(), 'noAssistantsAvailable')
      );
      return;
    }

    await sendLogToTelegram(
      `[Success] Request ID ${activeRequest.id.toString()} assigned to assistant ${assignedAssistant.telegramId.toString()}`
    );

    await sendTelegramMessageToUser(
      userIdBigInt.toString(),
      'Ваш запрос отправлен ассистенту. Ожидайте подтверждения.'
    );
  } catch (error) {
    console.error('Error in handleUserSubjectInput:', error);
    await sendLogToTelegram(
      `[Critical Error in handleUserSubjectInput]: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
