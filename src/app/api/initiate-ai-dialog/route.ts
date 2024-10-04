export async function POST(request: Request) {
    try {
      console.log('Получен POST-запрос к /api/initiate-ai-dialog');
  
      // Получаем данные из тела запроса
      const body = await request.json();
      console.log('Тело запроса:', body);
      const { userId, messageText } = body;
  
      if (!userId || !messageText) {
        console.error('userId или messageText не предоставлены в теле запроса');
        return new Response(JSON.stringify({ error: 'userId и messageText обязательны' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
  
      console.log(`Отправляем сообщение пользователю с ID: ${userId}`);
      console.log(`Текст сообщения: ${messageText}`);
  
      // Получаем токен бота из переменных окружения
      const BOT_TOKEN = process.env.TELEGRAM_USER_BOT_TOKEN;
      if (!BOT_TOKEN) {
        console.error('BOT_TOKEN не установлен в переменных окружения');
        return new Response(JSON.stringify({ error: 'Ошибка конфигурации сервера' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
  
      console.log('BOT_TOKEN установлен');
  
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
      // Отправляем POST-запрос к Bot API
      const telegramResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: userId,
          text: messageText,
        }),
      });
  
      const result = await telegramResponse.json();
  
      console.log('Ответ от Telegram API:', result);
  
      if (!result.ok) {
        console.error('Ошибка при отправке сообщения через Bot API:', result.description);
        return new Response(
          JSON.stringify({ error: 'Не удалось отправить сообщение через Bot API', description: result.description }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
  
      console.log('Сообщение успешно отправлено через Telegram Bot API');
  
      // Возвращаем успешный ответ
      return new Response(JSON.stringify({ message: 'AI dialog initiated' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Ошибка сервера в /api/initiate-ai-dialog:', error);
  
      let errorMessage = 'Неизвестная ошибка';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      return new Response(JSON.stringify({ error: 'Ошибка сервера', message: errorMessage }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }
  