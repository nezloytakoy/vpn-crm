import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';


// Инициализация бота с токеном
const botToken = process.env.TELEGRAM_USER_BOT_TOKEN; // Убедитесь, что вы добавили токен в переменные окружения

if (!botToken) {
    throw new Error('Telegram bot token is missing in environment variables');
  }


const bot = new Bot(botToken);

// Функция для получения юзернейма и аватара
async function getUserData(userId: number) {
  try {
    // Получаем информацию о пользователе
    const userProfilePhotos = await bot.api.getUserProfilePhotos(userId);

    // Получаем юзернейм пользователя
    const chat = await bot.api.getChat(userId);
    const username = chat.username || `${chat.first_name} ${chat.last_name}`.trim() || 'User';

    let avatarUrl = null;

    // Если у пользователя есть аватары
    if (userProfilePhotos.total_count > 0) {
      const largestPhoto = userProfilePhotos.photos[0].pop();

      if (largestPhoto) {
        const file = await bot.api.getFile(largestPhoto.file_id);
        const filePath = file.file_path;
        avatarUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
      }
    }

    return { username, avatarUrl };
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    throw new Error('Failed to fetch user data');
  }
}

// Обработчик POST-запроса
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Не указан userId' }, { status: 400 });
    }

    // Получаем данные пользователя
    const userData = await getUserData(userId);

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error('Ошибка в обработчике роута:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
