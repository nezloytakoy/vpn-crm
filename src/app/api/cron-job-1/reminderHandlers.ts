// remindAndIgnore.ts
import { PrismaClient, Conversation, AssistantRequest } from "@prisma/client";
import { sendTelegramMessageToAssistant, sendTelegramMessageToUser } from "./telegramHelpers";
import { handleIgnoredRequest } from "./helpers";

// Подкорректируйте пути импорта выше, чтобы соответствовать вашему проекту.

const prisma = new PrismaClient();

export async function sendLogToTelegram(message: string) {
  const TELEGRAM_BOT_TOKEN = '7956735167:AAGzZ_G97SfqE-ulMJZgi1Jt1l8VrR5aC5M'; // Замените на ваш токен
  const CHAT_ID = 5829159515;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: CHAT_ID,
    text: message,
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Ошибка при отправке логов в Telegram:', error);
  }
}


export const translations = {
  ru: {
    no_username_error: "У вас отсутствует имя пользователя в Telegram. Пожалуйста, установите его и повторите попытку.",
    login_password_missing: "Логин или пароль отсутствуют в приглашении.",
    already_moderator: "Вы уже являетесь модератором.",
    no_current_arbitrations: "У вас нет активных арбитражей или текущих запросов.",
    moderator_message_prefix: "Сообщение от модератора:\n\n%message%",
    id_invalid: "ID должен состоять из 9-10 цифр. Попробуйте снова.",
    message_prompt: "Напишите ваше сообщение.",
    message_sent: "Сообщение отправлено.",
    message_send_error: "Ошибка при отправке сообщения.",
    unknown_command: "Я вас не понимаю.",
    message_user: "Сообщение пользователю",
    message_assistant: "Сообщение ассистенту",
    menu: "Главное меню",
    welcome: "👋 Добро пожаловать, теперь у вас есть полномочия модератора.",
    invalid_link: "Неверная или уже использованная ссылка.",
    moderator_bot: "👋 Это бот для модераторов!",
    command_error: "Ошибка: не удалось обработать команду. Попробуйте снова.",
    user_id_prompt: "Введите ID пользователя",
    assistant_id_prompt: "Введите ID ассистента",
    error_processing_message: "Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.",
    no_user_id: "Не удалось получить ваш идентификатор пользователя.",
    no_text_message: "Пожалуйста, отправьте текстовое сообщение.",

    // Новые ключи
    assistant_reminder: "Пожалуйста, ответьте пользователю, запрос: %requestId%",
    assistant_reminderNumber: "Напоминание #%number%: ответьте пользователю, запрос: %requestId%",
    assistant_lost_connection: "Связь с ассистентом потеряна, переключаем вас на другого ассистента...",

    // Ещё новые ключи
    session_ended: "Ваш сеанс закончился! Если остались вопросы, вы можете продлить сеанс.",
    extend_session_button: "Продлить",
    im_satisfied: "Я доволен",
    complain: "Пожаловаться - Мне не помогло",
    assistant_bonus_awarded: "Поздравляем! Вам начислен бонус %amount% коинов за %periodCount% завершенных диалогов.",
    assistant_bonus_reason: "Бонус за %periodCount% завершенных диалогов",
    mentor_bonus_awarded: "Поздравляем! Вам начислен бонус наставника %amount% коинов за %periodCount% завершенных диалогов вашего подопечного.",
    new_request_from_user: "Новый запрос от пользователя",
    accept: "Принять",
    reject: "Отклонить",
    assistant_blocked_due_to_rejects: "Ассистент заблокирован из-за превышения лимита отказов.",
    no_assistants_available: "Нет доступных ассистентов.",
    topic_of_request: "Тема запроса: %subject%",
    no_subject: "У запроса нет темы.",
    mentor_bonus_reason: "Бонус наставника за %periodCount% завершенных диалогов подопечного"
  },
  en: {
    no_username_error: "You have no username in Telegram. Please set it and try again.",
    login_password_missing: "Login or password is missing in the invitation.",
    already_moderator: "You are already a moderator.",
    no_current_arbitrations: "You have no active arbitrations or current requests.",
    moderator_message_prefix: "Message from moderator:\n\n%message%",
    id_invalid: "The ID must be 9-10 digits. Please try again.",
    message_prompt: "Write your message.",
    message_sent: "Message sent successfully.",
    message_send_error: "Error sending the message.",
    unknown_command: "I don't understand you.",
    message_user: "Message to user",
    message_assistant: "Message to assistant",
    menu: "Main Menu",
    welcome: "👋 Welcome, now you have moderator privileges.",
    invalid_link: "The link is invalid or has already been used.",
    moderator_bot: "👋 This is a bot for moderators!",
    command_error: "Error: Could not process the command. Please try again.",
    user_id_prompt: "Enter the user ID",
    assistant_id_prompt: "Enter the assistant ID",
    error_processing_message: "An error occurred while processing your message. Please try again later.",
    no_user_id: "Failed to retrieve your user ID.",
    no_text_message: "Please send a text message.",

    // Новые ключи
    assistant_reminder: "Please respond to the user, request: %requestId%",
    assistant_reminderNumber: "Reminder #%number%: Please respond to the user, request: %requestId%",
    assistant_lost_connection: "Connection with the assistant is lost, redirecting you to another assistant...",

    // Ещё новые ключи
    session_ended: "Your session is over! If you have more questions, you can extend the session.",
    extend_session_button: "Extend",
    im_satisfied: "I am satisfied",
    complain: "Complain - It didn't help",
    assistant_bonus_awarded: "Congratulations! You have been awarded a bonus of %amount% coins for %periodCount% completed dialogues.",
    assistant_bonus_reason: "Bonus for %periodCount% completed dialogues",
    mentor_bonus_awarded: "Congratulations! You have been awarded a mentor bonus of %amount% coins for %periodCount% completed dialogues by your mentee.",
    new_request_from_user: "New request from user",
    accept: "Accept",
    reject: "Reject",
    assistant_blocked_due_to_rejects: "The assistant has been blocked due to exceeding the reject limit.",
    no_assistants_available: "No assistants available.",
    topic_of_request: "Request subject: %subject%",
    no_subject: "No subject for this request.",
    mentor_bonus_reason: "Mentor bonus for %periodCount% completed dialogues by mentee"
  },
} as const;



