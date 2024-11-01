// app/api/update-subscription-prices/route.js
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();


export async function POST(req: NextRequest) {
    try {
        const { prices }: { prices: number[] } = await req.json();

        await Promise.all(
            prices.map((price, index) => 
                prisma.subscription.update({
                    where: { id: index + 1 }, // предполагается, что тарифы имеют ID от 1 до 4
                    data: { price }
                })
            )
        );

        return new Response(JSON.stringify({ message: 'Тарифы успешно обновлены' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Ошибка при обновлении тарифов:', error);
        return new Response(JSON.stringify({ error: 'Ошибка при обновлении тарифов' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
