export async function sendTelegramMessageWithButtons(
    chatId: string,
    text: string,
    buttons: TelegramButton[]
  ) {
    const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: buttons.map((button) => [
            { text: button.text, callback_data: button.callback_data },
          ]),
        },
      }),
    });
  }


  type TelegramButton = {
    text: string;
    callback_data: string;
  };
  