type TranslationKeys = keyof typeof translations.en;
export type TranslationKey = TranslationKeys;

export function getTranslation(lang: 'ru' | 'en', key: TranslationKey): string {
  return translations[lang][key] || translations['en'][key];
}


/**
 * Отправляет ассистенту напоминание о диалоге. 
 * Делает один раз, потом ещё 5 повторов (каждые 1с).
 */

export async function remindAssistant(conversation: Conversation & { assistantRequest: AssistantRequest }) {
  try {
    const assistantTelegramId = conversation.assistantId;
    const requestId = conversation.assistantRequest.id.toString();

    if (!assistantTelegramId) {
      console.log(
        `Невозможно напомнить ассистенту: assistantId отсутствует у диалога ID: ${conversation.id.toString()}`
      );
      return;
    }

    // 1) Находим ассистента в базе по telegramId
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: assistantTelegramId },
      select: { language: true },
    });

    // 2) Если ассистент не найден — выходим
    if (!assistant) {
      console.log(`В таблице Assistant не найден ассистент с telegramId = ${assistantTelegramId}`);
      return;
    }

    // Предположим, assistant.language может быть "en", "ru" или вообще любая строка.
    const recordLang = assistant.language; // это string | null | undefined

    // Объявляем переменную assistantLang типа "en" | "ru".
    let assistantLang: "en" | "ru" = "en"; // fallback

    if (recordLang === "ru") {
      assistantLang = "ru";
    }

    // 4) Текст первого напоминания
    //    Допустим, в translations есть ключ "assistant_reminder":
    //      "Пожалуйста, ответьте пользователю, запрос: %requestId%"
    let reminderText = getTranslation(assistantLang, "assistant_reminder");
    reminderText = reminderText.replace("%requestId%", requestId);

    // Отправляем первое сообщение ассистенту
    await sendTelegramMessageToAssistant(
      assistantTelegramId.toString(),
      reminderText
    );

    // Обновляем conversation: ставим reminderSent = true
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { reminderSent: true },
    });

    console.log(
      `Напоминание отправлено ассистенту ${assistantTelegramId.toString()} для диалога ${conversation.id.toString()}`
    );

    // 5) Ещё 5 повторных напоминаний
    for (let i = 1; i <= 5; i++) {
      // Допустим, для повторных напоминаний используем "assistant_reminderNumber":
      //    "Напоминание #%number%: ответьте пользователю, запрос: %requestId%"
      let repeatedText = getTranslation(assistantLang, "assistant_reminderNumber");
      repeatedText = repeatedText
        .replace("%requestId%", requestId)
        .replace("%number%", i.toString());

      await sendTelegramMessageToAssistant(
        assistantTelegramId.toString(),
        repeatedText
      );
      console.log(
        `Ассистенту ${assistantTelegramId.toString()} отправлено сообщение-напоминание номер ${i}`
      );
      // Ждём 1 секунду
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error("Ошибка в remindAssistant:", error);
    await sendLogToTelegram(`Error in remindAssistant: ${String(error)}`);
  }
}

export async function handleIgnoredConversation(conversation: Conversation & { assistantRequest: AssistantRequest }) {
  try {
    const assistantTelegramId = conversation.assistantId;
    const requestId = conversation.assistantRequest.id.toString();

    if (!assistantTelegramId) {
      console.log(
        `Невозможно обработать игнорированный диалог: assistantId отсутствует у диалога ID: ${conversation.id.toString()}`
      );
      return;
    }

    // 1) Блокируем ассистента (isBlocked = true)
    await prisma.assistant.update({
      where: { telegramId: assistantTelegramId },
      data: {
        isBlocked: true,
        unblockDate: null,
        activeConversationId: null,
      },
    });

    console.log(`Ассистент ${assistantTelegramId.toString()} был заблокирован навсегда.`);

    // 2) Считываем язык пользователя (fallback "en" если неизвестно)
    const userRecord = await prisma.user.findUnique({
      where: { telegramId: conversation.userId },
      select: { language: true },
    });

    // Сужаем до "en" | "ru" (или расширяем под ваши языки). Ниже fallback = "en".
    let userLang: "en" | "ru" = "en";
    if (userRecord?.language === "ru") {
      userLang = "ru";
    }

    // Допустим, у вас есть ключ "assistant_lost_connection" в переводах
    const lostConnectionMessage = getTranslation(userLang, "assistant_lost_connection");
    await sendTelegramMessageToUser(conversation.userId.toString(), lostConnectionMessage);

    console.log(`Пользователю ${conversation.userId.toString()} отправлено сообщение о переключении ассистента.`);

    // 3) Обновляем разговор: переводим в PENDING, сбрасываем userId -> 0, assistantId -> null
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: "PENDING",
        userId: BigInt(0),
        assistantId: null,
      },
    });

    // 4) Перенаправляем запрос следующему ассистенту
    await handleIgnoredRequest(requestId, assistantTelegramId);

    console.log(`Запрос ${requestId} перенаправлен следующему ассистенту.`);
  } catch (error) {
    console.error("Ошибка в handleIgnoredConversation:", error);
    await sendLogToTelegram(`Error in handleIgnoredConversation: ${String(error)}`);
  }
}
