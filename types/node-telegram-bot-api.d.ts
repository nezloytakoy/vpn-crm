declare module 'node-telegram-bot-api' {
    export default class TelegramBot {
      constructor(token: string, options: { polling: boolean });
      on(event: string, callback: (msg: TelegramMessage) => void): void;
      sendMessage(chatId: number, text: string): void;
    }
  
    export interface TelegramMessage {
      message_id: number;
      from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username: string;
        language_code: string;
      };
      chat: {
        id: number;
        first_name: string;
        username: string;
        type: string;
      };
      date: number;
      text: string;
    }
  }
  