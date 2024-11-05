import { PrismaClient } from '@prisma/client';

export const revalidate = 1;

export const dynamic = 'force-dynamic'; 

const prisma = new PrismaClient();

export async function GET(request: Request): Promise<Response> {
    try {
        
        const url = new URL(request.url);
        const telegramId = url.searchParams.get('telegramId'); 

        if (!telegramId) {
            return new Response(
                JSON.stringify({ error: 'Telegram ID is required.' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        
        let telegramIdBigInt: bigint;
        try {
            telegramIdBigInt = BigInt(telegramId);
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid Telegram ID format.' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        
        const user = await prisma.user.findUnique({
            where: {
                telegramId: telegramIdBigInt,
            },
            include: {
                lastPaidSubscription: {
                    select: {
                        name: true,
                        description: true,
                        price: true,
                        aiRequestCount: true,
                        assistantRequestCount: true,
                        allowVoiceToAI: true,
                        allowVoiceToAssistant: true,
                        allowVideoToAssistant: true,
                        allowFilesToAssistant: true,
                    },
                },
            },
        });

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'User not found.' }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        
        if (!user.lastPaidSubscription) {
            return new Response(
                JSON.stringify({ error: 'No subscription found for this user.' }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        
        return new Response(
            JSON.stringify({ subscription: user.lastPaidSubscription }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('Error fetching subscription:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error.' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
