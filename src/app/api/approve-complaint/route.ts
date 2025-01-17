import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getTranslation } from '../admin-bot/localization';
import { sendLogToTelegram } from '../cron-job-1/reminderHandlers';
// ... при необходимости другие импорты

const prisma = new PrismaClient();

// Функция для отправки локализованных сообщений в Telegram
async function sendMessageToTelegram(telegramId: bigint, message: string, token: string) {
  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  console.log(`Отправка сообщения в Telegram ID: ${telegramId}, Текст: ${message}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId.toString(),
      text: message,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    console.error('Ошибка при отправке сообщения в Telegram:', errorDetails);
    throw new Error(`Ошибка при отправке сообщения в Telegram: ${errorDetails.description || 'Unknown error'}`);
  }

  console.log('Сообщение успешно отправлено в Telegram');
}

export async function POST(request: NextRequest) {
  try {
    console.log("Запрос получен, начало обработки");

    const { complaintId, explanation, moderatorId } = await request.json();
    console.log("Тело запроса:", { complaintId, explanation, moderatorId });

    // -- Локализация для ответов/ошибок (куда отдаем?)
    // Предположим, у нас нет языка модераторов/админов в БД => fallback "ru" или "en"
    const fallbackLang: "ru" | "en" = "ru";

    if (!complaintId || !explanation || !moderatorId) {
      console.log('Отсутствуют необходимые данные в запросе');
      const msg = getTranslation(fallbackLang, "missing_data");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Ищем модератора или админа
    const moderator = await prisma.moderator.findUnique({
      where: { id: BigInt(moderatorId) },
    });
    const admin = await prisma.admin.findUnique({
      where: { id: BigInt(moderatorId) },
    });

    if (!moderator && !admin) {
      console.log('Модератор или администратор с указанным ID не найден');
      const msg = getTranslation(fallbackLang, "no_moderator_found");
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    // Обновляем поле lastActiveAt только для модераторов
    if (moderator) {
      await prisma.moderator.update({
        where: { id: BigInt(moderatorId) },
        data: { lastActiveAt: new Date() },
      });
      console.log(`Последнее время активности модератора с ID ${moderatorId} обновлено`);
    }

    // Ищем жалобу
    console.log(`Поиск жалобы с ID ${complaintId}`);
    const complaint = await prisma.complaint.findUnique({
      where: { id: BigInt(complaintId) },
    });

    if (!complaint) {
      console.log(`Жалоба с ID ${complaintId} не найдена`);
      const msg = getTranslation(fallbackLang, "complaint_not_found");
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    console.log('Жалоба найдена:', complaint);

    // -- Локализуем для пользователя. Считаем язык user из таблицы user
    const userRecord = await prisma.user.findUnique({
      where: { telegramId: complaint.userId },
      select: { language: true },
    });
    // fallback, если нет language
    let userLang: "ru" | "en" = "ru";
    if (userRecord?.language === "en") {
      userLang = "en";
    }

    // Начисляем 1 коин пользователю
    console.log(`Начисление коина пользователю с Telegram ID ${complaint.userId}`);
    await prisma.user.update({
      where: { telegramId: complaint.userId },
      data: { coins: { increment: 1 } },
    });

    // -- Формируем локализованные сообщения
    // complaint_approved_user: "Ваша жалоба одобрена. Вам начислен 1 койн. %explanation%"
    // complaint_approved_assistant: "Жалоба пользователя показалась модератору убедительной. %explanation%"
    const userTemplate = getTranslation(userLang, "complaint_approved_user");
    const userMessage = userTemplate.replace("%explanation%", explanation);

    // Для ассистента - может быть другой язык, если хотите, 
    // но сейчас у нас нет assistant.language => fallback "ru" (или "en")
    // Если хотите, можно найти assistant в prisma.assistant, 
    //   assistantLang = assistant.language ?? "ru"
    // Но здесь, судя по коду, complaint.assistantId - telegramId ассистента.
    const assistantLangFallback: "ru" | "en" = "ru";
    const assistantMessageTemplate = getTranslation(assistantLangFallback, "complaint_approved_assistant");
    const assistantMessage = assistantMessageTemplate.replace("%explanation%", explanation);

    // Достаём токены
    const supportBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;

    if (!supportBotToken || !userBotToken) {
      console.log('Токены для Telegram ботов не найдены');
      const msg = getTranslation(fallbackLang, "bot_tokens_missing"); 
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    console.log('Отправка сообщения пользователю');
    await sendMessageToTelegram(complaint.userId, userMessage, userBotToken);

    console.log('Отправка сообщения ассистенту');
    await sendMessageToTelegram(complaint.assistantId, assistantMessage, supportBotToken);

    console.log('Сообщения успешно отправлены');

    // Обновляем жалобу => REVIEWED
    console.log(`Обновление статуса жалобы с ID ${complaint.id} на REVIEWED`);
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'REVIEWED',
        decision: explanation,
        moderatorId: moderator ? BigInt(moderatorId) : null, // Привязываем модератора, если он есть
      },
    });

    // Увеличиваем счётчик рассмотренных жалоб, если есть модератор
    if (moderator) {
      console.log(`Увеличение счетчика рассмотренных жалоб для модератора с ID ${moderatorId}`);
      await prisma.moderator.update({
        where: { id: BigInt(moderatorId) },
        data: {
          reviewedComplaintsCount: { increment: 1 },
        },
      });
      console.log('Счетчик рассмотренных жалоб успешно увеличен');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Ошибка при обработке жалобы:', error instanceof Error ? error.message : error);
    await sendLogToTelegram(`Ошибка при обработке жалобы: ${String(error)}`);
    return NextResponse.json({ error: 'Произошла ошибка' }, { status: 500 });
  }
}
