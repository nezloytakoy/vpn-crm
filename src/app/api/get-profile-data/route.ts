import { Bot } from 'grammy';
import { NextApiRequest, NextApiResponse } from 'next';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Bot(botToken!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { telegramId } = req.query;

    if (!telegramId) {
        return res.status(400).json({ error: 'Telegram ID is missing' });
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
        res.status(200).json({ username, avatarUrl });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Error fetching user data' });
    }
}
