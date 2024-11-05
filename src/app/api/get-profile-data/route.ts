import fetch from 'node-fetch';
import { Bot } from 'grammy';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 1;

const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
const bot = new Bot(botToken!);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
        return NextResponse.json({ error: 'Telegram ID is missing' }, { status: 400 });
    }

    try {
        
        const userChat = await bot.api.getChat(Number(telegramId));
        const username = userChat.username || 'Username not set';

        
        const userProfilePhotos = await bot.api.getUserProfilePhotos(Number(telegramId));

        let avatarBase64 = null;
        if (userProfilePhotos.total_count > 0) {
            const largestPhoto = userProfilePhotos.photos[0].pop();
            if (largestPhoto) {
                const file = await bot.api.getFile(largestPhoto.file_id);
                const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;

                
                const response = await fetch(fileUrl);
                const buffer = await response.arrayBuffer(); 
                const base64 = Buffer.from(buffer).toString('base64');
                avatarBase64 = `data:image/jpeg;base64,${base64}`;
            }
        }

        
        return NextResponse.json({
            username,
            avatarBase64: avatarBase64 ? avatarBase64 : null
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }
}
