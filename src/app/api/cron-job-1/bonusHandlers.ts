import { PrismaClient } from "@prisma/client";
import { sendTelegramMessageToAssistant } from "./telegramHelpers";
import { getTranslation } from "./reminderHandlers";

const prisma = new PrismaClient();

export async function awardAssistantBonus(
  assistantId: bigint,
  amount: number,
  periodCount: number
) {
  // 1) Находим ассистента в базе, чтобы узнать его язык
  const assistantRecord = await prisma.assistant.findUnique({
    where: { telegramId: assistantId },
    select: { language: true },
  });

  // 2) Если язык не найден / null, используем "en" по умолчанию
  let assistantLang: "en" | "ru" = "en";
  if (assistantRecord?.language === "ru") {
    assistantLang = "ru";
  }

  // 3) Обновляем монеты
  await prisma.assistant.update({
    where: { telegramId: assistantId },
    data: { coins: { increment: amount } },
  });

  // 4) Формируем reason (для записи в assistantCoinTransaction) - локализованный
  let reason = getTranslation(assistantLang, "assistant_bonus_reason");
  reason = reason
    .replace("%periodCount%", periodCount.toString());

  await prisma.assistantCoinTransaction.create({
    data: {
      assistantId: assistantId,
      amount: amount,
      reason, // например: "Бонус за 10 завершенных диалогов"
    },
  });

  // 5) Формируем сообщение ассистенту о начислении
  let bonusMessage = getTranslation(assistantLang, "assistant_bonus_awarded");
  bonusMessage = bonusMessage
    .replace("%amount%", amount.toString())
    .replace("%periodCount%", periodCount.toString());

  // Отправляем сообщение ассистенту
  await sendTelegramMessageToAssistant(
    assistantId.toString(),
    bonusMessage
  );
}

export async function awardMentorBonus(
  mentorId: bigint,
  amount: number,
  periodCount: number
) {
  // 1) Находим ассистента (наставника) в базе, чтобы узнать язык
  const assistantRecord = await prisma.assistant.findUnique({
    where: { telegramId: mentorId },
    select: { language: true },
  });

  // 2) fallback "en"
  let assistantLang: "en" | "ru" = "en";
  if (assistantRecord?.language === "ru") {
    assistantLang = "ru";
  }

  // 3) Обновляем монеты наставнику
  await prisma.assistant.update({
    where: { telegramId: mentorId },
    data: { coins: { increment: amount } },
  });

  // 4) Формируем локализованный reason для assistantCoinTransaction
  let reason = getTranslation(assistantLang, "mentor_bonus_reason");
  reason = reason
    .replace("%periodCount%", periodCount.toString());

  await prisma.assistantCoinTransaction.create({
    data: {
      assistantId: mentorId,
      amount: amount,
      reason,
    },
  });

  // 5) Формируем сообщение о бонусе наставнику
  let bonusMessage = getTranslation(assistantLang, "mentor_bonus_awarded");
  bonusMessage = bonusMessage
    .replace("%amount%", amount.toString())
    .replace("%periodCount%", periodCount.toString());

  await sendTelegramMessageToAssistant(
    mentorId.toString(),
    bonusMessage
  );
}
