import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        // Извлекаем query-параметры из URL
        const url = new URL(request.url);
        const telegramId = url.searchParams.get('telegramId'); // Получаем telegramId из query-параметра

        if (!telegramId) {
            return new Response(JSON.stringify({ error: 'Telegram ID is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Ищем пользователя по telegramId
        const user = await prisma.user.findUnique({
            where: {
                telegramId: BigInt(telegramId),
            },
        });

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Возвращаем информацию о подписке
        return new Response(JSON.stringify({ subscriptionType: user.subscriptionType }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching subscription:', error);
        return new Response(JSON.stringify({ error: 'Internal server error.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
