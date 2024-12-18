import { Context } from 'grammy';

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
    no_text_message: "Пожалуйста, отправьте текстовое сообщение."
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
    no_text_message: "Please send a text message."
  }
} as const;

type TranslationKeys = keyof typeof translations.en;
export type TranslationKey = TranslationKeys;

export function getTranslation(lang: 'ru'|'en', key: TranslationKey): string {
  return translations[lang][key] || translations['en'][key];
}

export function detectUserLanguage(ctx: Context): 'ru'|'en' {
  const langCode = ctx.from?.language_code;
  return (langCode === 'ru' ? 'ru' : 'en');
}
