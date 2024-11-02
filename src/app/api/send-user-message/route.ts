import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_USER_BOT_TOKEN = process.env.TELEGRAM_USER_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_USER_BOT_TOKEN}/sendMessage`;

export async function POST(request: NextRequest) {
    try {
        const { userId, message } = await request.json();

        if (!userId || !message) {
            return NextResponse.json({ error: 'User ID and message are required' }, { status: 400 });
        }

        const response = await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: userId,
                text: message,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.description || 'Failed to send message');
        }

        return NextResponse.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Error sending message' }, { status: 500 });
    }
}
