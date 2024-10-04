// Предполагая, что файл расположен по адресу app/api/initiate-ai-dialog/route.ts

export async function POST(request: Request) {
    try {
      console.log('Received a POST request to /api/initiate-ai-dialog');
  
      // Получаем данные из тела запроса
      const body = await request.json();
      console.log('Request body:', body);
      const { userId } = body;
  
      if (!userId) {
        console.error('No userId provided in the request body');
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
  
      console.log(`User ID received: ${userId}`);
  
      // Получаем токен бота из переменных окружения
      const BOT_TOKEN = process.env.TELEGRAM_USER_BOT_TOKEN;
      if (!BOT_TOKEN) {
        console.error('BOT_TOKEN is not set in environment variables');
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
  
      console.log('BOT_TOKEN is set');
  
      const messageText = 'Привет, я ИИ';
  
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
  
      console.log('Telegram API response:', result);
  
      if (!result.ok) {
        console.error('Error sending message via Bot API:', result.description);
        return new Response(JSON.stringify({ error: 'Failed to send message via Bot API', description: result.description }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
  
      console.log('Message sent successfully via Telegram Bot API');
  
      // Возвращаем успешный ответ
      return new Response(JSON.stringify({ message: 'AI dialog initiated' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Server error in /api/initiate-ai-dialog:', error);
  
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      return new Response(JSON.stringify({ error: 'Server error', message: errorMessage }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }
  