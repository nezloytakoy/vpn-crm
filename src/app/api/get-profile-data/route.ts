import { Bot } from 'grammy';
import { NextRequest, NextResponse } from 'next/server';

const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
const bot = new Bot(botToken!);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
        return NextResponse.json({ error: 'Telegram ID is missing' }, { status: 400 });
    }

    try {
        // Получаем данные о пользователе, включая юзернейм и аватар
        const userChat = await bot.api.getChat(Number(telegramId));
        const username = userChat.username || 'Username not set';

        // Получаем фото профиля
        const userProfilePhotos = await bot.api.getUserProfilePhotos(Number(telegramId));

        let avatarUrl = null;
        if (userProfilePhotos.total_count > 0) {
            const largestPhoto = userProfilePhotos.photos[0].pop();
            if (largestPhoto) {
                const file = await bot.api.getFile(largestPhoto.file_id);
                avatarUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
            }
        }

        // Возвращаем юзернейм и URL аватара
        return NextResponse.json({ username, avatarUrl });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }
}
