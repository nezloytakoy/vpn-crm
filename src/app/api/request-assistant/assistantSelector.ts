// assistantSelector.ts

import { PrismaClient } from '@prisma/client';
import { sendLogToTelegram, getPenaltyPointsForLast24Hours } from './helpers';

const prisma = new PrismaClient();

export async function selectAssistant(ignoredAssistants: bigint[]) {
  // Получаем список доступных ассистентов
  const availableAssistants = await prisma.assistant.findMany({
    where: {
      isWorking: true,
      isBusy: false,
      telegramId: { notIn: ignoredAssistants || [] },
    },
  });

  // Логируем найденных ассистентов
  if (availableAssistants.length === 0) {
    await sendLogToTelegram('Нет доступных ассистентов.');
    return null;
  } else {
    await sendLogToTelegram(
      `Найдено ${availableAssistants.length} доступных ассистентов:\n` +
        availableAssistants
          .map(
            (assistant) =>
              `ID: ${assistant.telegramId.toString()}, lastActiveAt: ${assistant.lastActiveAt}`
          )
          .join('\n')
    );
  }

  // Подсчитываем штрафные очки для ассистентов
  const assistantsWithPenalties = await Promise.all(
    availableAssistants.map(async (assistant) => {
      const penaltyPoints = await getPenaltyPointsForLast24Hours(assistant.telegramId);
      return { ...assistant, penaltyPoints };
    })
  );

  // Логируем ассистентов с штрафными очками
  await sendLogToTelegram(
    'Ассистенты с подсчитанными штрафными очками:\n' +
      assistantsWithPenalties
        .map(
          (a) =>
            `ID: ${a.telegramId.toString()}, Штрафные очки: ${a.penaltyPoints}, lastActiveAt: ${a.lastActiveAt}`
        )
        .join('\n')
  );

  // Сортируем ассистентов по штрафным очкам и времени последней активности
  assistantsWithPenalties.sort((a, b) => {
    if (a.penaltyPoints !== b.penaltyPoints) {
      return a.penaltyPoints - b.penaltyPoints;
    }
    return (
      (b.lastActiveAt ? b.lastActiveAt.getTime() : 0) -
      (a.lastActiveAt ? a.lastActiveAt.getTime() : 0)
    );
  });

  // Логируем отсортированных ассистентов
  await sendLogToTelegram(
    'Ассистенты после сортировки:\n' +
      assistantsWithPenalties
        .map(
          (a) =>
            `ID: ${a.telegramId.toString()}, Штрафные очки: ${a.penaltyPoints}, lastActiveAt: ${a.lastActiveAt}`
        )
        .join('\n')
  );

  if (assistantsWithPenalties.length === 0) {
    await sendLogToTelegram('Нет доступных ассистентов после сортировки.');
    return null;
  }

  const selectedAssistant = assistantsWithPenalties[0];

  // Логируем выбранного ассистента
  await sendLogToTelegram(
    `Выбран ассистент ID: ${selectedAssistant.telegramId.toString()}`
  );

  return selectedAssistant;
}
