import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        console.log('Starting POST request for generating current subscription names...');

        // Fetch all subscriptions
        const subscriptions = await prisma.subscription.findMany({
            select: {
                id: true,
                name: true,
                assistantRequestCount: true,
            },
            orderBy: {
                id: 'asc',
            },
        });

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No subscriptions found');
            return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
        }

        console.log('Subscriptions fetched:', subscriptions);

        // Generate updated names for the subscriptions
        const updatedSubscriptions = subscriptions.map((sub) => {
            let newName;

            // Сравниваем sub.id, если это BigInt, приводим к Number
            const subIdNum = Number(sub.id);
            const assistantRequests = sub.assistantRequestCount ?? 0;

            // Если нужно строго:
            // id=1 => "Простая", id=2 => "Сложная", id=3 => "Экспертная"
            // Иначе используем вашу логику "AI + X запросов" / "Только AI"
            if (subIdNum === 1) {
                newName = "Простая";
            } else if (subIdNum === 2) {
                newName = "Сложная";
            } else if (subIdNum === 3) {
                newName = "Экспертная";
            } else {
                // Например, если assistantRequestCount > 0 => "AI + X запросов ассистенту"
                // Иначе => "Только AI"
                if (assistantRequests > 0) {
                    newName = `AI`;
                } else {
                    newName = "Только AI";
                }
            }

            return {
                ...sub,
                id: sub.id.toString(), // Convert BigInt to string
                name: newName,
            };
        });

        console.log('Generated updated subscription names:', updatedSubscriptions);

        return NextResponse.json({
            message: 'Subscription names generated successfully',
            updatedSubscriptions,
        });
    } catch (error) {
        console.error('Error generating subscription names:', error);
        return NextResponse.json({ error: 'Failed to generate subscription names' }, { status: 500 });
    }
}
