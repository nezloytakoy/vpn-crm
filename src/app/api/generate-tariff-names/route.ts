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
        const updatedSubscriptions = subscriptions.map((sub, index) => {
            let newName;
            if (index === subscriptions.length - 1) {
                newName = 'Только AI';
            } else {
                const assistantRequests = sub.assistantRequestCount ?? 0;
                newName = `AI + ${assistantRequests} запросов ассистенту`;
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
